# ✅ FINAL SOLUTION - Run Migration in 2 Minutes

## The Issue
Direct database connections (port 5432) are **disabled** in your Supabase project.

Error: `Connection refused` - PostgreSQL is not accepting direct TCP/IP connections.

## The Solution (Takes 2 Minutes)

### Use Supabase SQL Editor

**This always works and requires no configuration:**

1. **Open SQL Editor:**
   - Click: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql
   - Or: Supabase Dashboard → SQL Editor

2. **Open migration file:**
   - Open: `database/CONSOLIDATED_MIGRATION.sql`
   - Select All (Cmd/Ctrl + A)
   - Copy (Cmd/Ctrl + C)

3. **Run migration:**
   - Paste in SQL Editor
   - Click **Run** (or Cmd/Ctrl + Enter)
   - Wait ~5-10 seconds

4. **Verify success:**
   You'll see:
   ```
   Success. No rows returned

   NOTICE: ✅ All migrations completed successfully!
   NOTICE: Created tables:
   NOTICE:   - profiles (user management)
   NOTICE:   - staff_permissions (role-based access)
   NOTICE:   - features (feature catalog)
   NOTICE:   - bundles (subscription plans)
   NOTICE:   - bundle_features (feature packages)
   NOTICE:   - user_subscriptions (active subscriptions)
   NOTICE:   - feature_usage (usage tracking)
   ```

5. **Enable Authentication:**
   - Supabase Dashboard → Authentication
   - Enable **Email** provider
   - Save

## Done! ✅

Tell me "migration complete" and we'll continue with the implementation!

## Alternative: Enable Direct Access (Optional)

If you want to use the script in the future:

1. Supabase Dashboard → Settings → Database
2. Look for "Direct database access" section
3. Enable it (if available)
4. Note: This might require a paid plan

But SQL Editor works perfectly for now!
