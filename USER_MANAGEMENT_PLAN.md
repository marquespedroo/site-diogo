# 🔐 **Enterprise User Management & Subscription System**
## **Comprehensive PostgreSQL Database Design**

---

## **🚨 CRITICAL FINDINGS - Current State Analysis**

### **Problems Discovered**

❌ **No Users Table** - `user_id` fields exist but reference nothing
❌ **Inconsistent Patterns** - 3 different user_id approaches across migrations
❌ **Inadequate Subscription System** - Existing `004_payment_schema.sql` is too simplistic
❌ **No Feature Catalog** - Can't manage features dynamically
❌ **No Usage Tracking** - Can't enforce quotas
❌ **No Staff Roles** - Can't distinguish clients from internal team
❌ **Wrong Constraint** - Prevents multiple subscriptions (we need feature + bundle subscriptions)

### **Current Patterns Breakdown**

| Migration | user_id Type | Auth Pattern | Status |
|-----------|--------------|--------------|--------|
| 001_initial_schema | TEXT | `current_setting('app.current_user_id')` | ❌ Wrong |
| 002_market_study | UUID | `auth.users(id)` FK + `auth.uid()` | ✅ Correct |
| 003_projects | UUID | `auth.uid()` | ✅ Correct |
| 004_payment | TEXT | `current_setting('app.current_user_id')` | ❌ Wrong |

**Verdict**: Migrations 002 and 003 use **Supabase Auth correctly**. Others need migration.

---

## **🎯 Business Requirements Analysis**

### **User Tiers**

```
┌─────────────────────────────────────────────────────────────┐
│                    USAGE TIER MATRIX                         │
├─────────────────┬───────────────────────────────────────────┤
│ ANONYMOUS       │ Limited uses per feature (e.g., 3 uses)   │
│ (No login)      │ IP-based tracking, no persistence         │
├─────────────────┼───────────────────────────────────────────┤
│ LOGGED-IN FREE  │ Enhanced limits (e.g., 10 uses/month)     │
│ (Registered)    │ Usage tracked by user_id                  │
├─────────────────┼───────────────────────────────────────────┤
│ FEATURE SUB     │ Unlimited access to specific feature(s)   │
│ (Pay per feat.) │ Subscribe to individual features          │
├─────────────────┼───────────────────────────────────────────┤
│ BUNDLE SUB      │ Unlimited access to feature bundle        │
│ (Package deal)  │ E.g., "Calculadoras Premium" bundle       │
└─────────────────┴───────────────────────────────────────────┘
```

### **User Roles**

```
┌──────────────────────────────────────────────────────┐
│                   ROLE HIERARCHY                     │
├──────────────┬───────────────────────────────────────┤
│ CLIENT       │ End users (anonymous + logged-in)     │
│              │ Access features based on subscription │
├──────────────┼───────────────────────────────────────┤
│ STAFF        │ Internal team members                 │
│  ├─ SUPPORT  │ Can view user data, help customers    │
│  ├─ ADMIN    │ Can manage features, bundles, pricing │
│  └─ OWNER    │ Full system access                    │
└──────────────┴───────────────────────────────────────┘
```

### **Feature Management Requirements**

✅ **Dynamic Feature Catalog** - Add features without code changes
✅ **Flexible Pricing** - Per-feature and bundle pricing
✅ **Usage Quotas** - Different limits for different tiers
✅ **Quota Enforcement** - Automatic blocking when limit reached
✅ **Usage Tracking** - Detailed logs for analytics
✅ **Bundle Management** - Create/modify feature bundles dynamically

---

## **🏗️ Database Schema Design - Enterprise Level**

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                   SCHEMA ARCHITECTURE                        │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ Supabase     │      │   profiles   │                    │
│  │ auth.users   │◄─────│  (extended)  │                    │
│  └──────────────┘      └──────┬───────┘                    │
│                               │                             │
│                               │                             │
│  ┌────────────┐    ┌──────────▼──────────┐                │
│  │  features  │    │   user_subscriptions│                │
│  │ (catalog)  │    └──────────┬──────────┘                │
│  └─────┬──────┘              │                             │
│        │                      │                             │
│        │      ┌───────────────▼──────────┐                 │
│        └─────►│    feature_usage        │                 │
│               │  (tracking & quotas)    │                 │
│               └─────────────────────────┘                 │
│                                                             │
│  ┌──────────┐      ┌─────────────────┐                   │
│  │ bundles  │◄─────│ bundle_features │                   │
│  └──────────┘      └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## **📋 Complete Database Schema**

### **Migration 000: User Management Foundation**

```sql
-- ============================================================================
-- USER MANAGEMENT & AUTHENTICATION FOUNDATION
-- Migration: 000_user_management.sql
-- Description: Comprehensive user management, roles, and profiles
-- Dependencies: Supabase Auth (auth.users table)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext"; -- Case-insensitive text

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('client', 'support', 'admin', 'owner');

-- Account status enum
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deactivated', 'pending_verification');

-- ============================================================================
-- PROFILES TABLE (Extended User Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Links to Supabase Auth
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Info
  full_name TEXT,
  display_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,

  -- Role & Status
  role user_role NOT NULL DEFAULT 'client',
  account_status account_status NOT NULL DEFAULT 'pending_verification',

  -- Business Info (for B2B clients)
  tax_id TEXT, -- CPF or CNPJ
  company_address JSONB,

  -- Preferences
  preferences JSONB DEFAULT '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "email_notifications": true,
    "marketing_emails": false
  }'::jsonb,

  -- Analytics
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT tax_id_format CHECK (tax_id IS NULL OR length(tax_id) BETWEEN 11 AND 18)
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_company_name ON profiles(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX idx_profiles_full_name_search ON profiles USING GIN(to_tsvector('portuguese', full_name));

-- ============================================================================
-- STAFF PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE (user_id, permission)
);

CREATE INDEX idx_staff_permissions_user_id ON staff_permissions(user_id);
CREATE INDEX idx_staff_permissions_permission ON staff_permissions(permission);

-- Permission examples:
-- 'users:read', 'users:write', 'users:delete'
-- 'subscriptions:read', 'subscriptions:write'
-- 'features:manage', 'bundles:manage', 'pricing:manage'
-- 'support:tickets', 'support:chat'

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would be on auth.sessions or similar
-- Implementation depends on how you're tracking logins

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (OLD.role = NEW.role OR is_staff(auth.uid())) -- Only staff can change roles
  );

-- Profiles: Staff can view all profiles
CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (is_staff(auth.uid()));

-- Profiles: Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (has_permission(auth.uid(), 'users:write'));

-- Staff Permissions: Admins can manage
CREATE POLICY "Admins can manage staff permissions"
  ON staff_permissions FOR ALL
  USING (has_permission(auth.uid(), 'users:write'));

-- Staff Permissions: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON staff_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is staff
CREATE OR REPLACE FUNCTION is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
    AND role IN ('support', 'admin', 'owner')
    AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val
  FROM profiles
  WHERE id = user_uuid AND account_status = 'active';

  -- Owners have all permissions
  IF user_role_val = 'owner' THEN
    RETURN TRUE;
  END IF;

  -- Admins have most permissions
  IF user_role_val = 'admin' AND permission_name NOT LIKE 'system:%' THEN
    RETURN TRUE;
  END IF;

  -- Check explicit permissions
  RETURN EXISTS (
    SELECT 1 FROM staff_permissions
    WHERE user_id = user_uuid
    AND permission = permission_name
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's active subscription features
CREATE OR REPLACE FUNCTION get_user_features(user_uuid UUID)
RETURNS TABLE (feature_id UUID, feature_slug TEXT, unlimited BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.slug,
    TRUE as unlimited
  FROM features f
  INNER JOIN bundle_features bf ON f.id = bf.feature_id
  INNER JOIN user_subscriptions us ON bf.bundle_id = us.bundle_id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
  UNION
  SELECT
    f.id,
    f.slug,
    TRUE as unlimited
  FROM features f
  INNER JOIN user_subscriptions us ON f.id = us.feature_id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON COLUMN profiles.id IS 'Foreign key to auth.users(id)';
COMMENT ON COLUMN profiles.role IS 'User role: client, support, admin, owner';
COMMENT ON COLUMN profiles.account_status IS 'Account status for access control';
COMMENT ON COLUMN profiles.tax_id IS 'CPF (11 digits) or CNPJ (14 digits)';
COMMENT ON COLUMN profiles.preferences IS 'User preferences (language, notifications, etc.)';
COMMENT ON COLUMN profiles.metadata IS 'Extensible metadata field';

COMMENT ON TABLE staff_permissions IS 'Granular permissions for staff members';
COMMENT ON FUNCTION is_staff(UUID) IS 'Returns true if user is staff (support/admin/owner)';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS 'Returns true if user has specific permission';
COMMENT ON FUNCTION get_user_features(UUID) IS 'Returns all features user has access to via subscriptions';
```

### **Migration 001: Feature Catalog & Bundles**

```sql
-- ============================================================================
-- FEATURE CATALOG & BUNDLE MANAGEMENT
-- Migration: 001_features_and_bundles.sql
-- Description: Dynamic feature catalog and bundle system
-- Dependencies: 000_user_management.sql
-- ============================================================================

-- ============================================================================
-- FEATURES TABLE (Catalog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Feature Identity
  slug TEXT UNIQUE NOT NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,

  -- Feature Category
  category TEXT NOT NULL DEFAULT 'calculator',

  -- Usage Limits (per month)
  anonymous_limit INTEGER NOT NULL DEFAULT 3,
  logged_in_free_limit INTEGER NOT NULL DEFAULT 10,

  -- Pricing
  monthly_price DECIMAL(10, 2),
  annual_price DECIMAL(10, 2),

  -- Feature Flags
  is_active BOOLEAN DEFAULT TRUE,
  requires_verification BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_limits CHECK (
    anonymous_limit >= 0 AND
    logged_in_free_limit >= anonymous_limit
  ),
  CONSTRAINT positive_prices CHECK (
    monthly_price >= 0 AND
    annual_price >= 0
  )
);

-- Indexes
CREATE INDEX idx_features_slug ON features(slug);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_features_is_active ON features(is_active);
CREATE INDEX idx_features_name_search ON features USING GIN(
  to_tsvector('portuguese', name_pt || ' ' || COALESCE(description_pt, ''))
);

-- ============================================================================
-- BUNDLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Bundle Identity
  slug TEXT UNIQUE NOT NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,

  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,

  -- Bundle Flags
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT slug_format_bundle CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_prices_bundle CHECK (
    monthly_price > 0 AND
    annual_price > 0
  ),
  CONSTRAINT valid_discount CHECK (
    discount_percentage >= 0 AND discount_percentage <= 100
  )
);

-- Indexes
CREATE INDEX idx_bundles_slug ON bundles(slug);
CREATE INDEX idx_bundles_is_active ON bundles(is_active);
CREATE INDEX idx_bundles_display_order ON bundles(display_order);

-- ============================================================================
-- BUNDLE_FEATURES JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bundle_features (
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (bundle_id, feature_id)
);

CREATE INDEX idx_bundle_features_bundle ON bundle_features(bundle_id);
CREATE INDEX idx_bundle_features_feature ON bundle_features(feature_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_features ENABLE ROW LEVEL SECURITY;

-- Everyone can read active features and bundles
CREATE POLICY "Anyone can view active features"
  ON features FOR SELECT
  USING (is_active = TRUE OR is_staff(auth.uid()));

CREATE POLICY "Anyone can view active bundles"
  ON bundles FOR SELECT
  USING (is_active = TRUE OR is_staff(auth.uid()));

CREATE POLICY "Anyone can view bundle features"
  ON bundle_features FOR SELECT
  USING (TRUE);

-- Only admins can manage features and bundles
CREATE POLICY "Admins can manage features"
  ON features FOR ALL
  USING (has_permission(auth.uid(), 'features:manage'));

CREATE POLICY "Admins can manage bundles"
  ON bundles FOR ALL
  USING (has_permission(auth.uid(), 'bundles:manage'));

CREATE POLICY "Admins can manage bundle features"
  ON bundle_features FOR ALL
  USING (has_permission(auth.uid(), 'bundles:manage'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get bundle's total value (sum of feature prices)
CREATE OR REPLACE FUNCTION get_bundle_value(bundle_uuid UUID, is_annual BOOLEAN DEFAULT FALSE)
RETURNS DECIMAL AS $$
DECLARE
  total_value DECIMAL;
BEGIN
  IF is_annual THEN
    SELECT COALESCE(SUM(f.annual_price), 0) INTO total_value
    FROM features f
    INNER JOIN bundle_features bf ON f.id = bf.feature_id
    WHERE bf.bundle_id = bundle_uuid AND f.is_active = TRUE;
  ELSE
    SELECT COALESCE(SUM(f.monthly_price), 0) INTO total_value
    FROM features f
    INNER JOIN bundle_features bf ON f.id = bf.feature_id
    WHERE bf.bundle_id = bundle_uuid AND f.is_active = TRUE;
  END IF;

  RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- Calculate bundle savings
CREATE OR REPLACE FUNCTION get_bundle_savings(bundle_uuid UUID, is_annual BOOLEAN DEFAULT FALSE)
RETURNS JSONB AS $$
DECLARE
  bundle_price DECIMAL;
  individual_total DECIMAL;
  savings DECIMAL;
  savings_percentage DECIMAL;
BEGIN
  SELECT
    CASE WHEN is_annual THEN annual_price ELSE monthly_price END
  INTO bundle_price
  FROM bundles
  WHERE id = bundle_uuid;

  individual_total := get_bundle_value(bundle_uuid, is_annual);
  savings := individual_total - bundle_price;
  savings_percentage := CASE
    WHEN individual_total > 0 THEN (savings / individual_total * 100)
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'bundle_price', bundle_price,
    'individual_total', individual_total,
    'savings_amount', savings,
    'savings_percentage', ROUND(savings_percentage, 2)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA (Example Features)
-- ============================================================================

-- Insert example features
INSERT INTO features (slug, name_pt, name_en, description_pt, category, anonymous_limit, logged_in_free_limit, monthly_price, annual_price)
VALUES
  ('cash-flow-calculator', 'Calculadora de Fluxo de Pagamento', 'Cash Flow Calculator',
   'Planeje pagamentos complexos de imóveis em construção', 'calculator', 3, 10, 29.90, 299.00),

  ('financing-simulator', 'Simulador de Financiamento', 'Financing Simulator',
   'Calcule capacidade de financiamento e parcelas', 'calculator', 5, 15, 19.90, 199.00),

  ('market-study', 'Estudo de Mercado', 'Market Study',
   'Análise comparativa de mercado imobiliário', 'analysis', 2, 5, 49.90, 499.00),

  ('projects-management', 'Gestão de Projetos', 'Projects Management',
   'Gerencie empreendimentos e unidades', 'management', 1, 3, 79.90, 799.00)
ON CONFLICT (slug) DO NOTHING;

-- Insert example bundles
INSERT INTO bundles (slug, name_pt, name_en, description_pt, monthly_price, annual_price, discount_percentage, is_featured)
VALUES
  ('calculadoras-premium', 'Calculadoras Premium', 'Premium Calculators',
   'Acesso ilimitado a todas as calculadoras', 39.90, 399.00, 20, TRUE),

  ('pacote-completo', 'Pacote Completo', 'Complete Package',
   'Todas as ferramentas da plataforma', 99.90, 999.00, 30, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Link features to bundles
INSERT INTO bundle_features (bundle_id, feature_id)
SELECT
  (SELECT id FROM bundles WHERE slug = 'calculadoras-premium'),
  id
FROM features
WHERE slug IN ('cash-flow-calculator', 'financing-simulator')
ON CONFLICT DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id)
SELECT
  (SELECT id FROM bundles WHERE slug = 'pacote-completo'),
  id
FROM features
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE features IS 'Catalog of all platform features with pricing and limits';
COMMENT ON COLUMN features.slug IS 'Unique feature identifier (e.g., cash-flow-calculator)';
COMMENT ON COLUMN features.anonymous_limit IS 'Max uses per month for anonymous users';
COMMENT ON COLUMN features.logged_in_free_limit IS 'Max uses per month for free logged-in users';
COMMENT ON COLUMN features.monthly_price IS 'Individual feature monthly subscription price';

COMMENT ON TABLE bundles IS 'Feature bundles (packages) with discounted pricing';
COMMENT ON COLUMN bundles.discount_percentage IS 'Discount vs buying features individually';

COMMENT ON TABLE bundle_features IS 'Many-to-many relationship between bundles and features';

COMMENT ON FUNCTION get_bundle_value(UUID, BOOLEAN) IS 'Calculate total value of features in bundle';
COMMENT ON FUNCTION get_bundle_savings(UUID, BOOLEAN) IS 'Calculate savings when buying bundle vs individual';
```

### **Migration 002: Subscriptions & Usage Tracking**

```sql
-- ============================================================================
-- USER SUBSCRIPTIONS & USAGE TRACKING
-- Migration: 002_subscriptions_and_usage.sql
-- Description: Subscription management and usage quota enforcement
-- Dependencies: 000_user_management.sql, 001_features_and_bundles.sql
-- ============================================================================

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'past_due',
  'suspended',
  'expired',
  'trial'
);

CREATE TYPE subscription_type AS ENUM ('feature', 'bundle');

CREATE TYPE billing_interval AS ENUM ('monthly', 'annual');

-- ============================================================================
-- USER_SUBSCRIPTIONS TABLE (Redesigned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription Target (feature OR bundle, not both)
  subscription_type subscription_type NOT NULL,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,

  -- Billing
  billing_interval billing_interval NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',

  -- Status
  status subscription_status NOT NULL DEFAULT 'active',

  -- Billing Period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Payment Gateway Integration
  gateway TEXT CHECK (gateway IN ('stripe', 'mercadopago', 'asaas')),
  external_subscription_id TEXT,
  payment_method JSONB,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT subscription_target CHECK (
    (subscription_type = 'feature' AND feature_id IS NOT NULL AND bundle_id IS NULL) OR
    (subscription_type = 'bundle' AND bundle_id IS NOT NULL AND feature_id IS NULL)
  ),
  CONSTRAINT period_dates_valid CHECK (current_period_end > current_period_start),
  CONSTRAINT trial_dates_valid CHECK (
    trial_end IS NULL OR trial_start IS NULL OR trial_end > trial_start
  ),
  CONSTRAINT external_sub_unique UNIQUE (gateway, external_subscription_id)
);

-- Indexes
CREATE INDEX idx_user_subs_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subs_status ON user_subscriptions(status);
CREATE INDEX idx_user_subs_feature ON user_subscriptions(feature_id) WHERE feature_id IS NOT NULL;
CREATE INDEX idx_user_subs_bundle ON user_subscriptions(bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX idx_user_subs_user_status ON user_subscriptions(user_id, status);
CREATE INDEX idx_user_subs_period_end ON user_subscriptions(current_period_end);
CREATE INDEX idx_user_subs_external ON user_subscriptions(external_subscription_id) WHERE external_subscription_id IS NOT NULL;

-- ============================================================================
-- FEATURE_USAGE TABLE (Usage Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User (can be null for anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking (IP hash or session cookie)

  -- Feature
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,

  -- Usage Details
  action TEXT NOT NULL, -- e.g., 'calculate', 'save', 'share'
  entity_id UUID, -- Reference to created entity (calculator, simulation, etc.)

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_usage_user_id ON feature_usage(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_usage_session_id ON feature_usage(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_usage_feature_id ON feature_usage(feature_id);
CREATE INDEX idx_usage_used_at ON feature_usage(used_at DESC);
CREATE INDEX idx_usage_user_feature_month ON feature_usage(
  user_id, feature_id, (DATE_TRUNC('month', used_at))
) WHERE user_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_user_subs_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- User Subscriptions: Users can view their own
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User Subscriptions: Staff can view all
CREATE POLICY "Staff can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (is_staff(auth.uid()));

-- User Subscriptions: System can insert (via functions)
CREATE POLICY "System can insert subscriptions"
  ON user_subscriptions FOR INSERT
  WITH CHECK (TRUE); -- Will be controlled by functions

-- User Subscriptions: Users and staff can update
CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR is_staff(auth.uid()));

-- Feature Usage: Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Feature Usage: Staff can view all usage
CREATE POLICY "Staff can view all usage"
  ON feature_usage FOR SELECT
  USING (is_staff(auth.uid()));

-- Feature Usage: System can insert (via functions)
CREATE POLICY "System can insert usage"
  ON feature_usage FOR INSERT
  WITH CHECK (TRUE); -- Will be controlled by functions

-- ============================================================================
-- CORE FUNCTIONS - ACCESS CONTROL & USAGE TRACKING
-- ============================================================================

-- Check if user can access feature
CREATE OR REPLACE FUNCTION can_access_feature(
  feature_slug_param TEXT,
  user_uuid UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  feature_record RECORD;
  usage_count INTEGER;
  has_subscription BOOLEAN;
  result JSONB;
BEGIN
  -- Get feature details
  SELECT * INTO feature_record
  FROM features
  WHERE slug = feature_slug_param AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'reason', 'feature_not_found',
      'message', 'Feature not found or inactive'
    );
  END IF;

  -- Check if user has active subscription (feature or bundle)
  IF user_uuid IS NOT NULL THEN
    SELECT EXISTS (
      -- Direct feature subscription
      SELECT 1 FROM user_subscriptions
      WHERE user_id = user_uuid
        AND feature_id = feature_record.id
        AND status = 'active'
        AND current_period_end > NOW()
      UNION
      -- Bundle subscription containing this feature
      SELECT 1 FROM user_subscriptions us
      INNER JOIN bundle_features bf ON us.bundle_id = bf.bundle_id
      WHERE us.user_id = user_uuid
        AND bf.feature_id = feature_record.id
        AND us.status = 'active'
        AND us.current_period_end > NOW()
    ) INTO has_subscription;

    IF has_subscription THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'subscription',
        'subscription_type', 'unlimited'
      );
    END IF;
  END IF;

  -- Count usage this month
  IF user_uuid IS NOT NULL THEN
    SELECT COUNT(*) INTO usage_count
    FROM feature_usage
    WHERE feature_id = feature_record.id
      AND user_id = user_uuid
      AND used_at >= DATE_TRUNC('month', NOW());

    -- Check logged-in free limit
    IF usage_count < feature_record.logged_in_free_limit THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'free_tier_logged_in',
        'usage_count', usage_count,
        'usage_limit', feature_record.logged_in_free_limit,
        'remaining', feature_record.logged_in_free_limit - usage_count
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'quota_exceeded',
        'message', 'Monthly free usage limit reached. Please subscribe for unlimited access.',
        'usage_count', usage_count,
        'usage_limit', feature_record.logged_in_free_limit
      );
    END IF;
  ELSE
    -- Anonymous user
    SELECT COUNT(*) INTO usage_count
    FROM feature_usage
    WHERE feature_id = feature_record.id
      AND session_id = session_id_param
      AND used_at >= DATE_TRUNC('month', NOW());

    IF usage_count < feature_record.anonymous_limit THEN
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'reason', 'free_tier_anonymous',
        'usage_count', usage_count,
        'usage_limit', feature_record.anonymous_limit,
        'remaining', feature_record.anonymous_limit - usage_count,
        'message', 'Sign up for more free uses!'
      );
    ELSE
      RETURN jsonb_build_object(
        'allowed', FALSE,
        'reason', 'quota_exceeded_anonymous',
        'message', 'Free usage limit reached. Please sign up or log in for more uses.',
        'usage_count', usage_count,
        'usage_limit', feature_record.anonymous_limit
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
  feature_slug_param TEXT,
  action_param TEXT DEFAULT 'use',
  user_uuid UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  entity_id_param UUID DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  feature_record RECORD;
  usage_id UUID;
  access_check JSONB;
BEGIN
  -- Check access first
  access_check := can_access_feature(feature_slug_param, user_uuid, session_id_param);

  IF NOT (access_check->>'allowed')::BOOLEAN THEN
    RETURN access_check; -- Return denial reason
  END IF;

  -- Get feature
  SELECT * INTO feature_record
  FROM features
  WHERE slug = feature_slug_param;

  -- Record usage
  INSERT INTO feature_usage (
    user_id, session_id, feature_id, action, entity_id,
    ip_address, user_agent, metadata
  )
  VALUES (
    user_uuid, session_id_param, feature_record.id, action_param, entity_id_param,
    ip_address_param, user_agent_param, metadata_param
  )
  RETURNING id INTO usage_id;

  RETURN jsonb_build_object(
    'allowed', TRUE,
    'usage_id', usage_id,
    'access_info', access_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH monthly_usage AS (
    SELECT
      f.slug,
      f.name_pt,
      COUNT(*) as usage_count,
      f.logged_in_free_limit as limit,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM user_subscriptions us
          WHERE us.user_id = user_uuid
            AND (us.feature_id = f.id OR EXISTS (
              SELECT 1 FROM bundle_features bf
              WHERE bf.bundle_id = us.bundle_id AND bf.feature_id = f.id
            ))
            AND us.status = 'active'
            AND us.current_period_end > NOW()
        ) THEN 'unlimited'
        ELSE 'limited'
      END as access_type
    FROM feature_usage fu
    INNER JOIN features f ON fu.feature_id = f.id
    WHERE fu.user_id = user_uuid
      AND fu.used_at >= DATE_TRUNC('month', NOW())
    GROUP BY f.id, f.slug, f.name_pt, f.logged_in_free_limit
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'feature', slug,
      'name', name_pt,
      'usage_count', usage_count,
      'limit', CASE WHEN access_type = 'unlimited' THEN NULL ELSE limit END,
      'remaining', CASE WHEN access_type = 'unlimited' THEN NULL ELSE limit - usage_count END,
      'access_type', access_type
    )
  )
  INTO result
  FROM monthly_usage;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ANALYTICS FUNCTIONS (For staff)
-- ============================================================================

-- Get popular features
CREATE OR REPLACE FUNCTION get_popular_features(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW(),
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  feature_slug TEXT,
  feature_name TEXT,
  total_uses BIGINT,
  unique_users BIGINT,
  anonymous_uses BIGINT,
  logged_in_uses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.slug,
    f.name_pt,
    COUNT(*)::BIGINT as total_uses,
    COUNT(DISTINCT fu.user_id)::BIGINT as unique_users,
    COUNT(*) FILTER (WHERE fu.user_id IS NULL)::BIGINT as anonymous_uses,
    COUNT(*) FILTER (WHERE fu.user_id IS NOT NULL)::BIGINT as logged_in_uses
  FROM feature_usage fu
  INNER JOIN features f ON fu.feature_id = f.id
  WHERE fu.used_at BETWEEN start_date AND end_date
  GROUP BY f.id, f.slug, f.name_pt
  ORDER BY total_uses DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_subscriptions IS 'User subscriptions to features or bundles';
COMMENT ON COLUMN user_subscriptions.subscription_type IS 'Either feature or bundle subscription';
COMMENT ON COLUMN user_subscriptions.feature_id IS 'Set if subscribing to individual feature';
COMMENT ON COLUMN user_subscriptions.bundle_id IS 'Set if subscribing to bundle';

COMMENT ON TABLE feature_usage IS 'Tracks all feature usage for quota enforcement and analytics';
COMMENT ON COLUMN feature_usage.session_id IS 'For anonymous users (IP hash or cookie)';
COMMENT ON COLUMN feature_usage.action IS 'Action performed (use, save, share, etc.)';

COMMENT ON FUNCTION can_access_feature IS 'Checks if user/session can access feature based on quotas and subscriptions';
COMMENT ON FUNCTION track_feature_usage IS 'Records feature usage and enforces access control';
COMMENT ON FUNCTION get_usage_summary IS 'Returns user''s monthly usage summary for all features';
COMMENT ON FUNCTION get_popular_features IS 'Analytics: most popular features by usage';
```

---

## **🚀 Implementation Strategy**

### **Phase 0: Database Migrations (FOUNDATION)** - 4-6 hours

1. ✅ Run Migration 000: User Management
2. ✅ Run Migration 001: Features & Bundles
3. ✅ Run Migration 002: Subscriptions & Usage
4. ✅ Migrate existing tables to use Supabase Auth UUID
5. ✅ Test RLS policies with different user roles
6. ✅ Seed initial features and bundles

### **Phase 1: Authentication Integration** - 3-4 hours

1. Setup Supabase Auth in frontend
2. Login/Signup pages
3. Profile management page
4. Session management
5. Staff login portal

### **Phase 2: Feature Gating & Usage Tracking** - 3-4 hours

1. API middleware for access control
2. Frontend usage display (quotas, limits)
3. Upgrade prompts when limit reached
4. Anonymous session tracking (cookies)

### **Phase 3: Subscription Management** - 4-5 hours

1. Subscription checkout flows
2. Payment gateway integration (Stripe/Asaas)
3. Subscription management UI
4. Webhook handling for payment events

### **Phase 4: Admin Dashboard** - 3-4 hours

1. Staff dashboard
2. User management
3. Feature/bundle management
4. Analytics and reporting

### **Phase 5: Feature Integration** - 8-10 hours

1. Now implement Calculadora de Fluxo
2. Now implement Simulador de Financiamento
3. Both with full subscription support

**Total Estimated Time**: 25-33 hours

---

## **✅ Success Criteria**

✅ **Authentication**: Supabase Auth integrated, users can sign up/login
✅ **Role Management**: Staff can be assigned permissions
✅ **Usage Tracking**: All feature uses recorded and enforced
✅ **Quota System**: Anonymous, free, and subscribed tiers work correctly
✅ **Subscriptions**: Users can subscribe to features or bundles
✅ **Payment Integration**: Stripe/Asaas webhooks working
✅ **Feature Catalog**: Features can be added via admin panel
✅ **Bundle Management**: Bundles can be created/modified dynamically
✅ **Analytics**: Usage statistics available for staff
✅ **Security**: RLS policies prevent unauthorized access

---

## **🎯 Answer to Your Questions**

### **"Is our DB ready for user management?"**
❌ **NO** - Current implementation has critical gaps:
- No centralized users table
- Inconsistent auth patterns
- No role management
- Inadequate subscription system

### **"Should we implement authentication first?"**
✅ **YES, ABSOLUTELY!** Authentication is the foundation for:
- User identification
- Usage tracking
- Quota enforcement
- Subscription management
- Feature access control

### **"Can we manage clients and subscriptions?"**
✅ **YES, with this design** we can:
- Track anonymous usage (IP-based)
- Enhanced limits for logged-in users
- Feature-specific subscriptions
- Bundle subscriptions
- Dynamically add features
- Create/modify bundles via UI
- Distinguish staff from clients
- Granular staff permissions

---

**RECOMMENDATION**: Implement this user management system FIRST (Phases 0-4), THEN integrate the calculators (Phase 5) with full subscription support.

**Document Version**: 1.0
**Status**: Ready for Review
**Estimated Total Effort**: 25-33 hours
