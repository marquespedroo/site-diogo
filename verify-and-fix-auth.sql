-- =====================================================
-- Verify and Fix Authentication Setup
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose and fix issues
-- =====================================================

-- 1. Check if profiles table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'profiles';

-- 2. Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- 4. Test if we can insert into profiles manually
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  INSERT INTO profiles (id, full_name, role, account_status)
  VALUES (test_id, 'Test Profile', 'client', 'active');

  -- Clean up
  DELETE FROM profiles WHERE id = test_id;

  RAISE NOTICE '✅ Profiles table structure is OK';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Profiles table error: %', SQLERRM;
END $$;

-- 5. Recreate the trigger function with better error handling
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
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the auth.users insert
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 7. Verify setup
SELECT 'Trigger recreated successfully' as status;
