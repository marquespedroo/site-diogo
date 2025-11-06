#!/bin/bash

# Load environment variables
source ../.env

echo "===================================="
echo "Testing Supabase Connection"
echo "===================================="
echo ""
echo "Configuration:"
echo "  URL: ${VITE_SUPABASE_URL}"
echo "  DB Host: qtjnbcmhihtawdetminw.db.supabase.co"
echo "  Port: 5432"
echo "  Database: postgres"
echo "  User: postgres"
echo "  Service Key Length: ${#VITE_SUPABASE_SERVICE_ROLE_KEY} characters"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed"
    exit 1
fi

echo "Testing connection..."
echo ""

# Test connection
export PGPASSWORD="${VITE_SUPABASE_SERVICE_ROLE_KEY}"

psql -h qtjnbcmhihtawdetminw.db.supabase.co \
     -p 5432 \
     -U postgres \
     -d postgres \
     -c "SELECT version();" 2>&1

EXIT_CODE=$?

echo ""
echo "Exit code: $EXIT_CODE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed"
    echo ""
    echo "Common issues:"
    echo "1. Supabase may require IPv4 pooler connection"
    echo "2. Connection might be blocked by firewall"
    echo "3. Direct database connections may need to be enabled in Supabase settings"
    echo ""
    echo "Try this URL format instead:"
    echo "   postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    echo ""
    echo "Or use Supabase SQL Editor (recommended):"
    echo "   https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql"
fi

exit $EXIT_CODE
