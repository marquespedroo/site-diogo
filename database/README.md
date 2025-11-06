# ImobiTools Database Migrations

Comprehensive database migration system for user management, subscriptions, and feature access control.

---

## Overview

This directory contains PostgreSQL migrations for the ImobiTools platform, built on Supabase Auth. The migrations establish a complete authentication and authorization system with:

- **User Management**: Profiles, roles, and permissions
- **Feature Catalog**: Dynamic feature management with quotas
- **Subscription System**: Feature and bundle subscriptions
- **Usage Tracking**: Quota enforcement and analytics
- **Access Control**: Row Level Security (RLS) policies

---

## Migration Order

| Migration | Purpose | Dependencies |
|-----------|---------|--------------|
| `000_user_management.sql` | User profiles, roles, permissions | Supabase Auth |
| `001_features_bundles.sql` | Feature catalog and bundles | Migration 000 |
| `002_subscriptions_usage.sql` | Subscriptions and usage tracking | Migrations 000, 001 |
| `005_fix_existing_tables.sql` | Update existing tables for auth.users FK | Migration 000 |

---

## Quick Start

### Prerequisites

1. **PostgreSQL Client** installed
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu
   sudo apt-get install postgresql-client
   ```

2. **Supabase Project** with Auth enabled
   - Login to [Supabase Dashboard](https://app.supabase.com)
   - Enable Authentication if not already enabled

3. **Environment Variables** configured in `.env`
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Run Migrations

```bash
# Navigate to database directory
cd database

# Execute all migrations
./run-migrations.sh run

# Check migration status
./run-migrations.sh status

# Verify database schema
./run-migrations.sh verify
```

---

## Detailed Migration Breakdown

### Migration 000: User Management Foundation

**Purpose**: Establish user management system extending Supabase Auth

**Key Components**:
- **profiles** table: User profiles with role-based access
- **staff_permissions** table: Granular permissions for staff
- **Enums**: `user_role`, `account_status`
- **Functions**: `is_staff()`, `has_permission()`
- **Triggers**: Auto-create profile on user signup
- **RLS Policies**: Users view own profile, staff view all

**User Role Hierarchy**:
```
client < support < admin < owner
```

**Permission System**:
- `can_manage_users`
- `can_manage_subscriptions`
- `can_manage_features`
- `can_manage_content`
- `can_view_analytics`
- `can_manage_staff`
- `can_manage_billing`

**Sample Usage**:
```sql
-- Check if user is staff
SELECT is_staff('user-uuid-here');

-- Check specific permission
SELECT has_permission('user-uuid-here', 'manage_users');

-- Get user profile
SELECT * FROM profiles WHERE id = auth.uid();
```

---

### Migration 001: Features & Bundles Catalog

**Purpose**: Dynamic feature catalog with flexible pricing and quotas

**Key Components**:
- **features** table: Individual features with usage limits
- **bundles** table: Feature packages with discounted pricing
- **bundle_features** table: Many-to-many relationship
- **Enums**: `feature_status`, `feature_category`
- **Functions**: `get_bundle_features()`, `calculate_bundle_savings()`
- **RLS Policies**: Public read, staff manage

**Feature Categories**:
- `calculator` - Financial calculators
- `analysis` - Market analysis tools
- `management` - Project management
- `reporting` - Reports and exports
- `integration` - External integrations

**Usage Tier Matrix**:

| User Type | Free Uses | Access Method |
|-----------|-----------|---------------|
| Anonymous | 3 per feature | Session-based tracking |
| Logged-in | 10 per feature | User-based tracking |
| Feature Subscriber | Unlimited | Subscription check |
| Bundle Subscriber | Unlimited | Bundle membership check |

**Sample Usage**:
```sql
-- Get all active features
SELECT * FROM features WHERE status = 'active' ORDER BY display_order;

-- Get features by category
SELECT * FROM get_features_by_category();

-- Get bundle features
SELECT * FROM get_bundle_features('professional');

-- Calculate bundle savings
SELECT calculate_bundle_savings('bundle-uuid-here');
```

---

### Migration 002: Subscriptions & Usage Tracking

**Purpose**: Subscription management and usage quota enforcement

**Key Components**:
- **user_subscriptions** table: Active subscriptions with billing
- **feature_usage** table: Usage tracking (user + session)
- **Enums**: `subscription_type`, `subscription_status`, `billing_interval`
- **Functions**: `can_access_feature()`, `record_feature_usage()`, `get_user_subscriptions()`, `get_user_usage_stats()`
- **RLS Policies**: Users view own data, staff view all

**Access Control Flow**:

```
1. User requests feature access
   ↓
2. can_access_feature() checks:
   - Is user staff? → Allow (unlimited)
   - Has active subscription? → Allow (unlimited)
   - Within free quota? → Allow (track usage)
   - Over quota? → Deny (prompt upgrade)
   ↓
3. record_feature_usage() logs usage
   ↓
4. Usage count affects future access
```

**Sample Usage**:
```sql
-- Check feature access (anonymous)
SELECT can_access_feature('profitability-calculator', NULL, 'session-123');

-- Check feature access (authenticated)
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);

-- Record feature usage
SELECT record_feature_usage(
  'profitability-calculator',  -- feature_slug
  'calculate',                 -- action
  auth.uid(),                  -- user_id
  NULL,                        -- session_id
  '{"result": "success"}'::jsonb  -- metadata
);

-- Get user subscriptions
SELECT * FROM get_user_subscriptions(auth.uid());

-- Get usage statistics
SELECT * FROM get_user_usage_stats(auth.uid(), 30);
```

**Subscription Lifecycle**:

```
trial → active → past_due → expired
              ↓
           canceled → expired
```

---

### Migration 005: Fix Existing Tables

**Purpose**: Migrate existing tables to use proper Supabase Auth foreign keys

**Key Changes**:
- **calculators**: `user_id` (TEXT → UUID + FK to auth.users)
- **transactions**: `user_id` (TEXT → UUID + FK to auth.users)
- **invoices**: `user_id` (TEXT → UUID + FK to auth.users)
- **subscriptions**: Renamed to `subscriptions_deprecated`
- **RLS Policies**: Updated to use `auth.uid()` instead of `current_setting()`

**Data Migration Strategy**:
1. Add temporary UUID column
2. Attempt to migrate valid UUID user_ids
3. Set NULL for invalid/orphaned records
4. Drop old TEXT column
5. Rename UUID column to user_id
6. Add foreign key constraint

**Orphaned Records**:
```sql
-- Find orphaned records
SELECT * FROM find_orphaned_records();

-- Clean up orphaned records (DANGER: permanent deletion)
SELECT * FROM cleanup_orphaned_records();
```

---

## Database Schema Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
│  ├─ id (UUID)   │
│  ├─ email       │
│  └─ ...         │
└────────┬────────┘
         │
         │ 1:1
         ↓
┌─────────────────┐     ┌──────────────────┐
│  profiles       │     │ staff_permissions│
│  ├─ id (FK)     │────→│  ├─ user_id (FK) │
│  ├─ role        │ 1:1 │  ├─ can_manage_* │
│  ├─ status      │     │  └─ ...          │
│  └─ ...         │     └──────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────────┐
│ user_subscriptions  │
│  ├─ id (UUID)       │
│  ├─ user_id (FK)    │
│  ├─ feature_id (FK) │──┐
│  ├─ bundle_id (FK)  │──┼──┐
│  ├─ status          │  │  │
│  └─ ...             │  │  │
└─────────────────────┘  │  │
                          │  │
         ┌────────────────┘  │
         │                   │
         ↓                   ↓
┌─────────────────┐  ┌──────────────────┐
│  features       │  │  bundles         │
│  ├─ id (UUID)   │  │  ├─ id (UUID)    │
│  ├─ slug        │  │  ├─ slug         │
│  ├─ quotas      │  │  ├─ pricing      │
│  └─ pricing     │  │  └─ ...          │
└────────┬────────┘  └─────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │ N:M
                    ↓
         ┌──────────────────┐
         │ bundle_features  │
         │  ├─ bundle_id    │
         │  ├─ feature_id   │
         │  └─ custom_limit │
         └──────────────────┘

┌─────────────────┐
│ feature_usage   │
│  ├─ id (UUID)   │
│  ├─ user_id (FK)│── NULL for anonymous
│  ├─ session_id  │── For anonymous tracking
│  ├─ feature_id  │
│  └─ ...         │
└─────────────────┘
```

---

## Access Control Examples

### Scenario 1: Anonymous User

```sql
-- First use (allowed)
SELECT can_access_feature('profitability-calculator', NULL, 'session-abc123');
-- Result: { allowed: true, reason: 'free_tier_anonymous', usage_count: 0, limit: 3 }

-- Fourth use (denied)
SELECT can_access_feature('profitability-calculator', NULL, 'session-abc123');
-- Result: { allowed: false, reason: 'quota_exceeded', login_required: true }
```

### Scenario 2: Logged-in User (No Subscription)

```sql
-- First use (allowed)
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);
-- Result: { allowed: true, reason: 'free_tier_logged_in', usage_count: 0, limit: 10 }

-- 11th use (denied)
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);
-- Result: { allowed: false, reason: 'quota_exceeded', upgrade_required: true }
```

### Scenario 3: Subscriber

```sql
-- Has active subscription
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);
-- Result: { allowed: true, reason: 'subscription_access', subscription_type: 'bundle' }
```

### Scenario 4: Staff Member

```sql
-- Staff always have access
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);
-- Result: { allowed: true, reason: 'staff_access', limit: null }
```

---

## Common Operations

### Check Migration Status

```sql
SELECT
  migration_name,
  status,
  executed_at,
  execution_time_ms || 'ms' as execution_time
FROM schema_migrations
ORDER BY id;
```

### Find Orphaned Records

```sql
SELECT * FROM find_orphaned_records();
```

### Get User's Access Summary

```sql
-- Get subscriptions
SELECT * FROM get_user_subscriptions(auth.uid());

-- Get usage stats
SELECT * FROM get_user_usage_stats(auth.uid(), 30);

-- Check specific feature access
SELECT can_access_feature('profitability-calculator', auth.uid(), NULL);
```

### Admin: View All Users

```sql
-- Must be staff with manage_users permission
SELECT
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.account_status,
  p.created_at,
  p.last_login_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE is_staff(auth.uid())
ORDER BY p.created_at DESC;
```

### Admin: Grant Staff Permissions

```sql
-- Must be admin or owner
INSERT INTO staff_permissions (
  user_id,
  can_manage_users,
  can_view_analytics,
  granted_by
) VALUES (
  'user-uuid-here',
  TRUE,
  TRUE,
  auth.uid()
);
```

---

## Troubleshooting

### Error: "psql: error: connection refused"

**Cause**: Supabase database connection issues

**Solution**:
```bash
# Verify Supabase URL format
echo $VITE_SUPABASE_URL
# Should be: https://project-id.supabase.co

# Test connection manually
psql -h project-id.db.supabase.co -p 5432 -U postgres -d postgres
```

### Error: "permission denied for table"

**Cause**: Using anon key instead of service role key

**Solution**:
```bash
# Verify service role key is set
echo $VITE_SUPABASE_SERVICE_ROLE_KEY | wc -c
# Should be > 200 characters (JWT token)
```

### Error: "relation does not exist"

**Cause**: Migration not executed or failed

**Solution**:
```bash
# Check migration status
./run-migrations.sh status

# Re-run migrations
./run-migrations.sh run
```

### Error: "foreign key constraint violation"

**Cause**: Orphaned records with invalid user_id

**Solution**:
```sql
-- Find orphaned records
SELECT * FROM find_orphaned_records();

-- Option 1: Delete orphaned records
SELECT * FROM cleanup_orphaned_records();

-- Option 2: Assign to default user (create one first)
UPDATE calculators SET user_id = 'default-user-uuid' WHERE user_id IS NULL;
```

---

## Security Considerations

### Service Role Key

⚠️ **NEVER expose service role key in frontend code**

```typescript
// ❌ WRONG
const supabase = createClient(url, serviceRoleKey);

// ✅ CORRECT
const supabase = createClient(url, anonKey);
```

### RLS Policies

All tables have Row Level Security (RLS) enabled. Ensure policies are tested:

```sql
-- Test RLS as different user roles
SELECT set_config('request.jwt.claims', '{"sub": "user-uuid", "role": "client"}', true);
SELECT * FROM profiles;  -- Should only see own profile
```

---

## Support

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Contact
- Supabase Support: support@supabase.io
- GitHub Issues: [marquespedroo/site-diogo/issues](https://github.com/marquespedroo/site-diogo/issues)

---

**Last Updated**: 2025-11-06
**Database Version**: 1.0.0
**Migration Count**: 4
