# 📤 GitHub Upload & Cleanup Checklist

## ✅ What to Keep (Commit to Git)

### Source Code
- ✅ `app/` - All Next.js application code
- ✅ `scripts/` - Setup and utility scripts
- ✅ `public/` - Static assets
- ✅ `tailwind.config.js` - Tailwind configuration
- ✅ `next.config.mjs` - Next.js configuration
- ✅ `package.json` - Dependencies list
- ✅ `package-lock.json` - Locked versions

### Documentation
- ✅ `README.md` - Main project documentation
- ✅ `AUTH_SETUP_GUIDE.md` - Authentication setup
- ✅ `CREDENTIALS_STORAGE.md` - Password storage documentation
- ✅ `MIGRATION_GUIDE.md` - Database migration guide
- ✅ `SETUP_INSTRUCTIONS.md` - Setup instructions
- ✅ `.env.example` - Environment template

### Database & Setup
- ✅ `setup-auth.sql` - Authentication schema
- ✅ `setup-schema.sql` - Initial database schema
- ✅ `setup-database.js` - Database setup script
- ✅ `setup-auth.sh` - Setup automation script

### Configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `netlify.toml` - Netlify deployment config
- ✅ `.env.example` - Environment variables template

## ❌ What NOT to Commit (Ignored)

### Sensitive Data
```
.env              # Supabase keys & secrets
.env.local        # Local environment variables
.env.*.local      # Environment-specific secrets
```

### Build & Dependencies
```
node_modules/     # Auto-installed from package.json
.next/            # Build artifacts (220MB+)
out/              # Build output
build/            # Build output
dist/             # Distribution files
```

### Development
```
.DS_Store         # macOS files
Thumbs.db         # Windows files
*.swp             # Vim swap files
*.swo             # Vim backup files
.idea/            # IDE files
.vscode/          # VS Code settings
*.iml             # IDE project files
```

### Temporary/Debug
```
*.log             # Log files
npm-debug.log*    # npm logs
yarn-debug.log*   # Yarn logs
pnpm-debug.log*   # pnpm logs
*.tmp             # Temporary files
/tmp/             # Temporary directory
```

### Data Files
```
data-2025/        # Sample data
data-2026/        # Sample data
```

## 🧹 Pre-Upload Cleanup Steps

### 1. Verify .gitignore is Correct
```bash
# Check what would be ignored
git status -uno

# Make sure these are NOT listed as untracked:
# - node_modules/
# - .next/
# - .env
```

### 2. Remove Excluded Files (Already handled by .gitignore)
```bash
# Just verify they're not staged
git status

# If accidentally staged, unstage:
git reset HEAD .env
git reset HEAD .next/
git reset HEAD node_modules/
```

### 3. Verify .env is NOT Committed
```bash
# Check if it's protected
git ls-files | grep -i ".env" | grep -v ".env.example"

# Should return nothing (only .env.example exists)
```

### 4. Final Check Before Push
```bash
# See what would be pushed
git diff --cached --name-only

# Should NOT include:
# - .env files
# - node_modules/
# - .next/
# - *.log files
```

## 📝 Required Files for Production Deploy

When deploying to production server, ensure these are present:

### Must Have
- ✅ `app/` directory with all code
- ✅ `scripts/setup-admin.js`
- ✅ `setup-auth.sql`
- ✅ `package.json` & `package-lock.json`
- ✅ `.env` (with production secrets) - **NOT in git**

### Generated During Build
```bash
npm install          # Creates node_modules/
npm run build        # Creates .next/
```

## 🚀 Deployment Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd magnolia
```

### 2. Install Dependencies
```bash
npm install
```
Note: This creates `node_modules/` which shouldn't be in git

### 3. Setup Environment
```bash
cp .env.example .env
# Edit .env with production Supabase credentials
```

### 4. Setup Database
```bash
# Run SQL from setup-auth.sql in Supabase
# Then create admin user:
node scripts/setup-admin.js
```

### 5. Build for Production
```bash
npm run build
npm start
```

## 📊 Repository Size After Cleanup

### With Cleanup (✅ Recommended)
```
Total: ~5-10 MB
- app/ directory: ~2 MB
- scripts/: ~100 KB
- configs: ~50 KB
- docs: ~100 KB
```

### Without Cleanup (❌ Not Recommended)
```
Total: ~600+ MB
- .next/: ~220 MB
- node_modules/: ~340 MB
- app/ & others: ~40 MB
```

**Difference: 590+ MB saved!** 🎉

## ✅ Pre-GitHub Upload Checklist

Before pushing to GitHub:

- [ ] `.gitignore` is properly configured
- [ ] `.env` file exists but is NOT staged
- [ ] `node_modules/` is NOT staged
- [ ] `.next/` directory is NOT staged
- [ ] All `.md` documentation files updated
- [ ] `package.json` includes all dependencies
- [ ] `setup-auth.sql` is present and correct
- [ ] `setup-admin.js` is updated and tested
- [ ] `.env.example` has correct structure
- [ ] No sensitive data in any COMMITTED files
- [ ] Run `git status` and verify only needed files shown

## 🔒 Security Checklist

Before making repository public:

- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded API keys in code
- [ ] No database passwords in files
- [ ] Auth tokens not logged or stored
- [ ] `.env.example` shows template only
- [ ] README includes security warnings
- [ ] CREDENTIALS_STORAGE.md documents security

## 📞 Support

If you accidentally commit sensitive files:

```bash
# Remove from git history (dangerous, should rebase/force push)
git filter-branch --tree-filter 'rm -f .env' HEAD

# Or better: rotate all keys immediately
# Then force push (only if solo development)
git push --force origin main
```

Always regenerate secrets after any potential exposure!
