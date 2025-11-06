# API Keys Required for Portify Dashboard

## Required API Keys

### 1. **Zerodha Kite API** (REQUIRED)
**Purpose**: Portfolio data, market quotes, trading operations

**How to get**:
1. Go to [Kite Connect Developer Portal](https://developers.kite.trade/)
2. Sign up for a developer account (costs ₹2000/month)
3. Create a new app:
   - App Name: `Portify`
   - Redirect URL: `http://localhost:3000/api/oauth/callback`
4. Get your:
   - **API Key** (e.g., `abc123xyz`)
   - **API Secret** (e.g., `secret123xyz`)

**Environment Variables**:
```env
KITE_API_KEY="your_kite_api_key"
KITE_API_SECRET="your_kite_api_secret"
```

**Also configure in `kite-config.json`**:
```json
{
  "apiKey": "your_kite_api_key",
  "apiSecret": "your_kite_api_secret",
  "accessToken": "your_access_token_after_oauth"
}
```

**Note**: You'll need to complete OAuth flow to get `accessToken`. Visit:
```
https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY
```

---

### 2. **PostgreSQL Database** (REQUIRED)
**Purpose**: Store user data, portfolio cache

**Environment Variable**:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/portify"
```

**Example**:
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/portify"
```

**Setup**:
- Install PostgreSQL locally, or
- Use a cloud service like [Supabase](https://supabase.com) (free tier available) or [Railway](https://railway.app)

---

## Optional API Keys

### 3. **News API** (OPTIONAL - for news feed)
**Purpose**: Fetch news articles about your stock holdings

**Option A: NewsAPI.org** (Recommended)
- **Free tier**: 100 requests/day
- **Get it**: [newsapi.org](https://newsapi.org/register)
- **Environment Variable**:
  ```env
  NEWS_API_KEY="your_newsapi_key"
  ```

**Option B: Alpha Vantage** (Alternative)
- **Free tier**: 5 API calls/minute, 500 calls/day
- **Get it**: [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- **Environment Variable**:
  ```env
  ALPHA_VANTAGE_API_KEY="your_alphavantage_key"
  ```

**Note**: If neither is provided, the news feed will be empty but dashboard will still work.

---

### 4. **OpenAI API** (OPTIONAL - for sentiment analysis)
**Purpose**: Analyze sentiment of news articles (positive/negative/neutral)

**How to get**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key

**Environment Variable**:
```env
OPENAI_API_KEY="sk-your-openai-api-key"
```

**Note**: Without this, news articles will still show but won't have sentiment scores. Uses `gpt-4o-mini` model (low cost).

**Cost**: ~$0.15 per 1M tokens (very cheap for sentiment analysis)

---

## Complete .env.local Example

Create a file `.env.local` in the `backend/` directory:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://postgres:password@localhost:5432/portify"

# Zerodha Kite API (REQUIRED)
KITE_API_KEY="abc123xyz"
KITE_API_SECRET="secret123xyz"

# News API (OPTIONAL)
NEWS_API_KEY="your_newsapi_key"

# OpenAI API (OPTIONAL)
OPENAI_API_KEY="sk-your-openai-api-key"

# Optional: Demo user ID (for testing)
NEXT_PUBLIC_DEMO_USER_ID="demo-user-id"
```

---

## What Works Without Optional Keys?

| Feature | Without News API | Without OpenAI API |
|---------|------------------|-------------------|
| Portfolio Overview | ✅ Works | ✅ Works |
| Stock Holdings | ✅ Works | ✅ Works |
| Technical Analysis | ✅ Works | ✅ Works |
| News Feed | ❌ Empty | ✅ Shows articles |
| Sentiment Scores | N/A | ❌ No sentiment |

---

## Quick Setup Checklist

- [ ] Get Zerodha Kite API credentials
- [ ] Set up PostgreSQL database
- [ ] Configure `.env.local` with database URL
- [ ] Configure `.env.local` with Kite API keys
- [ ] Create `kite-config.json` file
- [ ] Complete OAuth flow to get access token
- [ ] (Optional) Get News API key
- [ ] (Optional) Get OpenAI API key

---

## Cost Estimate

- **Kite API**: ₹2000/month (~$24/month) - Required
- **PostgreSQL**: Free (local) or ~$5-10/month (cloud)
- **News API**: Free tier available (100 requests/day)
- **OpenAI**: ~$0.01-0.05/month for sentiment analysis

**Minimum Monthly Cost**: ~₹2000/month (just Kite API)

---

## Troubleshooting

### "Kite API error: Session expired"
- Re-authenticate via OAuth flow
- Update `accessToken` in `kite-config.json`

### "News API key not configured"
- News feed will be empty but dashboard still works
- Consider getting a free NewsAPI.org key

### "OPENAI_API_KEY environment variable is missing"
- Sentiment analysis won't work
- News articles will still show without sentiment scores

### Database Connection Error
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Run migrations: `npm run prisma:migrate`

