# 🔐 Security & Environment Configuration Guide

## ⚠️ CRITICAL: Sensitive Data Management

### Problem Solved ✅
- ❌ Application secrets were accidentally committed to GitHub
- ✅ Now using `.gitignore` to prevent future leaks
- ✅ Created `.env.example` as template for developers

---

## File Structure

### Frontend (.env files)
```
web-chat-frontend/
├── .env                      ❌ LOCAL ONLY (Git ignored)
├── .env.example             ✅ Template (committed to Git)
├── .env.development.local   ❌ LOCAL ONLY (Git ignored)
└── .env.production          ❌ LOCAL ONLY (Git ignored)
```

### Backend (application.yaml files)
```
web-chat-backend/
├── src/main/resources/
│   ├── application.yaml              ❌ LOCAL ONLY (Git ignored)
│   ├── application-example.yaml      ✅ Template (committed to Git)
│   ├── application-dev.yaml          ❌ LOCAL ONLY (Git ignored)
│   └── application-prod.yaml         ❌ LOCAL ONLY (Git ignored)
```

---

## Setup Instructions

### Frontend Setup

#### Step 1: Copy Example File
```bash
cd web-chat-frontend
cp .env.example .env
```

#### Step 2: Edit .env with Local Values
```bash
nano .env
```

**Your .env should contain:**
```env
REACT_APP_API_URL=http://localhost:8080/whatsapp
REACT_APP_WS_URL=http://localhost:8080/whatsapp/ws
REACT_APP_CLOUDINARY_CLOUD_NAME=dj923dmx3
REACT_APP_CLOUDINARY_UPLOAD_PRESET=whatsapp
REACT_APP_CLOUDINARY_API_URL=https://api.cloudinary.com/v1_1/dj923dmx3/auto/upload
REACT_APP_ENV=development
```

#### Step 3: Verify Git Ignores It
```bash
git status
# Should NOT show .env

git check-ignore .env
# Should print: .env
```

---

### Backend Setup

#### Step 1: Copy Example File
```bash
cd web-chat-backend
cp src/main/resources/application-example.yaml src/main/resources/application.yaml
```

#### Step 2: Edit application.yaml with Local Values
```bash
nano src/main/resources/application.yaml
```

**Your application.yaml should contain:**
```yaml
server:
  port: 8080
  servlet:
    context-path: /whatsapp

spring:
  data:
    mongodb:
      uri: mongodb://root:your_password@localhost:27017/whatsapp?authSource=admin
    redis:
      host: localhost
      port: 6379
      password: your_password
      timeout: 6000ms

jwt:
  signerKey: "your_jwt_secret_key_here"
  valid-duration: 3600
  refreshable-duration: 7200
```

#### Step 3: Verify Git Ignores It
```bash
git status
# Should NOT show src/main/resources/application.yaml

git check-ignore src/main/resources/application.yaml
# Should print: src/main/resources/application.yaml
```

---

## Environment Variables by Environment

### Development (Local Machine)
```env
# Frontend: .env
REACT_APP_API_URL=http://localhost:8080/whatsapp
REACT_APP_ENV=development

# Backend: application.yaml
mongodb.uri=mongodb://root:localpass@localhost:27017/...
jwt.signerKey=my_local_dev_key_123456
```

### Production (Deployment Server)
```bash
# Use environment variables, NOT files!
export REACT_APP_API_URL=https://api.yourdomain.com/whatsapp
export SPRING_DATA_MONGODB_URI=mongodb://username:password@...
export JWT_SIGNERKEY=production_secret_key_very_long_and_secure
```

---

## What NOT to Commit 🚫

```
❌ .env                 (local environment)
❌ .env.local           (local overrides)
❌ .env.*.local         (environment-specific local)
❌ application.yaml     (contains credentials)
❌ application-*.yaml   (environment configs with secrets)
❌ .aws/                (AWS credentials)
❌ .ssh/                (SSH keys)
❌ *.pem                (certificate files)
❌ secrets.json         (any secrets file)
```

---

## What TO Commit ✅

```
✅ .env.example              (template with placeholders)
✅ application-example.yaml  (template with comments)
✅ .gitignore               (rules to prevent commits)
✅ CONFIGURATION_GUIDE.md   (setup instructions)
✅ README.md                (project documentation)
```

---

## Already Committed Secrets? 🚨

If you see secrets in GitHub history:

### Step 1: Immediate Action (Quick Fix)
```bash
# 1. Regenerate ALL secrets immediately
#    - Change MongoDB password
#    - Change Redis password
#    - Generate new JWT secret
#    - Rotate Cloudinary keys

# 2. Add to .gitignore
git add .gitignore
git commit -m "Add sensitive files to .gitignore"
git push origin main
```

### Step 2: Remove from Git History (Deep Clean)
```bash
# Remove application.yaml from all history
git filter-branch --tree-filter 'rm -f src/main/resources/application.yaml' HEAD

# Remove .env from all history
git filter-branch --tree-filter 'rm -f .env .env.local' HEAD

# Force push (⚠️ WARNING: This rewrites history!)
git push origin main --force

# Notify team to re-clone repository
```

### Step 3: Cleanup Local
```bash
# Force Git to recognize .gitignore changes
git rm --cached .env
git rm --cached src/main/resources/application.yaml
git commit -m "Remove secrets from Git tracking"
git push origin main
```

---

## Pre-Commit Checklist

Before EVERY commit, verify:

```bash
# 1. Check for secrets
git diff --cached | grep -i "password\|secret\|key\|token"
# Should return NOTHING

# 2. Check ignored files
git status
# Should NOT list: .env, application.yaml, or other sensitive files

# 3. Check what will be committed
git ls-files
# Should NOT contain sensitive files

# 4. Final safety check
git diff --cached --name-only | grep -E '\.(env|yaml|properties)$'
# Should return NOTHING for local config files
```

---

## Useful Git Commands

```bash
# List ignored files (useful for verification)
git check-ignore -v <file>

# Show rules matching a file
git check-ignore -v .env

# Verify file is actually ignored
git ls-files --exclude-standard | grep .env
# Should return nothing

# Untrack accidentally committed file
git rm --cached <file>
git commit -m "Remove <file> from tracking"

# View file in history (if already committed)
git log --all --full-history -- <file>

# See if secret is in any branch
git grep 'your_secret_key' --all
```

---

## CI/CD Integration

For GitHub Actions or similar:

### Option 1: Secret Manager (Recommended)
```yaml
# .github/workflows/deploy.yml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: ./deploy.sh
```

### Option 2: .env at Build Time
```bash
# Create .env file during build (for sensitive repos)
echo "REACT_APP_API_URL=$API_URL" > .env
echo "REACT_APP_KEY=$APP_KEY" >> .env
npm run build
```

---

## Summary

| Item | Frontend | Backend |
|------|----------|---------|
| **Template File** | `.env.example` | `application-example.yaml` |
| **Local File** | `.env` | `application.yaml` |
| **Git Tracked** | ❌ | ❌ |
| **In .gitignore** | ✅ | ✅ |
| **Setup** | `cp .env.example .env` | `cp ... application.yaml` |
| **Commit Template** | ✅ | ✅ |

---

## Need Help?

```bash
# Check if file will be ignored
git status --ignored

# Simulate what would be committed
git diff --cached --name-only

# View .gitignore rules
cat .gitignore

# Debug gitignore
git check-ignore -v <file>
```

