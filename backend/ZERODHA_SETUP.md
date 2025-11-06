# Zerodha Kite Connection Setup Guide

This guide will help you connect your Zerodha account to Portify using the Kite Connect API.

## Prerequisites

1. **Zerodha Trading Account**: You need an active Zerodha trading account
2. **Kite Connect Developer Account**: Required for API access

## Step 1: Get Kite Connect API Credentials

1. Go to [Kite Connect](https://developers.kite.trade/)
2. Sign up for a developer account (costs ₹2000/month)
3. Create a new app:
   - App Name: `Portify Trading Assistant`
   - Redirect URL: `http://localhost:3000/api/oauth/callback`
4. Note down your:
   - **API Key**
   - **API Secret**

## Step 2: Configure API Credentials

Edit the `kite-config.json` file:

```json
{
  "apiKey": "your_api_key_here",
  "apiSecret": "your_api_secret_here"
}
```

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

## Step 4: Start the Kite MCP Server

```bash
npm run kite-mcp
```

## Step 5: Connect to Zerodha

### Option A: Browser-based OAuth (Recommended)

1. The system will provide you with an authorization URL
2. Open the URL in your browser
3. Log in with your Zerodha credentials
4. Authorize the app
5. Copy the `request_token` from the redirect URL
6. Use the token to complete authentication

### Option B: Direct API Connection

If you have an existing access token:

1. Add it to `kite-config.json`:
```json
{
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret",
  "accessToken": "your_access_token"
}
```

## Available Features

Once connected, you can:

### Portfolio Management
- **Get Holdings**: View your equity portfolio
- **Get Positions**: See current open positions
- **Get Orders**: Check today's orders
- **Get Margins**: View available margins

### Trading Operations
- **Place Orders**: Execute buy/sell orders
  - Market orders
  - Limit orders
  - Stop-loss orders
- **Modify Orders**: Change existing orders
- **Cancel Orders**: Cancel pending orders

### Market Data
- **Get Quotes**: Real-time price data
- **Historical Data**: Past price charts
- **Market Depth**: Bid/ask information

## Usage Examples

### Check Your Portfolio
```javascript
// Get your holdings
kite_get_holdings()

// Get current positions
kite_get_positions()

// Check account margins
kite_get_margins()
```

### Place a Trade
```javascript
// Buy 10 shares of Reliance at market price
kite_place_order({
  symbol: "RELIANCE",
  quantity: 10,
  transactionType: "BUY",
  orderType: "MARKET",
  product: "CNC",  // For delivery
  exchange: "NSE"
})

// Place a limit order
kite_place_order({
  symbol: "INFY",
  quantity: 5,
  transactionType: "BUY",
  orderType: "LIMIT",
  price: 1500,
  product: "CNC",
  exchange: "NSE"
})
```

### Get Market Data
```javascript
// Get real-time quotes
kite_get_quote({
  instruments: ["NSE:RELIANCE", "NSE:TCS", "NSE:INFY"]
})

// Get historical data
kite_get_historical({
  instrument: "256265",  // Instrument token for NIFTY
  from: "2024-01-01",
  to: "2024-01-31",
  interval: "day"
})
```

## Security Best Practices

1. **Never share your API credentials**
2. **Store credentials securely** (use environment variables in production)
3. **Implement rate limiting** to avoid API quota issues
4. **Use read-only access** when possible
5. **Monitor API usage** regularly

## Troubleshooting

### Common Issues

1. **"Not authenticated" error**
   - Solution: Run the login process again
   - Check if access token is expired

2. **"Session expired" error**
   - Access tokens expire daily at 7:30 AM
   - Re-authenticate each trading day

3. **"Invalid API key" error**
   - Verify API key in kite-config.json
   - Ensure developer account is active

4. **Connection refused**
   - Check if MCP server is running
   - Verify network connectivity

### Debug Mode

To enable detailed logging:

```bash
DEBUG=* npm run kite-mcp
```

## API Rate Limits

Kite Connect has the following rate limits:
- **Order placement**: 10 requests per second
- **Historical data**: 3 requests per second
- **Other endpoints**: 10 requests per second

## Support

- **Kite Connect Documentation**: https://kite.trade/docs/connect/v3/
- **API Forum**: https://kite.trade/forum/
- **Support Email**: support@zerodha.com

## Next Steps

1. Complete the authentication process
2. Test with small trades first
3. Implement proper error handling
4. Set up automated trading strategies
5. Monitor performance regularly

---

**Important**: This integration is for educational and personal use. Always verify orders before execution and implement proper risk management. 