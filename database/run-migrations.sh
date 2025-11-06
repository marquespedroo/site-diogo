#!/bin/bash

# =====================================================
# ImobiTools Database Migration Runner
# =====================================================
# Purpose: Execute database migrations in correct order
# Author: ImobiTools Architecture Team
# Date: 2025-11-06
# =====================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================
# Configuration
# =====================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"
ENV_FILE="${SCRIPT_DIR}/../.env"

# Migration order
MIGRATIONS=(
  "000_user_management.sql"
  "001_features_bundles.sql"
  "002_subscriptions_usage.sql"
  "005_fix_existing_tables.sql"
)

# =====================================================
# Helper Functions
# =====================================================

print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Load environment variables
load_env() {
  if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
  fi

  # Load .env file
  export $(grep -v '^#' "$ENV_FILE" | xargs)

  # Validate required variables
  if [ -z "${VITE_SUPABASE_URL:-}" ]; then
    print_error "VITE_SUPABASE_URL not set in .env"
    exit 1
  fi

  if [ -z "${VITE_SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    print_error "VITE_SUPABASE_SERVICE_ROLE_KEY not set in .env"
    print_warning "Service role key is required to run migrations"
    exit 1
  fi

  # Extract database connection details from Supabase URL
  DB_HOST=$(echo "$VITE_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|db.\1.supabase.co|')
  DB_PORT=5432
  DB_NAME="postgres"
  DB_USER="postgres"
  DB_PASSWORD="${VITE_SUPABASE_SERVICE_ROLE_KEY}"

  print_success "Environment variables loaded"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check if psql is installed
  if ! command -v psql &> /dev/null; then
    print_error "psql is not installed"
    print_info "Install PostgreSQL client:"
    print_info "  macOS: brew install postgresql"
    print_info "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
  fi
  print_success "psql is installed"

  # Check if migration files exist
  local missing_files=0
  for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "${MIGRATIONS_DIR}/${migration}" ]; then
      print_error "Migration file not found: ${migration}"
      missing_files=$((missing_files + 1))
    fi
  done

  if [ $missing_files -gt 0 ]; then
    print_error "$missing_files migration file(s) missing"
    exit 1
  fi
  print_success "All migration files present"
}

# Test database connection
test_connection() {
  print_header "Testing Database Connection"

  PGPASSWORD="$DB_PASSWORD" PGCONNECT_TIMEOUT=10 psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT version();" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    print_success "Database connection successful"
  else
    print_error "Database connection failed"
    print_info "Verify your Supabase credentials in .env"
    exit 1
  fi
}

# Create migrations tracking table
create_migrations_table() {
  print_header "Creating Migrations Tracking Table"

  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -c "
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        execution_time_ms INTEGER,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
        error_message TEXT
      );
    " > /dev/null 2>&1

  print_success "Migrations tracking table ready"
}

# Check if migration was already executed
is_migration_executed() {
  local migration_name=$1

  local count=$(PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name' AND status = 'success';" | xargs)

  [ "$count" -gt 0 ]
}

# Execute a single migration
execute_migration() {
  local migration_file=$1
  local migration_name="${migration_file%.sql}"

  print_info "Executing: $migration_file"

  if is_migration_executed "$migration_name"; then
    print_warning "Already executed: $migration_name"
    return 0
  fi

  local start_time=$(date +%s%3N)

  # Execute migration
  local error_log=$(mktemp)
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -f "${MIGRATIONS_DIR}/${migration_file}" 2> "$error_log"

  local exit_code=$?
  local end_time=$(date +%s%3N)
  local execution_time=$((end_time - start_time))

  if [ $exit_code -eq 0 ]; then
    # Record success
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "INSERT INTO schema_migrations (migration_name, execution_time_ms, status) VALUES ('$migration_name', $execution_time, 'success');" > /dev/null 2>&1

    print_success "Completed: $migration_name (${execution_time}ms)"
    rm "$error_log"
    return 0
  else
    # Record failure
    local error_message=$(cat "$error_log" | head -n 10)
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -c "INSERT INTO schema_migrations (migration_name, execution_time_ms, status, error_message) VALUES ('$migration_name', $execution_time, 'failed', '$error_message');" > /dev/null 2>&1

    print_error "Failed: $migration_name"
    echo ""
    cat "$error_log"
    rm "$error_log"
    return 1
  fi
}

# Run all migrations
run_migrations() {
  print_header "Running Migrations"

  local success_count=0
  local skip_count=0
  local fail_count=0

  for migration in "${MIGRATIONS[@]}"; do
    if execute_migration "$migration"; then
      if is_migration_executed "${migration%.sql}"; then
        if [ "$?" -eq 0 ]; then
          skip_count=$((skip_count + 1))
        fi
      else
        success_count=$((success_count + 1))
      fi
    else
      fail_count=$((fail_count + 1))
      print_error "Migration failed. Stopping execution."
      break
    fi
  done

  echo ""
  print_info "Migration Summary:"
  print_info "  - Executed: $success_count"
  print_info "  - Skipped: $skip_count"
  print_info "  - Failed: $fail_count"

  if [ $fail_count -gt 0 ]; then
    return 1
  fi

  return 0
}

# Verify migrations
verify_migrations() {
  print_header "Verifying Migrations"

  # Check if key tables exist
  local tables=("profiles" "features" "bundles" "user_subscriptions" "feature_usage")
  local missing_tables=0

  for table in "${tables[@]}"; do
    local exists=$(PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" | xargs)

    if [ "$exists" = "t" ]; then
      print_success "Table exists: $table"
    else
      print_error "Table missing: $table"
      missing_tables=$((missing_tables + 1))
    fi
  done

  if [ $missing_tables -gt 0 ]; then
    print_error "Verification failed: $missing_tables table(s) missing"
    return 1
  fi

  print_success "All tables verified"
  return 0
}

# Show migration status
show_migration_status() {
  print_header "Migration Status"

  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "
      SELECT
        migration_name,
        status,
        executed_at,
        execution_time_ms || 'ms' as execution_time
      FROM schema_migrations
      ORDER BY id;
    "
}

# Rollback last migration (dangerous!)
rollback_migration() {
  print_warning "Rollback functionality not implemented"
  print_warning "Manual rollback required via Supabase dashboard"
  print_info "Create a backup before attempting manual rollback"
}

# =====================================================
# Main Function
# =====================================================

main() {
  print_header "ImobiTools Database Migration Runner"

  # Parse command line arguments
  case "${1:-run}" in
    run)
      load_env
      check_prerequisites
      test_connection
      create_migrations_table
      if run_migrations; then
        verify_migrations
        show_migration_status
        print_success "All migrations completed successfully!"
        echo ""
        print_warning "IMPORTANT: Review SECURITY_ADVISORY.md and regenerate Supabase keys!"
        exit 0
      else
        print_error "Migrations failed. Review errors above."
        exit 1
      fi
      ;;

    status)
      load_env
      test_connection
      show_migration_status
      ;;

    verify)
      load_env
      test_connection
      verify_migrations
      ;;

    rollback)
      rollback_migration
      ;;

    help|--help|-h)
      echo "Usage: $0 [command]"
      echo ""
      echo "Commands:"
      echo "  run      - Execute all pending migrations (default)"
      echo "  status   - Show migration execution history"
      echo "  verify   - Verify database schema"
      echo "  rollback - Rollback last migration (not implemented)"
      echo "  help     - Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0 run"
      echo "  $0 status"
      exit 0
      ;;

    *)
      print_error "Unknown command: $1"
      echo "Use '$0 help' for usage information"
      exit 1
      ;;
  esac
}

# =====================================================
# Execute Main
# =====================================================

main "$@"
