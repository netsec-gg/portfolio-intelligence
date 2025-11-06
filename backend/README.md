# Portify - Stock Portfolio Dashboard

A modern, real-time stock portfolio management dashboard with technical analysis, news feed, and buy/sell recommendations.

## Features

- **Real-time Portfolio Overview**: Track your total portfolio value, P&L, and day changes
- **Stock Holdings List**: Detailed view of all your positions with real-time prices
- **Technical Analysis**: RSI, MACD, Moving Averages, and Bollinger Bands indicators
- **Buy/Sell Recommendations**: AI-powered signals based on technical indicators
- **News Feed**: Real-time news ticker with sentiment analysis for your holdings
- **Always-On Dashboard**: Designed to run continuously on a dedicated screen

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Zerodha Kite API credentials

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/portify"
   KITE_API_KEY="your_kite_api_key"
   KITE_API_SECRET="your_kite_api_secret"
   NEWS_API_KEY="your_news_api_key"  # Optional: from newsapi.org
   OPENAI_API_KEY="your_openai_key"  # Optional: for sentiment analysis
   ```

3. **Set up database**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Configure Kite API**:
   
   Create `kite-config.json`:
   ```json
   {
     "apiKey": "your_api_key",
     "apiSecret": "your_api_secret",
     "accessToken": "your_access_token"
   }
   ```
   
   Or get your access token via OAuth:
   - Visit: `https://kite.zerodha.com/connect/login?v=3&api_key=YOUR_API_KEY`
   - Complete OAuth flow
   - Use the request_token to generate access_token

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Access the dashboard**:
   Open [http://localhost:3000](http://localhost:3000)

## Usage

### Dashboard Overview

The dashboard shows:
- **Portfolio Summary Cards**: Total value, P&L, day change, and position count
- **Stock Holdings Table**: All your positions with:
  - Symbol and exchange
  - Quantity and current price
  - Current value and invested value
  - P&L (absolute and percentage)
  - Day change percentage
  - Buy/Sell/Hold recommendations
  
- **News Feed**: Real-time news articles about your holdings with sentiment indicators

### API Endpoints

- `GET /api/portfolio/overview` - Get portfolio overview
- `GET /api/market/quotes?symbols=SYMBOL1,SYMBOL2` - Get market quotes
- `GET /api/news/feed` - Get news feed for holdings
- `GET /api/analysis/technical?symbols=SYMBOL1` - Get technical analysis

### Authentication

Currently, the dashboard uses a simple user ID header. For production, implement proper authentication:

```typescript
// In pages/index.tsx, replace:
const userId = 'demo-user-id';

// With actual auth:
const { data: session } = useSession();
const userId = session?.user?.id;
```

## Project Structure

```
backend/
├── pages/
│   ├── index.tsx              # Main dashboard page
│   └── api/
│       ├── portfolio/         # Portfolio endpoints
│       ├── market/            # Market data endpoints
│       ├── news/              # News feed endpoints
│       └── analysis/           # Analysis endpoints
├── lib/
│   ├── mcp.ts                 # Kite API integration
│   ├── db.ts                  # Database connection
│   └── sentiment.ts           # Sentiment analysis
├── prisma/
│   └── schema.prisma          # Database schema
└── styles/
    └── globals.css            # Global styles
```

## Configuration

### Auto-refresh Interval

The dashboard auto-refreshes every 30 seconds. To change:

```typescript
// In pages/index.tsx
const interval = setInterval(fetchData, 30000); // Change 30000 to desired milliseconds
```

### News Sources

Supported news APIs:
- NewsAPI.org (default)
- Alpha Vantage (fallback)

Set `NEWS_API_KEY` or `ALPHA_VANTAGE_API_KEY` in your `.env.local`.

## Technical Indicators

The dashboard calculates:
- **RSI (Relative Strength Index)**: Overbought/oversold conditions
- **MACD**: Trend momentum
- **Moving Averages**: SMA 20, 50, 200
- **Bollinger Bands**: Volatility bands

Recommendations:
- **BUY**: RSI < 30, MACD positive, price above SMA20
- **SELL**: RSI > 70, MACD negative, price below SMA20
- **HOLD**: Neutral conditions

## Troubleshooting

### Kite API Errors

- **Session expired**: Re-authenticate via OAuth flow
- **Invalid token**: Check `kite-config.json` or environment variables
- **Rate limit**: Kite API has rate limits - reduce refresh frequency

### News Feed Not Loading

- Check `NEWS_API_KEY` is set
- Verify API key is valid
- Check API rate limits

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run migrations: `npm run prisma:migrate`

## Production Deployment

For production:

1. Set up proper authentication (NextAuth.js recommended)
2. Enable HTTPS
3. Set up error monitoring (Sentry, etc.)
4. Configure CORS properly
5. Use environment-specific configs
6. Set up proper logging

## License

MIT
