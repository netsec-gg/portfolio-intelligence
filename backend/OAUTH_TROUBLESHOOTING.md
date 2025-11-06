# OAuth Troubleshooting Guide

## Common Error: "Request failed with status code 400"

This error usually means one of these issues:

### 1. Redirect URL Mismatch ⚠️ (Most Common)

**Problem**: The redirect URL in your Zerodha app settings doesn't match exactly.

**Solution**:
1. Go to [Kite Connect Developer Portal](https://developers.kite.trade/)
2. Click on your app
3. Check the **Redirect URL** field
4. It must be exactly: `http://localhost:3000/api/oauth/callback`
   - No trailing slash
   - No query parameters
   - Must match exactly

5. Update if needed and save

### 2. Incorrect API Keys

**Check**:
- API Key in `kite-config.json` matches Zerodha dashboard
- API Secret matches Zerodha dashboard
- No extra spaces or characters

### 3. Checksum Calculation

The checksum is calculated as: `SHA256(api_key + request_token + api_secret)`

This should work automatically, but if you're still getting errors:
- Ensure request_token is used as-is (no modifications)
- API keys are correct

### 4. Request Token Expired

Request tokens expire quickly. If you wait too long between authorization and callback:
- Start the OAuth flow again
- Complete it quickly

## Debug Steps

1. **Check server logs** - Look for detailed error messages
2. **Verify redirect URL** - Must match exactly in Zerodha settings
3. **Check API keys** - Ensure they're correct in `kite-config.json`
4. **Try fresh OAuth flow** - Clear browser cache and try again

## Manual Token Setup (Alternative)

If OAuth keeps failing, you can manually get the token:

1. Visit: `https://kite.zerodha.com/connect/login?v=3&api_key=f284nayjeebjjha0&redirect_url=http://localhost:3000/api/oauth/callback`
2. Login and authorize
3. Copy the `request_token` from the redirect URL
4. Use it in a script or API call to exchange for access_token

## Test Redirect URL

Make sure your redirect URL is accessible:
- Visit: `http://localhost:3000/api/oauth/callback`
- Should not return 404

## Still Having Issues?

Check the detailed error message in the browser - it will show:
- Error type
- Error message
- What went wrong

The updated callback handler now shows more detailed error messages to help debug.

