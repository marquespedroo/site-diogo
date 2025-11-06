-- =====================================================
-- CONSOLIDATED MIGRATION - ImobiTools
-- =====================================================
-- Execute this entire file in Supabase SQL Editor
-- Project: https://imobtools.supabase.co
--
-- Instructions:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" or press Cmd/Ctrl + Enter
-- 4. Verify success (should see "Success. No rows returned")
-- =====================================================

-- =====================================================
-- MIGRATION 000: USER MANAGEMENT FOUNDATION
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('client', 'support', 'admin', 'owner');
CREATE TYPE account_status AS ENUM ('pending_verification', 'active', 'suspended', 'deactivated', 'banned');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  account_status account_status NOT NULL DEFAULT 'pending_verification',
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  creci TEXT,
  cnpj TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referred_by UUID REFERENCES profiles(id),
  preferences JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-()]+$'),
  CONSTRAINT valid_creci CHECK (creci IS NULL OR LENGTH(creci) >= 3),
  CONSTRAINT valid_cnpj CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$')
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(account_status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Staff permissions table
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_subscriptions BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_features BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_content BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_analytics BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_staff BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_billing BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT one_permission_per_user UNIQUE(user_id)
);

CREATE INDEX idx_staff_permissions_user_id ON staff_permissions(user_id);

-- Helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND role IN ('support', 'admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = user_uuid;
  IF user_role_val = 'owner' THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM staff_permissions
    WHERE user_id = user_uuid
    AND CASE permission_name
      WHEN 'manage_users' THEN can_manage_users
      WHEN 'manage_subscriptions' THEN can_manage_subscriptions
      WHEN 'manage_features' THEN can_manage_features
      WHEN 'manage_content' THEN can_manage_content
      WHEN 'view_analytics' THEN can_view_analytics
      WHEN 'manage_staff' THEN can_manage_staff
      WHEN 'manage_billing' THEN can_manage_billing
      ELSE FALSE
    END = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to validate staff permissions
CREATE OR REPLACE FUNCTION validate_staff_permissions()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role_val FROM profiles WHERE id = NEW.user_id;

  -- Check if user is staff
  IF user_role_val NOT IN ('support', 'admin', 'owner') THEN
    RAISE EXCEPTION 'Only staff members (support, admin, owner) can have permissions';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_staff_permissions
  BEFORE INSERT OR UPDATE ON staff_permissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_staff_permissions();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email_verified_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NOW() ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()) AND account_status = (SELECT account_status FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can update profiles" ON profiles FOR UPDATE USING (is_staff(auth.uid()) AND has_permission(auth.uid(), 'manage_users'));
CREATE POLICY "Users can view own permissions" ON staff_permissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage staff permissions" ON staff_permissions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- =====================================================
-- MIGRATION 001: FEATURES & BUNDLES
-- =====================================================

CREATE TYPE feature_status AS ENUM ('draft', 'active', 'deprecated', 'disabled');
CREATE TYPE feature_category AS ENUM ('calculator', 'analysis', 'management', 'reporting', 'integration');

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category feature_category NOT NULL,
  status feature_status NOT NULL DEFAULT 'active',
  anonymous_limit INTEGER NOT NULL DEFAULT 3,
  logged_in_free_limit INTEGER NOT NULL DEFAULT 10,
  monthly_price DECIMAL(10, 2),
  annual_price DECIMAL(10, 2),
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  requires_authentication BOOLEAN NOT NULL DEFAULT FALSE,
  is_beta BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_limits CHECK (anonymous_limit >= 0 AND logged_in_free_limit >= 0),
  CONSTRAINT positive_prices CHECK ((monthly_price IS NULL OR monthly_price > 0) AND (annual_price IS NULL OR annual_price > 0)),
  CONSTRAINT annual_discount CHECK (annual_price IS NULL OR monthly_price IS NULL OR annual_price < (monthly_price * 12))
);

CREATE INDEX idx_features_slug ON features(slug);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_features_display_order ON features(display_order);

CREATE TRIGGER set_features_updated_at BEFORE UPDATE ON features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status feature_status NOT NULL DEFAULT 'active',
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2),
  discount_percentage INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  features_list TEXT[],
  cta_text TEXT DEFAULT 'Subscribe Now',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  CONSTRAINT valid_bundle_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_bundle_prices CHECK (monthly_price > 0 AND (annual_price IS NULL OR annual_price > 0)),
  CONSTRAINT valid_discount CHECK (discount_percentage BETWEEN 0 AND 100),
  CONSTRAINT annual_bundle_discount CHECK (annual_price IS NULL OR annual_price < (monthly_price * 12))
);

CREATE INDEX idx_bundles_slug ON bundles(slug);
CREATE INDEX idx_bundles_status ON bundles(status);
CREATE INDEX idx_bundles_display_order ON bundles(display_order);

CREATE TRIGGER set_bundles_updated_at BEFORE UPDATE ON bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS bundle_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  custom_limit INTEGER,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_bundle_feature UNIQUE(bundle_id, feature_id)
);

CREATE INDEX idx_bundle_features_bundle ON bundle_features(bundle_id);
CREATE INDEX idx_bundle_features_feature ON bundle_features(feature_id);

-- RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active features" ON features FOR SELECT USING (status = 'active' OR is_staff(auth.uid()));
CREATE POLICY "Anyone can view active bundles" ON bundles FOR SELECT USING (status = 'active' OR is_staff(auth.uid()));
CREATE POLICY "Anyone can view bundle_features" ON bundle_features FOR SELECT USING (TRUE);
CREATE POLICY "Staff can manage features" ON features FOR ALL USING (is_staff(auth.uid()) AND has_permission(auth.uid(), 'manage_features'));
CREATE POLICY "Staff can manage bundles" ON bundles FOR ALL USING (is_staff(auth.uid()) AND has_permission(auth.uid(), 'manage_features'));
CREATE POLICY "Staff can manage bundle_features" ON bundle_features FOR ALL USING (is_staff(auth.uid()) AND has_permission(auth.uid(), 'manage_features'));

-- Seed features
INSERT INTO features (slug, name, description, category, status, anonymous_limit, logged_in_free_limit, monthly_price, icon, color, display_order, requires_authentication) VALUES
  ('profitability-calculator', 'Calculadora de Rentabilidade', 'Calculadora completa de análise de viabilidade econômica de empreendimentos imobiliários', 'calculator', 'active', 3, 10, 49.90, 'calculator', '#1976d2', 1, FALSE),
  ('market-study', 'Estudo de Mercado', 'Análise comparativa de mercado com dados de concorrência e benchmarking', 'analysis', 'active', 2, 5, 79.90, 'chart-bar', '#4caf50', 2, FALSE),
  ('project-management', 'Gestão de Projetos', 'Gerenciamento completo de projetos com unidades, permutantes e fluxo de caixa', 'management', 'active', 0, 3, 99.90, 'building', '#ff9800', 3, TRUE),
  ('cash-flow-calculator', 'Calculadora de Fluxo de Pagamento', 'Planejamento detalhado de fluxo de pagamentos em múltiplas fases do empreendimento', 'calculator', 'draft', 3, 10, 59.90, 'cash-register', '#9c27b0', 4, FALSE),
  ('financing-simulator', 'Simulador de Financiamento', 'Simulação de capacidade de financiamento e cálculo de parcelas (PRICE e SAC)', 'calculator', 'draft', 5, 15, 39.90, 'percentage', '#f44336', 5, FALSE),
  ('export-reports', 'Exportação de Relatórios', 'Exportação de estudos e análises em PDF, Excel e CSV', 'reporting', 'active', 1, 5, 29.90, 'download', '#607d8b', 6, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Seed bundles
INSERT INTO bundles (slug, name, description, status, monthly_price, annual_price, discount_percentage, icon, color, display_order, is_popular, is_featured, features_list, cta_text) VALUES
  ('starter', 'Plano Starter', 'Ideal para corretores e pequenos investidores', 'active', 99.90, 999.00, 17, 'rocket', '#1976d2', 1, FALSE, FALSE, ARRAY['Calculadora de Rentabilidade (ilimitado)', 'Simulador de Financiamento (ilimitado)', 'Exportação de Relatórios (5/mês)', 'Suporte por email'], 'Começar Agora'),
  ('professional', 'Plano Professional', 'Para incorporadoras e profissionais do setor', 'active', 249.90, 2499.00, 17, 'briefcase', '#4caf50', 2, TRUE, TRUE, ARRAY['Todos os recursos do Starter', 'Estudo de Mercado (ilimitado)', 'Gestão de Projetos (ilimitado)', 'Calculadora de Fluxo (ilimitado)', 'Exportação de Relatórios (ilimitado)', 'Suporte prioritário'], 'Assinar Professional'),
  ('enterprise', 'Plano Enterprise', 'Solução completa para grandes incorporadoras', 'active', 499.90, 4999.00, 17, 'office-building', '#ff9800', 3, FALSE, TRUE, ARRAY['Todos os recursos do Professional', 'API de integração', 'Dashboards customizados', 'Suporte dedicado', 'Treinamento da equipe', 'SLA garantido'], 'Falar com Vendas')
ON CONFLICT (slug) DO NOTHING;

-- Link features to bundles
INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT b.id, f.id, NULL FROM bundles b CROSS JOIN features f
WHERE b.slug = 'starter' AND f.slug IN ('profitability-calculator', 'financing-simulator')
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT b.id, f.id, CASE WHEN f.slug = 'export-reports' THEN 5 ELSE NULL END FROM bundles b CROSS JOIN features f
WHERE b.slug = 'starter' AND f.slug = 'export-reports'
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT b.id, f.id, NULL FROM bundles b CROSS JOIN features f
WHERE b.slug = 'professional' AND f.slug IN ('profitability-calculator', 'financing-simulator', 'market-study', 'project-management', 'cash-flow-calculator', 'export-reports')
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT b.id, f.id, NULL FROM bundles b CROSS JOIN features f
WHERE b.slug = 'enterprise' AND f.status IN ('active', 'draft')
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

-- =====================================================
-- MIGRATION 002: SUBSCRIPTIONS & USAGE
-- =====================================================

CREATE TYPE subscription_type AS ENUM ('feature', 'bundle');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE billing_interval AS ENUM ('monthly', 'annual');

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type subscription_type NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  billing_interval billing_interval NOT NULL DEFAULT 'monthly',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  payment_method_last4 TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  trial_start_at TIMESTAMPTZ,
  trial_end_at TIMESTAMPTZ,
  current_period_start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end_at TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_target CHECK ((subscription_type = 'feature' AND feature_id IS NOT NULL AND bundle_id IS NULL) OR (subscription_type = 'bundle' AND bundle_id IS NOT NULL AND feature_id IS NULL)),
  CONSTRAINT valid_trial_period CHECK (trial_start_at IS NULL OR trial_end_at IS NULL OR trial_end_at > trial_start_at),
  CONSTRAINT valid_billing_period CHECK (current_period_end_at > current_period_start_at),
  CONSTRAINT positive_amount CHECK (amount_paid > 0)
);

CREATE INDEX idx_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_feature_id ON user_subscriptions(feature_id) WHERE feature_id IS NOT NULL;
CREATE INDEX idx_subscriptions_bundle_id ON user_subscriptions(bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe ON user_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_subscriptions_period ON user_subscriptions(current_period_end_at);

CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_usage_user_id ON feature_usage(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_usage_session_id ON feature_usage(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_usage_feature_id ON feature_usage(feature_id);
CREATE INDEX idx_usage_created_at ON feature_usage(created_at DESC);
CREATE INDEX idx_usage_user_feature_date ON feature_usage(user_id, feature_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_usage_session_feature_date ON feature_usage(session_id, feature_id, created_at DESC) WHERE session_id IS NOT NULL;

-- Core access control function
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
BEGIN
  SELECT * INTO feature_record FROM features WHERE slug = feature_slug_param AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('allowed', FALSE, 'reason', 'feature_not_found', 'message', 'Feature not found or inactive'); END IF;

  is_authenticated := (user_uuid IS NOT NULL);

  IF is_authenticated AND is_staff(user_uuid) THEN
    RETURN jsonb_build_object('allowed', TRUE, 'reason', 'staff_access', 'message', 'Staff have unlimited access', 'usage_count', 0, 'limit', NULL);
  END IF;

  IF is_authenticated THEN
    SELECT * INTO active_subscription FROM user_subscriptions us
    WHERE us.user_id = user_uuid AND us.status IN ('trial', 'active') AND us.current_period_end_at > NOW()
    AND ((us.subscription_type = 'feature' AND us.feature_id = feature_record.id) OR (us.subscription_type = 'bundle' AND EXISTS (SELECT 1 FROM bundle_features bf WHERE bf.bundle_id = us.bundle_id AND bf.feature_id = feature_record.id))) LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('allowed', TRUE, 'reason', 'subscription_access', 'subscription_type', active_subscription.subscription_type, 'subscription_id', active_subscription.id, 'message', 'Active subscription', 'usage_count', 0, 'limit', NULL);
    END IF;
  END IF;

  IF is_authenticated THEN
    SELECT COUNT(*) INTO usage_count FROM feature_usage WHERE feature_id = feature_record.id AND user_id = user_uuid AND created_at > NOW() - INTERVAL '30 days';
  ELSE
    SELECT COUNT(*) INTO usage_count FROM feature_usage WHERE feature_id = feature_record.id AND session_id = session_id_param AND created_at > NOW() - INTERVAL '30 days';
  END IF;

  IF is_authenticated THEN
    IF usage_count < feature_record.logged_in_free_limit THEN
      RETURN jsonb_build_object('allowed', TRUE, 'reason', 'free_tier_logged_in', 'usage_count', usage_count, 'limit', feature_record.logged_in_free_limit, 'remaining', feature_record.logged_in_free_limit - usage_count, 'message', format('Free tier: %s/%s uses', usage_count, feature_record.logged_in_free_limit));
    ELSE
      RETURN jsonb_build_object('allowed', FALSE, 'reason', 'quota_exceeded', 'usage_count', usage_count, 'limit', feature_record.logged_in_free_limit, 'message', 'Free quota exceeded. Please subscribe.', 'upgrade_required', TRUE, 'feature_price', feature_record.monthly_price);
    END IF;
  ELSE
    IF usage_count < feature_record.anonymous_limit THEN
      RETURN jsonb_build_object('allowed', TRUE, 'reason', 'free_tier_anonymous', 'usage_count', usage_count, 'limit', feature_record.anonymous_limit, 'remaining', feature_record.anonymous_limit - usage_count, 'message', format('Free tier: %s/%s uses (login for more)', usage_count, feature_record.anonymous_limit));
    ELSE
      RETURN jsonb_build_object('allowed', FALSE, 'reason', 'quota_exceeded', 'usage_count', usage_count, 'limit', feature_record.anonymous_limit, 'message', 'Free quota exceeded. Please login or subscribe.', 'login_required', TRUE, 'logged_in_limit', feature_record.logged_in_free_limit);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

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
  access_check := can_access_feature(feature_slug_param, user_uuid, session_id_param);
  IF NOT (access_check->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'access_denied', 'details', access_check);
  END IF;

  SELECT id INTO feature_record FROM features WHERE slug = feature_slug_param;
  INSERT INTO feature_usage (user_id, session_id, feature_id, action, metadata, ip_address, user_agent)
  VALUES (user_uuid, session_id_param, feature_record.id, action_param, metadata_param, ip_param, user_agent_param)
  RETURNING id INTO usage_id;

  RETURN jsonb_build_object('success', TRUE, 'usage_id', usage_id, 'access_info', access_check);
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all subscriptions" ON user_subscriptions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can manage subscriptions" ON user_subscriptions FOR ALL USING (is_staff(auth.uid()) AND has_permission(auth.uid(), 'manage_subscriptions'));
CREATE POLICY "Users can view own usage" ON feature_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all usage" ON feature_usage FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can record usage" ON feature_usage FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All migrations completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - profiles (user management)';
  RAISE NOTICE '  - staff_permissions (role-based access)';
  RAISE NOTICE '  - features (feature catalog)';
  RAISE NOTICE '  - bundles (subscription plans)';
  RAISE NOTICE '  - bundle_features (feature packages)';
  RAISE NOTICE '  - user_subscriptions (active subscriptions)';
  RAISE NOTICE '  - feature_usage (usage tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'Seeded data:';
  RAISE NOTICE '  - 6 features';
  RAISE NOTICE '  - 3 bundles (Starter, Professional, Enterprise)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Enable Authentication in Supabase Dashboard';
  RAISE NOTICE '  2. Set VITE_FEATURE_AUTH=true in .env';
  RAISE NOTICE '  3. Create your first user and promote to owner role';
END $$;
