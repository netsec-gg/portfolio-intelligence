# How to Get Kite API Credentials

## Step-by-Step Guide

### Step 1: Zerodha Account
- You need a Zerodha trading account
- If you don't have one: https://zerodha.com/open-account/

### Step 2: Developer Account
1. Go to **https://developers.kite.trade/**
2. Sign in with your Zerodha credentials
3. **Important**: API access costs **₹2000/month** (~$24/month)
4. Accept the terms and complete registration

### Step 3: Create App
1. After logging in, click **"My Apps"** or **"Create App"**
2. Fill in the form:
   - **App Name**: `Portify` (or any name you want)
   - **Redirect URL**: `http://localhost:3000/api/oauth/callback`
   - **App Type**: Select "Web app"
3. Click **"Create"**

### Step 4: Get API Credentials
After creating the app, you'll see:
- **API Key**: A string like `abc123xyz` (this is your KITE_API_KEY)
- **API Secret**: A string like `secret123xyz` (this is your KITE_API_SECRET)

**⚠️ Important**: Keep these secret! Never commit them to git.

### Step 5: Configure Your App

**A. Update `kite-config.json`:**
```json
{
  "apiKey": "your_api_key_here",
  "apiSecret": "your_api_secret_here",
  "accessToken": ""
}
```

**B. Create `.env.local` file** (in `backend/` directory):
```env
KITE_API_KEY="your_api_key_here"
KITE_API_SECRET="your_api_secret_here"
DATABASE_URL="postgresql://user:password@localhost:5432/portify"
```

### Step 6: Get Access Token (OAuth Flow)

After setting up API Key and Secret, you need to get an access token:

**Option A: Using the OAuth endpoint**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/oauth/authorize`
3. This will redirect you to Zerodha login
4. Log in and authorize the app
5. You'll be redirected back with a `request_token`
6. The access token will be saved automatically

**Option B: Manual OAuth**
1. Visit this URL (replace YOUR_API_KEY):
   ```
   https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY&redirect_url=http://localhost:3000/api/oauth/callback
   ```
2. Log in and authorize
3. You'll be redirected to: `http://localhost:3000/api/oauth/callback?request_token=xxx&status=success`
4. Copy the `request_token` from the URL
5. Use it to generate access token via API

### Step 7: Verify Setup
1. Check health endpoint: `http://localhost:3000/api/health`
2. Should show `kite: "healthy"` if configured correctly

## Troubleshooting

### "No API Key found"
- Make sure `kite-config.json` has `apiKey` and `apiSecret` filled
- Or set `KITE_API_KEY` and `KITE_API_SECRET` in `.env.local`

### "Session expired"
- Access tokens expire daily
- Re-authenticate via OAuth flow
- Update `accessToken` in `kite-config.json`

### "Invalid API Key"
- Double-check you copied the API Key correctly
- Ensure there are no extra spaces
- Make sure you're using the right API Key (not API Secret)

### Cost Concerns
- **₹2000/month** is required for Kite Connect API
- This is Zerodha's pricing, not ours
- Free alternatives don't exist for Zerodha's official API

## Alternative: Use Zerodha's MCP Server
If you already have Kite credentials set up elsewhere, you might be able to use them via the MCP server integration.

## Need Help?
- Kite Connect Docs: https://kite.trade/docs/connect/v3/
- Zerodha Support: https://support.zerodha.com/

