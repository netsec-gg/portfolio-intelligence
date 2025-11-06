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
  res: NextApiResponse<{ instruments: any[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, query } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const auth = getKiteAuth(token as string);

    // Fetch instruments for NSE equity
    const response = await axios.get(
      `${KITE_API_BASE}/instruments`,
      {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${auth.apiKey}:${auth.accessToken}`,
        },
      }
    );

    let instruments = response.data;
    
    // Filter by query if provided
    if (query) {
      const queryLower = (query as string).toLowerCase();
      instruments = instruments.filter((inst: any) => 
        inst.tradingsymbol?.toLowerCase().includes(queryLower) ||
        inst.name?.toLowerCase().includes(queryLower)
      );
    }

    // Filter only equity instruments from NSE
    instruments = instruments.filter((inst: any) => 
      inst.exchange === 'NSE' && inst.instrument_type === 'EQ'
    );

    // Limit to top 20 results
    instruments = instruments.slice(0, 20).map((inst: any) => ({
      symbol: inst.tradingsymbol,
      name: inst.name,
      exchange: inst.exchange,
      instrumentToken: inst.instrument_token,
    }));

    res.status(200).json({ instruments });
  } catch (error: any) {
    logger.error('Search instruments error:', error);
    res.status(500).json({ error: error.message || 'Failed to search instruments' });
  }
}

