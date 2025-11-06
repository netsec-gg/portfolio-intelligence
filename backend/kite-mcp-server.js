#!/usr/bin/env node

/**
 * Kite MCP Server - Connect to Zerodha Kite API
 * This server provides MCP tools for interacting with Zerodha's trading platform
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const CONFIG_FILE = path.join(__dirname, 'kite-config.json');
let config = {};

if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

class KiteConnect {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiSecret = config.apiSecret || process.env.KITE_API_SECRET;
    this.accessToken = config.accessToken || null;
    this.baseURL = 'https://api.kite.trade';
  }

  async login(userId, password, pin) {
    try {
      // Note: Actual Kite login requires browser-based OAuth flow
      // This is a simplified version for demonstration
      const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${this.apiKey}`;
      
      return {
        success: false,
        message: 'Please visit the following URL to authorize access:',
        authUrl: loginUrl,
        instructions: [
          '1. Open the URL above in your browser',
          '2. Log in with your Zerodha credentials',
          '3. Authorize the app',
          '4. Copy the request_token from the redirect URL',
          '5. Use the setAccessToken tool with the request_token'
        ]
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async generateSession(requestToken) {
    try {
      const checksum = crypto
        .createHash('sha256')
        .update(`${this.apiKey}${requestToken}${this.apiSecret}`)
        .digest('hex');

      const response = await axios.post(`${this.baseURL}/session/token`, {
        api_key: this.apiKey,
        request_token: requestToken,
        checksum: checksum
      });

      this.accessToken = response.data.data.access_token;
      
      // Save access token to config
      config.accessToken = this.accessToken;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

      return {
        success: true,
        accessToken: this.accessToken,
        profile: response.data.data.user_name
      };
    } catch (error) {
      throw new Error(`Session generation failed: ${error.message}`);
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const headers = {
      'X-Kite-Version': '3',
      'Authorization': `token ${this.apiKey}:${this.accessToken}`
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers,
        data
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async getProfile() {
    const response = await this.makeRequest('/user/profile');
    return response.data;
  }

  async getMargins() {
    const response = await this.makeRequest('/user/margins');
    return response.data;
  }

  async getPositions() {
    const response = await this.makeRequest('/portfolio/positions');
    return response.data;
  }

  async getHoldings() {
    const response = await this.makeRequest('/portfolio/holdings');
    return response.data;
  }

  async getOrders() {
    const response = await this.makeRequest('/orders');
    return response.data;
  }

  async placeOrder(params) {
    const orderParams = {
      exchange: params.exchange || 'NSE',
      tradingsymbol: params.symbol,
      transaction_type: params.transactionType || 'BUY',
      quantity: params.quantity,
      product: params.product || 'CNC',
      order_type: params.orderType || 'MARKET',
      price: params.price || 0,
      trigger_price: params.triggerPrice || 0,
      validity: params.validity || 'DAY'
    };

    const response = await this.makeRequest('/orders/regular', 'POST', orderParams);
    return response.data;
  }

  async modifyOrder(orderId, params) {
    const response = await this.makeRequest(`/orders/regular/${orderId}`, 'PUT', params);
    return response.data;
  }

  async cancelOrder(orderId) {
    const response = await this.makeRequest(`/orders/regular/${orderId}`, 'DELETE');
    return response.data;
  }

  async getQuote(instruments) {
    const instrumentList = Array.isArray(instruments) ? instruments : [instruments];
    const params = new URLSearchParams();
    instrumentList.forEach(inst => params.append('i', inst));
    
    const response = await this.makeRequest(`/quote?${params.toString()}`);
    return response.data;
  }

  async getHistoricalData(instrument, from, to, interval) {
    const endpoint = `/instruments/historical/${instrument}/${interval}`;
    const params = `?from=${from}&to=${to}`;
    
    const response = await this.makeRequest(endpoint + params);
    return response.data;
  }
}

// Initialize Kite client
const kite = new KiteConnect(config.apiKey || process.env.KITE_API_KEY || 'your_api_key');

// Create MCP server
const server = new Server(
  {
    name: 'kite-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: 'kite_login',
    description: 'Initiate login to Zerodha Kite',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Zerodha user ID (optional for OAuth flow)' },
        password: { type: 'string', description: 'Zerodha password (optional for OAuth flow)' },
        pin: { type: 'string', description: 'Zerodha PIN (optional for OAuth flow)' }
      }
    }
  },
  {
    name: 'kite_set_access_token',
    description: 'Set access token after OAuth authorization',
    inputSchema: {
      type: 'object',
      properties: {
        requestToken: { type: 'string', description: 'Request token from OAuth callback' }
      },
      required: ['requestToken']
    }
  },
  {
    name: 'kite_get_profile',
    description: 'Get user profile information',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'kite_get_margins',
    description: 'Get account margins',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'kite_get_positions',
    description: 'Get current positions',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'kite_get_holdings',
    description: 'Get holdings (equity portfolio)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'kite_get_orders',
    description: 'Get all orders for the day',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'kite_place_order',
    description: 'Place a new order',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Trading symbol (e.g., RELIANCE)' },
        quantity: { type: 'number', description: 'Quantity to buy/sell' },
        transactionType: { type: 'string', enum: ['BUY', 'SELL'], description: 'Buy or sell' },
        orderType: { type: 'string', enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'], description: 'Order type' },
        price: { type: 'number', description: 'Price for limit orders' },
        triggerPrice: { type: 'number', description: 'Trigger price for SL orders' },
        product: { type: 'string', enum: ['CNC', 'MIS', 'NRML'], description: 'Product type' },
        exchange: { type: 'string', enum: ['NSE', 'BSE', 'NFO', 'MCX'], description: 'Exchange' }
      },
      required: ['symbol', 'quantity', 'transactionType']
    }
  },
  {
    name: 'kite_modify_order',
    description: 'Modify an existing order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to modify' },
        quantity: { type: 'number', description: 'New quantity' },
        price: { type: 'number', description: 'New price' },
        triggerPrice: { type: 'number', description: 'New trigger price' },
        orderType: { type: 'string', enum: ['MARKET', 'LIMIT', 'SL', 'SL-M'], description: 'New order type' }
      },
      required: ['orderId']
    }
  },
  {
    name: 'kite_cancel_order',
    description: 'Cancel an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to cancel' }
      },
      required: ['orderId']
    }
  },
  {
    name: 'kite_get_quote',
    description: 'Get real-time quote for instruments',
    inputSchema: {
      type: 'object',
      properties: {
        instruments: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Instruments in format EXCHANGE:SYMBOL (e.g., NSE:RELIANCE)' 
        }
      },
      required: ['instruments']
    }
  },
  {
    name: 'kite_get_historical',
    description: 'Get historical price data',
    inputSchema: {
      type: 'object',
      properties: {
        instrument: { type: 'string', description: 'Instrument token' },
        from: { type: 'string', description: 'From date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'To date (YYYY-MM-DD)' },
        interval: { 
          type: 'string', 
          enum: ['minute', '3minute', '5minute', '10minute', '15minute', '30minute', '60minute', 'day'],
          description: 'Data interval' 
        }
      },
      required: ['instrument', 'from', 'to', 'interval']
    }
  },
  {
    name: 'kite_save_config',
    description: 'Save API configuration',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'Kite API key' },
        apiSecret: { type: 'string', description: 'Kite API secret' }
      },
      required: ['apiKey', 'apiSecret']
    }
  }
];

// Register tools
tools.forEach(tool => {
  server.setRequestHandler({
    method: 'tools/list',
    handler: async () => ({
      tools: tools
    })
  });
});

// Handle tool calls
server.setRequestHandler({
  method: 'tools/call',
  handler: async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'kite_login':
          const loginResult = await kite.login(args.userId, args.password, args.pin);
          return { content: [{ type: 'text', text: JSON.stringify(loginResult, null, 2) }] };

        case 'kite_set_access_token':
          const sessionResult = await kite.generateSession(args.requestToken);
          return { content: [{ type: 'text', text: JSON.stringify(sessionResult, null, 2) }] };

        case 'kite_get_profile':
          const profile = await kite.getProfile();
          return { content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }] };

        case 'kite_get_margins':
          const margins = await kite.getMargins();
          return { content: [{ type: 'text', text: JSON.stringify(margins, null, 2) }] };

        case 'kite_get_positions':
          const positions = await kite.getPositions();
          return { content: [{ type: 'text', text: JSON.stringify(positions, null, 2) }] };

        case 'kite_get_holdings':
          const holdings = await kite.getHoldings();
          return { content: [{ type: 'text', text: JSON.stringify(holdings, null, 2) }] };

        case 'kite_get_orders':
          const orders = await kite.getOrders();
          return { content: [{ type: 'text', text: JSON.stringify(orders, null, 2) }] };

        case 'kite_place_order':
          const orderResult = await kite.placeOrder(args);
          return { content: [{ type: 'text', text: JSON.stringify(orderResult, null, 2) }] };

        case 'kite_modify_order':
          const modifyResult = await kite.modifyOrder(args.orderId, args);
          return { content: [{ type: 'text', text: JSON.stringify(modifyResult, null, 2) }] };

        case 'kite_cancel_order':
          const cancelResult = await kite.cancelOrder(args.orderId);
          return { content: [{ type: 'text', text: JSON.stringify(cancelResult, null, 2) }] };

        case 'kite_get_quote':
          const quotes = await kite.getQuote(args.instruments);
          return { content: [{ type: 'text', text: JSON.stringify(quotes, null, 2) }] };

        case 'kite_get_historical':
          const historical = await kite.getHistoricalData(
            args.instrument,
            args.from,
            args.to,
            args.interval
          );
          return { content: [{ type: 'text', text: JSON.stringify(historical, null, 2) }] };

        case 'kite_save_config':
          config.apiKey = args.apiKey;
          config.apiSecret = args.apiSecret;
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
          return { 
            content: [{ 
              type: 'text', 
              text: 'Configuration saved successfully. Please restart the server to apply changes.' 
            }] 
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kite MCP Server is running...');
}

main().catch(console.error); 