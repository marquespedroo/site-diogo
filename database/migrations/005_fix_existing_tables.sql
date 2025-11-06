-- =====================================================
-- Migration 005: Fix Existing Tables for Supabase Auth
-- =====================================================
-- Purpose: Migrate existing tables to use proper UUID foreign keys
--          to auth.users and update RLS policies
-- Dependencies: Migration 000 (User Management)
-- Author: ImobiTools Architecture Team
-- Date: 2025-11-06
-- =====================================================

-- ⚠️  WARNING: This migration modifies existing tables and data
-- ⚠️  BACKUP your database before running this migration
-- ⚠️  This migration assumes minimal data in production

-- =====================================================
-- STEP 1: Deprecate Old Subscriptions Table
-- =====================================================

-- The old subscriptions table from 004_payment_schema.sql
-- will be replaced by our new user_subscriptions table

-- Rename old table for reference
ALTER TABLE IF EXISTS subscriptions RENAME TO subscriptions_deprecated;

-- Drop old RLS policies
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions_deprecated;
DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions_deprecated;
DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions_deprecated;
DROP POLICY IF EXISTS subscriptions_delete_own ON subscriptions_deprecated;

-- Drop old trigger
DROP TRIGGER IF EXISTS prevent_duplicate_active_subscription ON subscriptions_deprecated;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions_deprecated;

-- Add deprecation notice
COMMENT ON TABLE subscriptions_deprecated IS
  'DEPRECATED: Old subscription schema. Use user_subscriptions table instead. This table is kept for data migration reference only.';

-- =====================================================
-- STEP 2: Fix CALCULATORS Table
-- =====================================================

-- Drop old RLS policies (they use current_setting)
DROP POLICY IF EXISTS calculators_select_own ON calculators;
DROP POLICY IF EXISTS calculators_select_public ON calculators;
DROP POLICY IF EXISTS calculators_insert_own ON calculators;
DROP POLICY IF EXISTS calculators_update_own ON calculators;
DROP POLICY IF EXISTS calculators_delete_own ON calculators;

-- Add temporary column for UUID user_id
ALTER TABLE calculators ADD COLUMN user_id_uuid UUID;

-- Try to migrate existing data (if any)
-- Note: This will fail for any user_id that doesn't match an auth.users.id
-- In a real migration, you would need to handle orphaned records
DO $$
BEGIN
  -- Update user_id_uuid where user_id is a valid UUID in auth.users
  UPDATE calculators c
  SET user_id_uuid = c.user_id::UUID
  WHERE c.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (SELECT 1 FROM auth.users WHERE id = c.user_id::UUID);

  -- For non-UUID user_ids (like 'guest-123'), set to NULL or a default user
  -- These records will need manual review
  RAISE NOTICE 'Records with non-UUID user_id will have user_id_uuid = NULL';
END $$;

-- Drop old user_id column
ALTER TABLE calculators DROP COLUMN user_id;

-- Rename new column
ALTER TABLE calculators RENAME COLUMN user_id_uuid TO user_id;

-- Add foreign key constraint (will fail if there are orphaned records)
-- Use ON DELETE CASCADE to automatically delete calculators when user is deleted
ALTER TABLE calculators
  ADD CONSTRAINT calculators_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate index
DROP INDEX IF EXISTS idx_calculators_user_id;
CREATE INDEX idx_calculators_user_id ON calculators(user_id) WHERE user_id IS NOT NULL;

-- Update comment
COMMENT ON COLUMN calculators.user_id IS 'User who created the calculator (FK to auth.users)';

-- Recreate RLS policies using auth.uid()
CREATE POLICY "Users can view own calculators"
  ON calculators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public calculators"
  ON calculators FOR SELECT
  USING (short_code IS NOT NULL);

CREATE POLICY "Users can insert own calculators"
  ON calculators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculators"
  ON calculators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculators"
  ON calculators FOR DELETE
  USING (auth.uid() = user_id);

-- Staff can view all calculators
CREATE POLICY "Staff can view all calculators"
  ON calculators FOR SELECT
  USING (is_staff(auth.uid()));

-- =====================================================
-- STEP 3: Fix TRANSACTIONS Table
-- =====================================================

-- Drop old RLS policies
DROP POLICY IF EXISTS transactions_select_own ON transactions;
DROP POLICY IF EXISTS transactions_insert_own ON transactions;

-- Add temporary column for UUID user_id
ALTER TABLE transactions ADD COLUMN user_id_uuid UUID;

-- Migrate existing data
DO $$
BEGIN
  UPDATE transactions t
  SET user_id_uuid = t.user_id::UUID
  WHERE t.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (SELECT 1 FROM auth.users WHERE id = t.user_id::UUID);

  RAISE NOTICE 'Records with non-UUID user_id will have user_id_uuid = NULL';
END $$;

-- Drop old user_id column
ALTER TABLE transactions DROP COLUMN user_id;

-- Rename new column
ALTER TABLE transactions RENAME COLUMN user_id_uuid TO user_id;

-- Add foreign key constraint
ALTER TABLE transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate index
DROP INDEX IF EXISTS idx_transactions_user_id;
CREATE INDEX idx_transactions_user_id ON transactions(user_id) WHERE user_id IS NOT NULL;

-- Update comment
COMMENT ON COLUMN transactions.user_id IS 'User who made the transaction (FK to auth.users)';

-- Recreate RLS policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can record transactions"
  ON transactions FOR INSERT
  WITH CHECK (TRUE);  -- Controlled by backend with service role

-- Staff can view all transactions
CREATE POLICY "Staff can view all transactions"
  ON transactions FOR SELECT
  USING (is_staff(auth.uid()));

-- Staff with permission can manage transactions
CREATE POLICY "Staff can manage transactions"
  ON transactions FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_billing')
  );

-- =====================================================
-- STEP 4: Fix INVOICES Table
-- =====================================================

-- Drop old RLS policies
DROP POLICY IF EXISTS invoices_select_own ON invoices;
DROP POLICY IF EXISTS invoices_insert_own ON invoices;
DROP POLICY IF EXISTS invoices_update_own ON invoices;

-- Drop old FK constraint (references deprecated subscriptions table)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_subscription_id_fkey;

-- Add temporary column for UUID user_id
ALTER TABLE invoices ADD COLUMN user_id_uuid UUID;

-- Migrate existing data
DO $$
BEGIN
  UPDATE invoices i
  SET user_id_uuid = i.user_id::UUID
  WHERE i.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (SELECT 1 FROM auth.users WHERE id = i.user_id::UUID);

  RAISE NOTICE 'Records with non-UUID user_id will have user_id_uuid = NULL';
END $$;

-- Drop old user_id column
ALTER TABLE invoices DROP COLUMN user_id;

-- Rename new column
ALTER TABLE invoices RENAME COLUMN user_id_uuid TO user_id;

-- Add foreign key constraint
ALTER TABLE invoices
  ADD CONSTRAINT invoices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update subscription_id to reference new user_subscriptions table
-- Note: subscription_id format changed from TEXT to UUID
-- Existing data will need manual migration
ALTER TABLE invoices ALTER COLUMN subscription_id TYPE UUID USING NULL;

-- Add FK to new user_subscriptions table
ALTER TABLE invoices
  ADD CONSTRAINT invoices_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE;

-- Recreate indexes
DROP INDEX IF EXISTS idx_invoices_user_id;
DROP INDEX IF EXISTS idx_invoices_subscription_id;
DROP INDEX IF EXISTS idx_invoices_user_status;
CREATE INDEX idx_invoices_user_id ON invoices(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status) WHERE user_id IS NOT NULL;

-- Update comments
COMMENT ON COLUMN invoices.user_id IS 'User who owns the invoice (FK to auth.users)';
COMMENT ON COLUMN invoices.subscription_id IS 'Related subscription (FK to user_subscriptions)';

-- Recreate RLS policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage invoices"
  ON invoices FOR ALL
  WITH CHECK (TRUE);  -- Controlled by backend with service role

-- Staff can view all invoices
CREATE POLICY "Staff can view all invoices"
  ON invoices FOR SELECT
  USING (is_staff(auth.uid()));

-- Staff with permission can manage invoices
CREATE POLICY "Staff can manage invoices"
  ON invoices FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_billing')
  );

-- =====================================================
-- STEP 5: Verify Other Tables (No Changes Needed)
-- =====================================================

-- market_studies table (002_market_study_schema.sql)
-- ✅ Already uses UUID with FK to auth.users
-- ✅ RLS policies already use auth.uid()

-- projects table (003_projects_schema.sql)
-- ✅ Already uses UUID with FK to auth.users
-- ✅ RLS policies already use auth.uid()

-- units table (003_projects_schema.sql)
-- ✅ Uses project_id (indirect user relationship)
-- ✅ RLS policies already use auth.uid()

-- =====================================================
-- STEP 6: Data Migration Helper Functions
-- =====================================================

-- Function to help identify orphaned records
CREATE OR REPLACE FUNCTION find_orphaned_records()
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'calculators'::TEXT, COUNT(*)
  FROM calculators WHERE user_id IS NULL
  UNION ALL
  SELECT 'transactions'::TEXT, COUNT(*)
  FROM transactions WHERE user_id IS NULL
  UNION ALL
  SELECT 'invoices'::TEXT, COUNT(*)
  FROM invoices WHERE user_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup orphaned records (use with caution!)
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  calc_deleted BIGINT;
  trans_deleted BIGINT;
  inv_deleted BIGINT;
BEGIN
  -- Delete calculators with no user
  DELETE FROM calculators WHERE user_id IS NULL;
  GET DIAGNOSTICS calc_deleted = ROW_COUNT;

  -- Delete transactions with no user
  DELETE FROM transactions WHERE user_id IS NULL;
  GET DIAGNOSTICS trans_deleted = ROW_COUNT;

  -- Delete invoices with no user
  DELETE FROM invoices WHERE user_id IS NULL;
  GET DIAGNOSTICS inv_deleted = ROW_COUNT;

  RETURN QUERY
  SELECT 'calculators'::TEXT, calc_deleted
  UNION ALL
  SELECT 'transactions'::TEXT, trans_deleted
  UNION ALL
  SELECT 'invoices'::TEXT, inv_deleted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS: Migration Notes
-- =====================================================

COMMENT ON FUNCTION find_orphaned_records() IS
  'Helper function to identify records with NULL user_id after migration';

COMMENT ON FUNCTION cleanup_orphaned_records() IS
  '⚠️  DANGER: Permanently deletes records with NULL user_id. Use with caution!';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check for orphaned records:
-- SELECT * FROM find_orphaned_records();

-- Verify foreign keys:
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name IN ('calculators', 'transactions', 'invoices')
--   AND ccu.table_name = 'users'
--   AND ccu.table_schema = 'auth';

-- Verify RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('calculators', 'transactions', 'invoices')
-- ORDER BY tablename, policyname;

-- =====================================================
-- POST-MIGRATION TASKS
-- =====================================================

-- ⚠️  IMPORTANT: After running this migration:
--
-- 1. Review orphaned records:
--    SELECT * FROM find_orphaned_records();
--
-- 2. If orphaned records exist, decide whether to:
--    a) Delete them: SELECT * FROM cleanup_orphaned_records();
--    b) Assign to a default user
--    c) Keep them for manual review
--
-- 3. Test authentication flow:
--    - Verify users can create/view their own records
--    - Verify RLS policies work correctly
--    - Verify staff permissions work
--
-- 4. Update backend code:
--    - Remove current_setting('app.current_user_id') usage
--    - Use auth.uid() in queries
--    - Update subscription logic to use new user_subscriptions table
--
-- 5. Deprecate old subscriptions table:
--    - Migrate any needed data from subscriptions_deprecated
--    - Drop table after confirming no dependencies: DROP TABLE subscriptions_deprecated;

-- =====================================================
-- END OF MIGRATION 005
-- =====================================================
