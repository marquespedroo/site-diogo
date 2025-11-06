-- =====================================================
-- Manually Create Test User (Bypass Dashboard)
-- =====================================================
-- Use this if the dashboard user creation is failing
-- Run in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if test user already exists and delete if found
DELETE FROM auth.users WHERE email = 'test@imobitools.com';
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'test@imobitools.com'
);

-- Step 2: Create user in auth.users
-- Password: test123456 (will be hashed by Supabase)
-- Using Supabase's auth schema directly
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@imobitools.com',
  crypt('test123456', gen_salt('bf')), -- Password hash
  NOW(), -- Auto-confirm email
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  NOW(),
  NOW(),
  '',
  'authenticated',
  'authenticated'
)
RETURNING id;

-- Step 3: Create profile manually
-- Get the user ID first
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'test@imobitools.com';

  -- Insert profile
  INSERT INTO profiles (
    id,
    role,
    account_status,
    full_name,
    email_verified_at,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'client',
    'active',
    'Test User',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Test user created successfully!';
  RAISE NOTICE 'Email: test@imobitools.com';
  RAISE NOTICE 'Password: test123456';
  RAISE NOTICE 'User ID: %', user_id;
END $$;

-- Step 4: Verify user was created
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  p.full_name,
  p.role,
  p.account_status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'test@imobitools.com';
