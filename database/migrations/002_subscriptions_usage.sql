-- =====================================================
-- Migration 002: Subscriptions & Usage Tracking
-- =====================================================
-- Purpose: Subscription management and usage quota enforcement
-- Dependencies: Migration 000 (User Management), Migration 001 (Features/Bundles)
-- Author: ImobiTools Architecture Team
-- Date: 2025-11-06
-- =====================================================

-- =====================================================
-- ENUMS: Subscription Types and Status
-- =====================================================

CREATE TYPE subscription_type AS ENUM (
  'feature',     -- Single feature subscription
  'bundle'       -- Bundle (multiple features) subscription
);

CREATE TYPE subscription_status AS ENUM (
  'trial',       -- Free trial period
  'active',      -- Active paid subscription
  'past_due',    -- Payment failed, grace period
  'canceled',    -- User canceled, still active until period end
  'expired'      -- Subscription ended
);

CREATE TYPE billing_interval AS ENUM (
  'monthly',
  'annual'
);

-- =====================================================
-- USER_SUBSCRIPTIONS: Active Subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription Target
  subscription_type subscription_type NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,

  -- Status and Billing
  status subscription_status NOT NULL DEFAULT 'active',
  billing_interval billing_interval NOT NULL DEFAULT 'monthly',

  -- Payment Information
  stripe_subscription_id TEXT,              -- Stripe subscription ID
  stripe_customer_id TEXT,                  -- Stripe customer ID
  payment_method_last4 TEXT,                -- Last 4 digits of card

  -- Pricing (stored at subscription time for historical accuracy)
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',

  -- Lifecycle Dates
  trial_start_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  current_period_start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end_at TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT subscription_target CHECK (
    (subscription_type = 'feature' AND feature_id IS NOT NULL AND bundle_id IS NULL) OR
    (subscription_type = 'bundle' AND bundle_id IS NOT NULL AND feature_id IS NULL)
  ),
  CONSTRAINT valid_trial_period CHECK (
    trial_start_at IS NULL OR trial_end_at IS NULL OR trial_end_at > trial_start_at
  ),
  CONSTRAINT valid_billing_period CHECK (
    current_period_end_at > current_period_start_at
  ),
  CONSTRAINT positive_amount CHECK (amount_paid > 0)
);

-- Indexes for Performance
CREATE INDEX idx_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_feature_id ON user_subscriptions(feature_id) WHERE feature_id IS NOT NULL;
CREATE INDEX idx_subscriptions_bundle_id ON user_subscriptions(bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe ON user_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_period ON user_subscriptions(current_period_end_at);

-- Updated timestamp trigger
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FEATURE_USAGE: Usage Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Reference (NULL for anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,                          -- For anonymous user tracking

  -- Feature Reference
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,

  -- Usage Details
  action TEXT NOT NULL,                     -- e.g., 'calculate', 'export', 'simulate'
  metadata JSONB DEFAULT '{}'::JSONB,       -- Action-specific data

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_or_session CHECK (
    user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

-- Indexes for Performance
CREATE INDEX idx_usage_user_id ON feature_usage(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_usage_session_id ON feature_usage(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_usage_feature_id ON feature_usage(feature_id);
CREATE INDEX idx_usage_created_at ON feature_usage(created_at DESC);

-- Composite index for quota checks
CREATE INDEX idx_usage_user_feature_date ON feature_usage(user_id, feature_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_usage_session_feature_date ON feature_usage(session_id, feature_id, created_at DESC) WHERE session_id IS NOT NULL;

-- =====================================================
-- HELPER FUNCTIONS: Access Control
-- =====================================================

-- Core function: Check if user can access a feature
CREATE OR REPLACE FUNCTION can_access_feature(
  feature_slug_param TEXT,
  user_uuid UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  feature_record RECORD;
  usage_count INTEGER;
  active_subscription RECORD;
  is_authenticated BOOLEAN;
  result JSONB;
BEGIN
  -- Get feature details
  SELECT * INTO feature_record
  FROM features
  WHERE slug = feature_slug_param AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'feature_not_found',
      'message', 'Feature not found or inactive'
    );
  END IF;

  -- Check if user is authenticated
  is_authenticated := (user_uuid IS NOT NULL);

  -- STAFF ALWAYS HAVE ACCESS
  IF is_authenticated AND is_staff(user_uuid) THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'reason', 'staff_access',
      'message', 'Staff have unlimited access',
      'usage_count', 0,
      'limit', NULL
    );
  END IF;

  -- CHECK FOR ACTIVE SUBSCRIPTION (Feature or Bundle)
  IF is_authenticated THEN
    SELECT * INTO active_subscription
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid
      AND us.status IN ('trial', 'active')
      AND us.current_period_end_at > NOW()
      AND (
        -- Direct feature subscription
        (us.subscription_type = 'feature' AND us.feature_id = feature_record.id)
        OR
        -- Bundle containing feature
        (us.subscription_type = 'bundle' AND EXISTS (
          SELECT 1 FROM bundle_features bf
          WHERE bf.bundle_id = us.bundle_id
            AND bf.feature_id = feature_record.id
        ))
      )
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'subscription_access',
        'subscription_type', active_subscription.subscription_type,
        'subscription_id', active_subscription.id,
        'message', 'Active subscription',
        'usage_count', 0,
        'limit', NULL
      );
    END IF;
  END IF;

  -- COUNT USAGE (last 30 days)
  IF is_authenticated THEN
    SELECT COUNT(*) INTO usage_count
    FROM feature_usage
    WHERE feature_id = feature_record.id
      AND user_id = user_uuid
      AND created_at > NOW() - INTERVAL '30 days';
  ELSE
    SELECT COUNT(*) INTO usage_count
    FROM feature_usage
    WHERE feature_id = feature_record.id
      AND session_id = session_id_param
      AND created_at > NOW() - INTERVAL '30 days';
  END IF;

  -- CHECK AGAINST LIMITS
  IF is_authenticated THEN
    -- Logged-in free tier
    IF usage_count < feature_record.logged_in_free_limit THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'free_tier_logged_in',
        'usage_count', usage_count,
        'limit', feature_record.logged_in_free_limit,
        'remaining', feature_record.logged_in_free_limit - usage_count,
        'message', format('Free tier: %s/%s uses', usage_count, feature_record.logged_in_free_limit)
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'quota_exceeded',
        'usage_count', usage_count,
        'limit', feature_record.logged_in_free_limit,
        'message', 'Free quota exceeded. Please subscribe.',
        'upgrade_required', TRUE,
        'feature_price', feature_record.monthly_price
      );
    END IF;
  ELSE
    -- Anonymous free tier
    IF usage_count < feature_record.anonymous_limit THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'free_tier_anonymous',
        'usage_count', usage_count,
        'limit', feature_record.anonymous_limit,
        'remaining', feature_record.anonymous_limit - usage_count,
        'message', format('Free tier: %s/%s uses (login for more)', usage_count, feature_record.anonymous_limit)
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'quota_exceeded',
        'usage_count', usage_count,
        'limit', feature_record.anonymous_limit,
        'message', 'Free quota exceeded. Please login or subscribe.',
        'login_required', TRUE,
        'logged_in_limit', feature_record.logged_in_free_limit
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Record feature usage
CREATE OR REPLACE FUNCTION record_feature_usage(
  feature_slug_param TEXT,
  action_param TEXT DEFAULT 'use',
  user_uuid UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::JSONB,
  ip_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  feature_record RECORD;
  access_check JSONB;
  usage_id UUID;
BEGIN
  -- Check access first
  access_check := can_access_feature(feature_slug_param, user_uuid, session_id_param);

  IF NOT (access_check->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'access_denied',
      'details', access_check
    );
  END IF;

  -- Get feature ID
  SELECT id INTO feature_record FROM features WHERE slug = feature_slug_param;

  -- Record usage
  INSERT INTO feature_usage (
    user_id,
    session_id,
    feature_id,
    action,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    user_uuid,
    session_id_param,
    feature_record.id,
    action_param,
    metadata_param,
    ip_param,
    user_agent_param
  )
  RETURNING id INTO usage_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'usage_id', usage_id,
    'access_info', access_check
  );
END;
$$ LANGUAGE plpgsql;

-- Get user's active subscriptions
CREATE OR REPLACE FUNCTION get_user_subscriptions(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  type subscription_type,
  status subscription_status,
  feature_slug TEXT,
  bundle_slug TEXT,
  amount DECIMAL,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    us.subscription_type,
    us.status,
    f.slug,
    b.slug,
    us.amount_paid,
    us.current_period_end_at
  FROM user_subscriptions us
  LEFT JOIN features f ON us.feature_id = f.id
  LEFT JOIN bundles b ON us.bundle_id = b.id
  WHERE us.user_id = user_uuid
    AND us.status IN ('trial', 'active', 'past_due')
  ORDER BY us.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get usage statistics for a user
CREATE OR REPLACE FUNCTION get_user_usage_stats(
  user_uuid UUID,
  period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  feature_slug TEXT,
  feature_name TEXT,
  usage_count BIGINT,
  limit_amount INTEGER,
  has_subscription BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.slug,
    f.name,
    COUNT(fu.id),
    f.logged_in_free_limit,
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = user_uuid
        AND us.status IN ('trial', 'active')
        AND us.current_period_end_at > NOW()
        AND (
          (us.subscription_type = 'feature' AND us.feature_id = f.id)
          OR
          (us.subscription_type = 'bundle' AND EXISTS (
            SELECT 1 FROM bundle_features bf
            WHERE bf.bundle_id = us.bundle_id AND bf.feature_id = f.id
          ))
        )
    )
  FROM features f
  LEFT JOIN feature_usage fu ON f.id = fu.feature_id
    AND fu.user_id = user_uuid
    AND fu.created_at > NOW() - (period_days || ' days')::INTERVAL
  WHERE f.status = 'active'
  GROUP BY f.id, f.slug, f.name, f.logged_in_free_limit
  ORDER BY COUNT(fu.id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-expire subscriptions (should be run by cron job)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET
    status = 'expired',
    ended_at = NOW()
  WHERE status IN ('active', 'canceled')
    AND current_period_end_at < NOW()
    AND ended_at IS NULL;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- User Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User Subscriptions: Staff can view all subscriptions
CREATE POLICY "Staff can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (is_staff(auth.uid()));

-- User Subscriptions: Only system can insert/update subscriptions
-- (handled by backend API with service role key)
CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_subscriptions')
  );

-- Feature Usage: Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Feature Usage: Staff can view all usage
CREATE POLICY "Staff can view all usage"
  ON feature_usage FOR SELECT
  USING (is_staff(auth.uid()));

-- Feature Usage: Anyone can insert usage (controlled by function)
CREATE POLICY "System can record usage"
  ON feature_usage FOR INSERT
  WITH CHECK (TRUE);  -- Access control is in record_feature_usage function

-- =====================================================
-- COMMENTS: Documentation
-- =====================================================

COMMENT ON TABLE user_subscriptions IS 'User subscriptions to features or bundles with billing information';
COMMENT ON TABLE feature_usage IS 'Usage tracking for quota enforcement (supports anonymous via session_id)';

COMMENT ON FUNCTION can_access_feature(TEXT, UUID, TEXT) IS 'Core access control: checks if user/session can access feature based on subscription or quota';
COMMENT ON FUNCTION record_feature_usage(TEXT, TEXT, UUID, TEXT, JSONB, INET, TEXT) IS 'Record feature usage and enforce access control';
COMMENT ON FUNCTION get_user_subscriptions(UUID) IS 'Get all active subscriptions for a user';
COMMENT ON FUNCTION get_user_usage_stats(UUID, INTEGER) IS 'Get usage statistics across all features for a user';
COMMENT ON FUNCTION expire_subscriptions() IS 'Cron job function to expire past-due subscriptions';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test access control:
-- SELECT can_access_feature('profitability-calculator', NULL, 'session-123');
-- SELECT can_access_feature('profitability-calculator', 'user-uuid-here', NULL);

-- Test usage recording:
-- SELECT record_feature_usage('profitability-calculator', 'calculate', NULL, 'session-123');

-- View subscriptions:
-- SELECT * FROM get_user_subscriptions('user-uuid-here');

-- View usage stats:
-- SELECT * FROM get_user_usage_stats('user-uuid-here', 30);

-- =====================================================
-- END OF MIGRATION 002
-- =====================================================
