# Portify API Documentation

## Overview

The Portify API provides comprehensive portfolio management and trading automation capabilities. This RESTful API is built with Next.js and TypeScript, offering secure, scalable endpoints for managing investments, executing trades, and integrating with various messaging platforms.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## Rate Limiting

- **Development**: 1000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Logout User
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### Portfolio Management

#### Get Portfolio Overview
```http
GET /api/portfolio
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 150000.50,
    "totalInvestment": 120000.00,
    "totalGainLoss": 30000.50,
    "totalGainLossPercentage": 25.00,
    "holdings": [
      {
        "symbol": "RELIANCE",
        "quantity": 100,
        "averagePrice": 2500.00,
        "currentPrice": 2650.00,
        "marketValue": 265000.00,
        "gainLoss": 15000.00,
        "gainLossPercentage": 6.00
      }
    ]
  }
}
```

#### Get Holdings
```http
GET /api/portfolio/holdings
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (symbol, quantity, value)
- `sortOrder` (optional): asc or desc

#### Get Performance Metrics
```http
GET /api/portfolio/performance
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): 1d, 1w, 1m, 3m, 6m, 1y, all

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "1m",
    "returns": {
      "absolute": 5000.00,
      "percentage": 4.17
    },
    "volatility": 15.2,
    "sharpeRatio": 1.25,
    "maxDrawdown": -8.5,
    "chartData": [
      {
        "date": "2024-01-01",
        "value": 120000.00
      }
    ]
  }
}
```

### Trading Operations

#### Place Order
```http
POST /api/trading/orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "transactionType": "BUY",
  "orderType": "LIMIT",
  "quantity": 10,
  "price": 2600.00,
  "product": "CNC",
  "validity": "DAY"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order-123",
    "status": "PENDING",
    "message": "Order placed successfully"
  }
}
```

#### Get Orders
```http
GET /api/trading/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): PENDING, COMPLETE, CANCELLED, REJECTED
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

#### Modify Order
```http
PUT /api/trading/orders/:orderId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 15,
  "price": 2550.00
}
```

#### Cancel Order
```http
DELETE /api/trading/orders/:orderId
Authorization: Bearer <token>
```

#### Get Positions
```http
GET /api/trading/positions
Authorization: Bearer <token>
```

### Market Data

#### Get Quotes
```http
GET /api/market/quotes
Authorization: Bearer <token>
```

**Query Parameters:**
- `symbols`: Comma-separated list of symbols (e.g., NSE:RELIANCE,NSE:TCS)

**Response:**
```json
{
  "success": true,
  "data": {
    "NSE:RELIANCE": {
      "symbol": "RELIANCE",
      "lastPrice": 2650.00,
      "change": 25.50,
      "changePercent": 0.97,
      "volume": 1234567,
      "high": 2675.00,
      "low": 2620.00,
      "open": 2625.00
    }
  }
}
```

#### Get Historical Data
```http
GET /api/market/historical/:symbol
Authorization: Bearer <token>
```

**Query Parameters:**
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `interval`: minute, 5minute, 15minute, 30minute, 60minute, day

### Webhooks

#### Slack Webhook
```http
POST /api/webhooks/slack
Content-Type: application/json
X-Slack-Signature: <signature>
X-Slack-Request-Timestamp: <timestamp>
```

#### Telegram Webhook
```http
POST /api/webhooks/telegram
Content-Type: application/json
```

#### WhatsApp Webhook
```http
POST /api/webhooks/whatsapp
Content-Type: application/json
```

**Webhook Verification:**
```http
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=<challenge>&hub.verify_token=<token>
```

### AI Integration

#### Get AI Insights
```http
POST /api/ai/insights
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "query": "What should I do with my RELIANCE holdings?",
  "context": {
    "portfolio": true,
    "marketData": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your portfolio analysis...",
    "confidence": 0.85,
    "recommendations": [
      {
        "action": "HOLD",
        "symbol": "RELIANCE",
        "reasoning": "Strong fundamentals and positive outlook"
      }
    ]
  }
}
```

### Health Check

#### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 86400,
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "openai": "healthy",
      "kite": "healthy"
    },
    "memory": {
      "used": 128.5,
      "total": 512.0,
      "percentage": 25.1
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |
| `EXTERNAL_API_ERROR` | External service error |
| `INSUFFICIENT_FUNDS` | Insufficient account balance |
| `INVALID_ORDER` | Order validation failed |
| `MARKET_CLOSED` | Market is closed |

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @portify/api-client
```

```javascript
import { PortifyClient } from '@portify/api-client';

const client = new PortifyClient({
  baseUrl: 'https://api.portify.com',
  apiKey: 'your-api-key'
});

const portfolio = await client.portfolio.getOverview();
```

### Python
```bash
pip install portify-python
```

```python
from portify import PortifyClient

client = PortifyClient(
    base_url='https://api.portify.com',
    api_key='your-api-key'
)

portfolio = client.portfolio.get_overview()
```

## Webhooks

### Slack Integration

Configure your Slack app to send events to:
```
POST https://your-domain.com/api/webhooks/slack
```

**Supported Events:**
- `app_mention`: When bot is mentioned
- `message.channels`: Channel messages
- `message.im`: Direct messages

### Telegram Integration

Set webhook URL:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/webhooks/telegram"}'
```

### WhatsApp Integration

Configure webhook in Meta Developer Console:
- **Webhook URL**: `https://your-domain.com/api/webhooks/whatsapp`
- **Verify Token**: Your verification token
- **Subscribed Fields**: `messages`, `message_deliveries`

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Get portfolio
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer <token>"

# Place order
curl -X POST http://localhost:3000/api/trading/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "transactionType": "BUY",
    "quantity": 10,
    "orderType": "MARKET",
    "product": "CNC"
  }'
```

### Postman Collection

Import the Postman collection from `/docs/postman/Portify-API.json` for easy testing.

## Support

- **Documentation**: [https://docs.portify.com](https://docs.portify.com)
- **API Status**: [https://status.portify.com](https://status.portify.com)
- **Support Email**: support@portify.com
- **GitHub Issues**: [https://github.com/portify/issues](https://github.com/portify/issues) 