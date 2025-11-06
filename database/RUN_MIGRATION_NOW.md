# Run Migration NOW - 2 Minutes

## Step 1: Open Supabase SQL Editor

Click this link (opens in new tab):
**[Open SQL Editor](https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql)**

Or manually:
1. Go to https://supabase.com/dashboard/
2. Select project: **qtjnbcmhihtawdetminw**
3. Click **SQL Editor** in left sidebar

## Step 2: Copy the Migration SQL

Open this file:
```
database/CONSOLIDATED_MIGRATION.sql
```

Select all (Cmd/Ctrl + A) and copy (Cmd/Ctrl + C)

## Step 3: Paste and Run

1. In Supabase SQL Editor, paste the SQL
2. Click **Run** button (or press Cmd/Ctrl + Enter)
3. Wait ~5-10 seconds

## Step 4: Verify Success

You should see output like:

```
Success. No rows returned

NOTICE:  ✅ All migrations completed successfully!
NOTICE:
NOTICE:  Created tables:
NOTICE:    - profiles (user management)
NOTICE:    - staff_permissions (role-based access)
NOTICE:    - features (feature catalog)
NOTICE:    - bundles (subscription plans)
...
```

## Step 5: Enable Authentication

1. In Supabase Dashboard, go to **Authentication** (left sidebar)
2. Click **Providers**
3. Enable **Email** if not already enabled
4. Save

## Done! ✅

Your database is now ready. The authentication system is already integrated in the code.

## Test It

Run this in SQL Editor to verify:

```sql
-- Check features
SELECT slug, name, status FROM features;

-- Check bundles
SELECT slug, name, monthly_price FROM bundles;

-- Test access control
SELECT can_access_feature('profitability-calculator', NULL, 'test-session');
```

You should see 6 features, 3 bundles, and access control working!
