# Fix Database Connection Issue

## The Problem
Your database connection is failing with:
```
cannot resolve hostname: qtjnbcmhihtawdetminw.db.supabase.co
```

## Root Cause
Supabase's direct database access (port 5432) may not be enabled or the hostname format is incorrect.

## Solutions (Try in Order)

### Solution 1: Enable Direct Database Access ⭐ RECOMMENDED

1. Go to: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/settings/database
2. Scroll to **Connection String** section
3. Look for **"Connection pooling"** or **"Direct connection"**
4. Copy the **connection string** (it will show the correct hostname)
5. Enable direct connections if there's a toggle

**What to look for:**
- The actual database hostname (might be different from `qtjnbcmhihtawdetminw.db.supabase.co`)
- Port number (should be 5432 for direct, or 6543 for pooler)
- Any SSL/connection requirements

### Solution 2: Use Connection Pooler

If direct access doesn't work, Supabase uses a connection pooler:

**Connection string format:**
```
postgres://postgres.qtjnbcmhihtawdetminw:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

To get the exact string:
1. Supabase Dashboard → Settings → Database
2. Copy **"Connection Pooling"** connection string
3. Replace `[YOUR-PASSWORD]` with your service role key

### Solution 3: Use Supabase SQL Editor ⚡ EASIEST

**This always works and is the recommended approach:**

1. Open: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql
2. Copy contents of `database/CONSOLIDATED_MIGRATION.sql`
3. Paste and click **Run**
4. Done in 30 seconds!

## What I Need From You

**Option A:** Try Solution 1 or 2 and tell me:
- The correct database hostname from your Supabase settings
- Whether direct connections are enabled
- The actual connection string shown

**Option B:** Use Solution 3 (SQL Editor)
- Just run the SQL file
- Tell me when it's done
- We can continue immediately!

## Why This Happens

Supabase changed their database connection architecture:
- Old projects: Direct connections via `project-ref.db.supabase.co:5432`
- New projects: Connection pooler via `aws-region.pooler.supabase.com:6543`
- Your project may be using the new architecture

## Quick Fix Right Now

**Do this (takes 2 minutes):**

1. Click: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql
2. Open file: `database/CONSOLIDATED_MIGRATION.sql`
3. Copy all (Cmd/Ctrl + A)
4. Paste in SQL Editor
5. Click Run
6. ✅ Done!

Then tell me "migration complete" and we continue!
