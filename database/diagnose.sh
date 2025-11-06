#!/bin/bash

echo "=========================================="
echo "Supabase Connection Diagnostics"
echo "=========================================="
echo ""

# Load environment
source ../.env

echo "1. Environment Configuration:"
echo "   Project URL: ${VITE_SUPABASE_URL}"
echo "   Project Ref: qtjnbcmhihtawdetminw"
echo "   Service Key: ${VITE_SUPABASE_SERVICE_ROLE_KEY:0:50}..."
echo ""

echo "2. Testing DNS Resolution:"
echo ""
echo "   Testing: qtjnbcmhihtawdetminw.db.supabase.co"
nslookup qtjnbcmhihtawdetminw.db.supabase.co 2>&1 | head -10
echo ""

echo "3. Testing Alternative Hostnames:"
echo ""

# Try different hostname formats
HOSTNAMES=(
  "qtjnbcmhihtawdetminw.db.supabase.co"
  "db.qtjnbcmhihtawdetminw.supabase.co"
  "aws-0-us-east-1.pooler.supabase.com"
  "aws-0-us-west-1.pooler.supabase.com"
)

for host in "${HOSTNAMES[@]}"; do
  echo "   Checking: $host"
  if nslookup "$host" > /dev/null 2>&1; then
    echo "   ✅ Resolves"
  else
    echo "   ❌ Does not resolve"
  fi
done

echo ""
echo "4. Network Connectivity:"
echo ""
echo "   Testing internet connection..."
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
  echo "   ✅ Internet connection OK"
else
  echo "   ❌ No internet connection"
fi

echo ""
echo "5. Port Connectivity Test:"
echo ""
echo "   Testing port 5432 (Direct)..."
if nc -zv qtjnbcmhihtawdetminw.db.supabase.co 5432 2>&1 | grep -q succeeded; then
  echo "   ✅ Port 5432 is open"
else
  echo "   ❌ Port 5432 is not accessible"
fi

echo ""
echo "   Testing port 6543 (Pooler) on aws-0-us-east-1.pooler.supabase.com..."
if nc -zv aws-0-us-east-1.pooler.supabase.com 6543 2>&1 | grep -q succeeded; then
  echo "   ✅ Port 6543 is open"
else
  echo "   ❌ Port 6543 is not accessible"
fi

echo ""
echo "=========================================="
echo "Diagnosis Complete"
echo "=========================================="
echo ""
echo "RECOMMENDATION:"
echo ""
echo "Based on the results above:"
echo ""
echo "If DNS resolution failed:"
echo "  → The hostname format may be incorrect"
echo "  → Supabase may have changed their connection architecture"
echo "  → Use SQL Editor instead: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql"
echo ""
echo "If DNS works but ports are blocked:"
echo "  → Direct connections may need to be enabled in Supabase settings"
echo "  → Try connection pooler (port 6543)"
echo "  → Or use SQL Editor (recommended)"
echo ""
echo "EASIEST SOLUTION:"
echo "  1. Open: https://supabase.com/dashboard/project/qtjnbcmhihtawdetminw/sql"
echo "  2. Copy: database/CONSOLIDATED_MIGRATION.sql"
echo "  3. Paste and Run"
echo "  ✅ Done in 2 minutes!"
echo ""
