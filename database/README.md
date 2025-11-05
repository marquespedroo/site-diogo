# Database Migrations

## Overview

This directory contains SQL migration files for the ImobiTools database schema.

## Structure

```
database/
├── migrations/
│   └── 001_initial_schema.sql   # Initial calculators table
└── README.md                      # This file
```

## Running Migrations

### Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Execute SQL
4. Verify tables created in Table Editor

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Migration Naming Convention

Migrations are numbered sequentially:
- `001_initial_schema.sql` - Initial database setup
- `002_add_feature.sql` - Add new feature
- `003_update_feature.sql` - Update existing feature

## Schema Overview

### Calculators Table

Stores payment flow calculators with shareable links.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User who created (no FK for now, allows anonymous)
- `short_code` (TEXT) - 6-character code for sharing (e.g., "abc123")
- `state` (JSONB) - Complete calculator state
- `views` (INTEGER) - View count for analytics
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `expires_at` (TIMESTAMPTZ) - Optional expiration

**Indexes:**
- `idx_calculators_user_id` - For querying by user
- `idx_calculators_short_code` - For shareable link lookups
- `idx_calculators_created_at` - For sorting by date

**RLS Policies:**
- Users can read/write their own calculators
- Anyone can read calculators with short codes (public links)

## Functions

### `increment_calculator_views(calculator_id UUID)`

Atomically increments view count for a calculator.

**Usage:**
```sql
SELECT increment_calculator_views('uuid-here');
```

## Security

- Row Level Security (RLS) enabled
- Users can only modify their own calculators
- Public read access only for calculators with short codes
- User ID stored as TEXT (flexible, no FK constraints yet)

## Future Migrations

Planned migrations:
- Add users table with authentication
- Add foreign key from calculators.user_id to users.id
- Add analytics table for view tracking
- Add calculator templates table
