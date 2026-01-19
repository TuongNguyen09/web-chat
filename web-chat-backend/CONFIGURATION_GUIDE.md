# 🔐 Configuration & Security Guide

## Setup Local Development

### 1. Clone Repository
```bash
git clone <repo-url>
cd web-chat-backend
```

### 2. Create Configuration File
```bash
# Copy example file
cp src/main/resources/application-example.yaml src/main/resources/application.yaml

# Edit với thông tin local của bạn
nano src/main/resources/application.yaml
```

### 3. Configure Services

#### MongoDB Setup
```bash
# Option 1: Using Docker
docker run --name mongodb -d \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=123456 \
  -p 27017:27017 \
  mongo:latest

# Option 2: Install locally
# macOS:
brew install mongodb-community
brew services start mongodb-community

# Ubuntu:
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### Redis Setup
```bash
# Option 1: Using Docker
docker run --name redis -d \
  -p 6379:6379 \
  redis:latest redis-server --requirepass 123456

# Option 2: Install locally
# macOS:
brew install redis
brew services start redis

# Ubuntu:
sudo apt-get install -y redis-server
sudo systemctl start redis-server
```

### 4. Generate JWT Secret (Optional - if you want custom key)
```bash
# Generate strong random key
openssl rand -base64 32

# Copy output to application.yaml jwt.signerKey
```

### 5. Run Application
```bash
./mvnw spring-boot:run
# or
mvn clean install
mvn spring-boot:run
```

---

## ⚠️ IMPORTANT: Sensitive Information

### Files NEVER to commit:
- ❌ `src/main/resources/application.yaml` (contains passwords/keys)
- ❌ `src/main/resources/application-prod.yaml`
- ❌ `src/main/resources/application-dev.yaml`
- ❌ `.env` files

### What to use instead:
- ✅ `src/main/resources/application-example.yaml` (template for developers)
- ✅ Environment variables (for production)
- ✅ `.gitignore` (to prevent accidental commits)

---

## Production Deployment

For production, use **environment variables** instead of committing secrets:

### Using Docker:
```bash
docker run -e SPRING_DATA_MONGODB_URI="mongodb://..." \
           -e SPRING_DATA_REDIS_HOST="..." \
           -e SPRING_DATA_REDIS_PASSWORD="..." \
           -e JWT_SIGNERKEY="..." \
           your-app:latest
```

### Using application.yaml with env vars:
```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI}
    redis:
      host: ${REDIS_HOST}
      password: ${REDIS_PASSWORD}

jwt:
  signerKey: ${JWT_SECRET}
```

---

## Already Committed Secrets? 🚨

If you already pushed `application.yaml` with secrets to GitHub:

### Option 1: Remove from Git History (Recommended)
```bash
# Completely remove from git history
git filter-branch --tree-filter 'rm -f src/main/resources/application.yaml' HEAD

# Force push (⚠️ only if it's your own repo)
git push origin main --force

# Regenerate all secrets in production!
```

### Option 2: Invalidate Old Secrets (Quick Fix)
1. ❌ **Change all secrets immediately** (DB password, JWT key, etc.)
2. ✅ **Add file to .gitignore** (done)
3. ✅ **Create application-example.yaml** (done)
4. ✅ **Commit .gitignore change**

---

## Checklist Before First Commit

- [ ] Copy `application-example.yaml` to `application.yaml`
- [ ] Edit `application.yaml` with your local credentials
- [ ] Verify `application.yaml` is in `.gitignore`
- [ ] Run `git status` - should NOT show `application.yaml`
- [ ] Run app locally and test it works
- [ ] Commit & push (secrets remain local only)

---

## Useful Commands

```bash
# Check what files will be committed
git status

# View gitignore rules
cat .gitignore

# Check if file is ignored
git check-ignore src/main/resources/application.yaml

# Remove already tracked file (if accidentally committed)
git rm --cached src/main/resources/application.yaml
git commit -m "Remove application.yaml from tracking"

# Check git history for file
git log --all -- src/main/resources/application.yaml
```

