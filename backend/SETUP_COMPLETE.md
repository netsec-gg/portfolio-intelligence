# Quick Start Guide - API Keys Configured ✅

Your API keys have been configured! Here's what to do next:

## ✅ What's Been Configured

1. **kite-config.json** - Updated with your Zerodha credentials
2. **.env.local** - Created with all your API keys
3. **.gitignore** - Updated to prevent committing secrets

## 🚀 Next Steps

### Step 1: Get Zerodha Access Token (OAuth)

You need to complete the OAuth flow to get your access token:

1. **Start your dev server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Visit this URL**:
   ```
   http://localhost:3000/api/oauth/authorize
   ```

3. **Or manually visit**:
   ```
   https://kite.zerodha.com/connect/login?v=3&api_key=f284nayjeebjjha0&redirect_url=http://localhost:3000/api/oauth/callback
   ```

4. **Log in** with your Zerodha credentials and authorize the app

5. **After authorization**, you'll be redirected back and the access token will be saved automatically

### Step 2: Run Database Migrations

```bash
# If using Docker
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate

# Or locally
npm run prisma:migrate
```

### Step 3: Access Your Dashboard

Once everything is set up:
- **Dashboard**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🔒 Security Notes

- ✅ `.env.local` is in `.gitignore` - won't be committed
- ✅ `kite-config.json` is in `.gitignore` - won't be committed
- ⚠️ **Never commit** these files to git!

## 📝 Your API Keys Status

| Service | Status | Key |
|---------|--------|-----|
| Zerodha Kite | ✅ Configured | API Key & Secret set |
| OpenAI | ✅ Configured | API Key set |
| News API | ✅ Configured | API Key set |
| Access Token | ⏳ Pending | Need OAuth flow |

## 🐳 Using Docker Compose

If you prefer Docker:

```bash
cd backend
docker-compose -f docker-compose.dev.yml up --build
```

Then in another terminal:
```bash
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate
```

## 🆘 Troubleshooting

### "Session expired" error
- Complete OAuth flow again to get a fresh access token
- Access tokens expire daily

### "Database connection error"
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env.local

### "API key not found"
- Verify .env.local exists and has correct values
- Restart the dev server after updating .env.local

Your setup is ready! Just complete the OAuth flow to get your access token and you're good to go! 🎉

