# 🔐 Authentication Required

Your access token has expired. Please re-authenticate to continue trading.

## Quick Fix

**Visit this URL to authenticate:**
```
http://localhost:3000/api/oauth/authorize
```

Or click this link: [Authenticate Now](http://localhost:3000/api/oauth/authorize)

## Steps:

1. Click the link above or visit `http://localhost:3000/api/oauth/authorize`
2. You'll be redirected to Zerodha login page
3. Log in with your Zerodha credentials
4. Authorize the app
5. You'll be redirected back to the dashboard
6. Your token will be automatically updated

## After Authentication

- ✅ Trading will work
- ✅ Portfolio data will update in real-time
- ✅ All API calls will succeed

**Note:** Access tokens expire after some time. If you see "Incorrect api_key or access_token" errors, just re-authenticate using the steps above.

