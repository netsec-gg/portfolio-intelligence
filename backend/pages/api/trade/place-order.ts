import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { logger } from '../../../lib/logger';

const KITE_API_BASE = 'https://api.kite.trade';
const HARDCODED_API_KEY = 'f284nayjeebjjha0';

function getKiteAuth(token: string) {
  if (token.includes(':')) {
    const [apiKey, accessToken] = token.split(':');
    return { apiKey, accessToken };
  }
  return {
    apiKey: HARDCODED_API_KEY,
    accessToken: token,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ orderId: string; message: string } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, symbol, exchange, quantity, transactionType, orderType, product, price } = req.body;

    if (!token || !symbol || !quantity || !transactionType || !orderType || !product || !exchange) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auth = getKiteAuth(token);
    
    const orderParams: any = {
      exchange: exchange || 'NSE',
      tradingsymbol: symbol,
      transaction_type: transactionType, // BUY or SELL
      quantity: parseInt(quantity),
      product: product || 'CNC', // CNC, MIS, NRML
      order_type: orderType, // MARKET, LIMIT, SL, SL-M
      validity: 'DAY',
    };

    // Add price for LIMIT orders
    if (orderType === 'LIMIT' && price) {
      orderParams.price = parseFloat(price);
    }

    // Add trigger price for SL orders
    if ((orderType === 'SL' || orderType === 'SL-M') && price) {
      orderParams.trigger_price = parseFloat(price);
      if (orderType === 'SL') {
        orderParams.price = parseFloat(price);
      }
    }

    // Convert to URL-encoded form data (Kite API expects form-urlencoded)
    const formData = new URLSearchParams();
    Object.entries(orderParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await axios.post(
      `${KITE_API_BASE}/orders/regular`,
      formData.toString(),
      {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${auth.apiKey}:${auth.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data.status === 'success') {
      const orderId = response.data.data?.order_id || 'Unknown';
      res.status(200).json({
        orderId,
        message: `Order placed successfully: ${transactionType} ${quantity} ${symbol} @ ${orderType}`,
      });
    } else {
      res.status(400).json({ error: response.data.message || 'Failed to place order' });
    }
  } catch (error: any) {
    logger.error('Place order error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
    res.status(500).json({ error: errorMessage });
  }
}

