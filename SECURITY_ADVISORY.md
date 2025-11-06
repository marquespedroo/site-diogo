# 🚨 SECURITY ADVISORY - IMMEDIATE ACTION REQUIRED

**Date**: 2025-11-06
**Severity**: HIGH
**Status**: UNRESOLVED
**Affected**: Supabase API Keys

---

## Executive Summary

Your Supabase API keys were exposed in the `.env` file and may have been committed to version control. These credentials provide access to your database and authentication system and must be regenerated immediately.

---

## Affected Credentials

The following credentials in `.env` are potentially compromised:

```
VITE_SUPABASE_URL=https://imobtools.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

### Risk Assessment

| Credential | Access Level | Risk Level | Impact |
|------------|--------------|------------|---------|
| `VITE_SUPABASE_ANON_KEY` | Public API | MEDIUM | Read access via RLS policies |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Admin API | **CRITICAL** | Full database access, bypasses RLS |

---

## Immediate Actions Required

### ⚠️ CRITICAL - Do This First

1. **Regenerate Supabase Keys** (5 minutes)
   - Login to [Supabase Dashboard](https://app.supabase.com)
   - Navigate to: Project Settings → API
   - Click "Generate new anon key" → Confirm
   - Click "Generate new service_role key" → Confirm
   - **SAVE THE NEW KEYS IMMEDIATELY**

2. **Update `.env` File** (2 minutes)
   ```bash
   # Update these values in .env
   VITE_SUPABASE_ANON_KEY=<NEW_ANON_KEY>
   VITE_SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY>
   ```

3. **Verify `.env` is in `.gitignore`** (1 minute)
   ```bash
   # Check if .env is ignored
   git check-ignore .env

   # If not ignored, add it:
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "chore: ensure .env is gitignored"
   ```

4. **Remove from Git History** (10 minutes)

   **Option A: Using BFG Repo-Cleaner (Recommended)**
   ```bash
   # Install BFG
   brew install bfg  # macOS

   # Create backup
   git clone --mirror https://github.com/marquespedroo/site-diogo.git site-diogo-backup

   # Remove .env from history
   bfg --delete-files .env site-diogo-backup

   # Cleanup and force push
   cd site-diogo-backup
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

   **Option B: Using git-filter-repo**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo

   # Create backup
   cp -r .git .git-backup

   # Remove .env from history
   git filter-repo --invert-paths --path .env

   # Force push
   git push --force --all
   ```

5. **Verify No Exposure** (5 minutes)
   ```bash
   # Search entire git history for old keys
   git log --all --full-history --source -S "<OLD_ANON_KEY>"

   # Should return no results
   ```

---

## Post-Remediation Checklist

- [ ] New anon key generated and updated in `.env`
- [ ] New service_role key generated and updated in `.env`
- [ ] `.env` is in `.gitignore`
- [ ] Old keys removed from git history
- [ ] Changes force-pushed to remote
- [ ] Application tested with new keys
- [ ] Team members notified to pull latest changes
- [ ] CI/CD environment variables updated (if applicable)
- [ ] No secrets in git history (verified)

---

## Prevention Measures

### 1. Environment Variable Management

**Use `.env.example` for Templates**
```bash
# Create a template without sensitive values
cp .env .env.example

# Edit .env.example to remove actual values
cat > .env.example << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_FEATURE_AUTH=true
EOF

# Commit the template
git add .env.example
git commit -m "docs: add environment variables template"
```

### 2. Git Hooks for Secret Detection

**Install Pre-commit Hook**
```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check for potential secrets
if git diff --cached --name-only | grep -E '\.env$'; then
  echo "❌ ERROR: Attempting to commit .env file"
  echo "Please ensure .env is in .gitignore"
  exit 1
fi

# Check for Supabase keys in staged files
if git diff --cached | grep -E "eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"; then
  echo "❌ ERROR: Potential Supabase key detected in commit"
  echo "Remove secrets before committing"
  exit 1
fi

exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 3. Use Secret Management Tools

**For Development**
- Use [direnv](https://direnv.net/) for automatic env loading
- Use [1Password CLI](https://developer.1password.com/docs/cli) for secure storage

**For Production**
- Store secrets in environment variables (Vercel, Netlify, etc.)
- Use [Doppler](https://doppler.com/) or [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- Never commit production secrets to repositories

### 4. GitHub Secret Scanning

Enable GitHub's secret scanning (if using GitHub):
1. Go to: Repository Settings → Security & analysis
2. Enable: "Secret scanning"
3. Enable: "Push protection"

---

## Security Best Practices Going Forward

### Environment Variable Hierarchy

```
Development:   .env (local only, gitignored)
Staging:       Environment variables in hosting platform
Production:    Secret management service + Environment variables
```

### Service Role Key Usage

**⚠️ NEVER use service_role key in frontend code**

```typescript
// ❌ WRONG - Exposes admin access
const supabase = createClient(url, serviceRoleKey);

// ✅ CORRECT - Use anon key with RLS
const supabase = createClient(url, anonKey);
```

**Service role key should ONLY be used:**
- Backend API routes
- Server-side functions
- Database migrations
- Admin scripts

### Key Rotation Schedule

| Key Type | Rotation Frequency | Reason |
|----------|-------------------|---------|
| Anon Key | Every 6 months | Low risk (RLS protected) |
| Service Role Key | Every 3 months | High risk (full access) |
| After Exposure | **Immediately** | Security incident |

---

## Incident Response Timeline

| Time | Action | Responsible |
|------|--------|-------------|
| T+0 (NOW) | Regenerate keys | **Developer** |
| T+5min | Update `.env` | **Developer** |
| T+10min | Remove from git history | **Developer** |
| T+30min | Test application | **QA/Developer** |
| T+1hr | Document incident | **Team Lead** |
| T+24hr | Review security policies | **Team** |

---

## Support Resources

### Supabase Documentation
- [API Keys Management](https://supabase.com/docs/guides/api#api-keys)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Git Secret Removal
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

### Contact
- Supabase Support: support@supabase.io
- GitHub Support: https://support.github.com

---

## Verification Commands

After completing remediation, run these commands to verify:

```bash
# 1. Verify .env is gitignored
git check-ignore .env
# Expected: .env

# 2. Verify no secrets in current commit
git diff HEAD
# Expected: No .env changes

# 3. Verify no secrets in history (check last 100 commits)
git log --all -p -S "eyJ" --since="1 month ago" | grep "eyJ" | wc -l
# Expected: 0

# 4. Verify application works with new keys
npm run dev
# Expected: App starts without errors

# 5. Test Supabase connection
curl https://imobtools.supabase.co/rest/v1/ \
  -H "apikey: <NEW_ANON_KEY>"
# Expected: 200 OK
```

---

## Conclusion

**STATUS**: ⚠️ ACTION REQUIRED

This is a **HIGH SEVERITY** security issue that requires immediate attention. Follow the steps above in order and verify each step before proceeding.

**Estimated Time to Resolution**: 20-30 minutes

**Next Steps After Remediation**:
1. ✅ Complete this security advisory checklist
2. ✅ Proceed with database migrations (Phase 0)
3. ✅ Implement authentication system (Phase 1-4)
4. ✅ Enable authentication in application (`VITE_FEATURE_AUTH=true`)

---

**Document Last Updated**: 2025-11-06
**Document Version**: 1.0
**Review Date**: After key rotation completion
