-- =====================================================
-- Migration 000: User Management Foundation
-- =====================================================
-- Purpose: Establish comprehensive user management system
--          extending Supabase Auth with profiles, roles, and permissions
-- Dependencies: Supabase Auth (auth.users table)
-- Author: ImobiTools Architecture Team
-- Date: 2025-11-06
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS: Type Safety for User Management
-- =====================================================

-- User role hierarchy: client < support < admin < owner
CREATE TYPE user_role AS ENUM (
  'client',      -- Regular customer
  'support',     -- Customer support staff
  'admin',       -- System administrator
  'owner'        -- Business owner (highest privilege)
);

-- Account status lifecycle
CREATE TYPE account_status AS ENUM (
  'pending_verification',  -- Email verification pending
  'active',               -- Normal active account
  'suspended',            -- Temporarily suspended
  'deactivated',          -- User deactivated account
  'banned'                -- Permanently banned
);

-- =====================================================
-- PROFILES TABLE: Extends Supabase auth.users
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Primary Key: 1-to-1 with auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role and Status
  role user_role NOT NULL DEFAULT 'client',
  account_status account_status NOT NULL DEFAULT 'pending_verification',

  -- Profile Information
  full_name TEXT,
  company_name TEXT,           -- For B2B clients
  phone TEXT,
  avatar_url TEXT,

  -- Professional Information (optional)
  creci TEXT,                  -- Real estate license (Brazil)
  cnpj TEXT,                   -- Company tax ID (Brazil)

  -- Business Intelligence
  utm_source TEXT,             -- Marketing attribution
  utm_medium TEXT,
  utm_campaign TEXT,
  referred_by UUID REFERENCES profiles(id), -- Referral tracking

  -- Metadata
  preferences JSONB DEFAULT '{}'::JSONB,  -- User preferences
  metadata JSONB DEFAULT '{}'::JSONB,     -- Additional data

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-()]+$'),
  CONSTRAINT valid_creci CHECK (creci IS NULL OR LENGTH(creci) >= 3),
  CONSTRAINT valid_cnpj CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$')
);

-- Indexes for Performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(account_status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_referred_by ON profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Updated timestamp trigger
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

-- =====================================================
-- STAFF PERMISSIONS: Granular Access Control
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Permission Flags
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_subscriptions BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_features BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_content BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_analytics BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_staff BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_billing BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  -- Constraints
  CONSTRAINT one_permission_per_user UNIQUE(user_id)
);

CREATE INDEX idx_staff_permissions_user_id ON staff_permissions(user_id);

-- =====================================================
-- HELPER FUNCTIONS: Business Logic
-- =====================================================

-- Check if user is staff member
CREATE OR REPLACE FUNCTION is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND role IN ('support', 'admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_uuid UUID,
  permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role_val FROM profiles WHERE id = user_uuid;

  -- Owner has all permissions
  IF user_role_val = 'owner' THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission
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

-- Auto-create profile on auth.users insert
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

-- Update last_login_at on authentication
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would need to be set on auth.sessions or similar
-- The exact implementation depends on Supabase Auth version

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- Cannot change role
    AND account_status = (SELECT account_status FROM profiles WHERE id = auth.uid())  -- Cannot change status
  );

-- Profiles: Staff can view all profiles
CREATE POLICY "Staff can view all profiles"
  ON profiles FOR SELECT
  USING (is_staff(auth.uid()));

-- Profiles: Staff with permission can update profiles
CREATE POLICY "Staff can update profiles"
  ON profiles FOR UPDATE
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_users')
  );

-- Staff Permissions: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON staff_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Staff Permissions: Only admin/owner can manage staff permissions
CREATE POLICY "Admins can manage staff permissions"
  ON staff_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- SEED DATA: Initial Owner Account
-- =====================================================

-- Note: This will be inserted after first user signs up
-- The first user should be manually promoted to 'owner' role
-- via Supabase dashboard or SQL command:
--
-- UPDATE profiles SET role = 'owner' WHERE id = '<user_id>';

-- =====================================================
-- COMMENTS: Documentation for Database Schema
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with role-based access control';
COMMENT ON TABLE staff_permissions IS 'Granular permissions for staff members (support, admin, owner)';

COMMENT ON COLUMN profiles.role IS 'User role: client < support < admin < owner';
COMMENT ON COLUMN profiles.account_status IS 'Account lifecycle status';
COMMENT ON COLUMN profiles.creci IS 'Brazilian real estate license number (CRECI)';
COMMENT ON COLUMN profiles.cnpj IS 'Brazilian company tax ID (14 digits)';
COMMENT ON COLUMN profiles.referred_by IS 'Referral tracking for growth analytics';

COMMENT ON FUNCTION is_staff(UUID) IS 'Check if user has staff privileges (support, admin, or owner)';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS 'Check if user has specific permission (owner always returns true)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify migration success:
-- SELECT COUNT(*) FROM profiles;
-- SELECT * FROM profiles WHERE role = 'owner';
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype;

-- =====================================================
-- END OF MIGRATION 000
-- =====================================================
