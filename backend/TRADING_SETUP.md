# What You Need for Trading to Work

## Error: "Incorrect `api_key` or `access_token`"

This error occurs when trying to place orders because the application needs valid Zerodha Kite API credentials.

## Required Setup

### 1. **Zerodha Trading Account**
- You need an active Zerodha trading account
- Sign up at: https://zerodha.com/open-account/

### 2. **Kite Connect Developer Account** (₹2000/month)
1. Go to: https://developers.kite.trade/
2. Sign in with your Zerodha credentials
3. Accept the terms and pay ₹2000/month for API access
4. Create a new app:
   - **App Name**: `Portify` (or any name)
   - **Redirect URL**: `http://localhost:3000/api/oauth/callback`
   - **App Type**: Web app
5. Note down your:
   - **API Key** (e.g., `f284nayjeebjjha0`)
   - **API Secret** (keep this secret!)

### 3. **Configure API Credentials**

**Option A: Using Environment Variables** (Recommended)
Create or update `backend/.env.local`:
```env
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
```

**Option B: Using kite-config.json**
Create `backend/kite-config.json`:
```json
{
  "apiKey": "your_api_key_here",
  "apiSecret": "your_api_secret_here",
  "accessToken": ""
}
```

### 4. **Get Access Token (OAuth Authentication)**

After setting up API Key and Secret, you need to authenticate:

**Step 1: Start the application**
```bash
cd backend
npm run dev
```

**Step 2: Authenticate via OAuth**
1. Visit: `http://localhost:3000/api/oauth/authorize`
   OR manually visit:
   ```
   https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY&redirect_url=http://localhost:3000/api/oauth/callback
   ```
2. Log in with your Zerodha credentials
3. Authorize the app
4. You'll be redirected back to the dashboard
5. The access token will be saved automatically in `kite-config.json`

**Step 3: Verify Authentication**
- Check that `kite-config.json` now contains an `accessToken` field
- Try placing an order again - it should work now!

## Troubleshooting

### "Incorrect `api_key` or `access_token`" Error
- **Check 1**: Verify your API Key is correct in `.env.local` or `kite-config.json`
- **Check 2**: Ensure you've completed OAuth authentication and have a valid `accessToken`
- **Check 3**: Access tokens expire after some time - re-authenticate if needed
- **Check 4**: Make sure your Kite Connect subscription is active (₹2000/month)

### "Missing required fields" Error
- Ensure all order fields are filled: symbol, quantity, transaction type, order type, product, exchange

### Authentication Not Working
- Clear browser cookies and try again
- Check that the redirect URL matches exactly: `http://localhost:3000/api/oauth/callback`
- Verify your API Key and Secret are correct

## Quick Checklist

- [ ] Have Zerodha trading account
- [ ] Have Kite Connect developer account (₹2000/month)
- [ ] Created app with correct redirect URL
- [ ] Added API Key and Secret to `.env.local` or `kite-config.json`
- [ ] Completed OAuth authentication
- [ ] Verified `accessToken` exists in `kite-config.json`
- [ ] Restarted the application after configuration

## Cost Summary

- **Zerodha Trading Account**: Free (but you need to fund it for trading)
- **Kite Connect API Access**: ₹2000/month (~$24/month)
- **Trading**: Standard Zerodha brokerage fees apply

Once all steps are completed, you should be able to place orders successfully!

