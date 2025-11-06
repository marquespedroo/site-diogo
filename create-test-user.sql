-- =====================================================
-- Create Test User for ImobiTools
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Test User Credentials:
-- Email: test@imobitools.com
-- Password: test123456

-- Note: This creates a user via Supabase Auth functions
-- The password will be hashed automatically

-- Create test user using Supabase's auth.users table
-- First, we need to use Supabase's admin API or create via signup

-- Alternative: Use Supabase Dashboard
-- 1. Go to: Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: test@imobitools.com
-- 4. Password: test123456
-- 5. Check "Auto Confirm User" (skip email verification)
-- 6. Click "Create user"

-- After user is created, update their profile:
UPDATE profiles
SET
  full_name = 'Test User',
  account_status = 'active',
  role = 'client'
WHERE email = 'test@imobitools.com';

-- Verify user was created:
SELECT
  p.id,
  p.full_name,
  p.role,
  p.account_status,
  au.email,
  au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'test@imobitools.com';
