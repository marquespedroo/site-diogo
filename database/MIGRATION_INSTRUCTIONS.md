# Database Migration Instructions

## Quick Start (5 minutes)

### Step 1: Get Your Real Supabase Keys

1. Open [Supabase Dashboard](https://app.supabase.com/project/imobtools)
2. Go to: **Settings → API**
3. Copy your keys:
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### Step 2: Update .env File

Replace the placeholder keys in `.env`:

```env
VITE_SUPABASE_ANON_KEY=eyJ... (your real anon key - will be ~300 characters)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ... (your real service role key - will be ~300 characters)
```

### Step 3: Run the Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Open [Supabase SQL Editor](https://app.supabase.com/project/imobtools/sql)
2. Copy the entire contents of `database/CONSOLIDATED_MIGRATION.sql`
3. Paste into SQL Editor
4. Click **Run** or press `Cmd/Ctrl + Enter`
5. You should see: "Success. No rows returned" with notices about created tables

**Option B: Using Migration Script**

```bash
cd database
./run-migrations.sh run
```

### Step 4: Enable Authentication

1. Supabase Dashboard → **Authentication**
2. Enable **Email** provider
3. (Optional) Configure email templates

### Step 5: Create Your First User

1. Sign up through your app (once frontend is ready)
2. Or create via Supabase Dashboard:
   - **Authentication → Users → Add user**
   - Enter email and password
   - Copy the user ID

3. Promote to owner role:
   ```sql
   UPDATE profiles SET role = 'owner'
   WHERE id = 'your-user-uuid-here';
   ```

## Verification

Run these queries to verify success:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'features', 'bundles', 'user_subscriptions', 'feature_usage');

-- Check features
SELECT slug, name, status FROM features;

-- Check bundles
SELECT slug, name, monthly_price FROM bundles;

-- Test access control
SELECT can_access_feature('profitability-calculator', NULL, 'test-session');
```

## Troubleshooting

**Error: "permission denied"**
- You're using anon key instead of service_role key
- Get service_role key from Supabase Dashboard

**Error: "relation already exists"**
- Tables were partially created
- Either:
  1. Drop existing tables and re-run
  2. Comment out conflicting CREATE TABLE statements

**Error: "foreign key violation"**
- auth.users schema doesn't exist
- Enable Authentication in Supabase Dashboard first

## Next Steps

After successful migration:

1. ✅ Frontend authentication is already enabled (`VITE_FEATURE_AUTH=true`)
2. ✅ Authentication provider will be implemented next
3. ✅ Login/signup pages will be created
4. ✅ Feature gating will be implemented

Total time: **5-10 minutes**
