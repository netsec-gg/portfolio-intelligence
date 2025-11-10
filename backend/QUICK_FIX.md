# 🔧 Quick Fix: Portfolio Showing Zeros

## Problem
Your portfolio is showing ₹0 because your **access token has expired**.

## Solution (2 minutes)

### Step 1: Re-authenticate
Visit this URL in your browser:
```
http://localhost:3000/api/oauth/authorize
```

### Step 2: Login
1. You'll be redirected to Zerodha login page
2. Enter your Zerodha credentials
3. Click "Authorize" or "Allow"

### Step 3: Done!
You'll be redirected back to the dashboard and your portfolio will load automatically.

## Why This Happens
- Zerodha access tokens expire after some time for security
- Your token was last updated on Nov 6, 2025
- When expired, the API returns "Session expired" error
- The app shows ₹0 because it can't fetch your holdings

## After Re-authentication
✅ Portfolio will show real-time data
✅ Stock prices will update every second
✅ All features will work normally

**Note:** You may need to re-authenticate periodically (usually every few days or weeks, depending on Zerodha's token expiry policy).

