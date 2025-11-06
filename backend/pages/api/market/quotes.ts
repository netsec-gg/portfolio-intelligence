import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/db';
import { logger } from '../../../lib/logger';

export interface MarketQuote {
  symbol: string;
  exchange: string;
  lastPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ quotes: MarketQuote[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For personal use, remove subscription check

    const { symbols } = req.query as { symbols: string };
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    // Fetch quotes from Kite API
    const symbolList = symbols.split(',').map(s => s.trim());
    const instruments = symbolList.map(sym => {
      const [exchange, symbol] = sym.includes(':') ? sym.split(':') : ['NSE', sym];
      return `${exchange}:${symbol}`;
    });

    const { fetchQuotes } = await import('../../../lib/mcp');
    const quotesData = await fetchQuotes(user.kiteToken, instruments);

    const quotes: MarketQuote[] = Object.values(quotesData || {}).map((quote: any) => {
      const quoteData = quote || {};
      return {
        symbol: quoteData.tradingsymbol || '',
        exchange: quoteData.exchange || 'NSE',
        lastPrice: quoteData.last_price || 0,
        open: quoteData.ohlc?.open || 0,
        high: quoteData.ohlc?.high || 0,
        low: quoteData.ohlc?.low || 0,
        close: quoteData.ohlc?.close || 0,
        volume: quoteData.volume || 0,
        change: quoteData.net_change || 0,
        changePercent: quoteData.last_price > 0 ? ((quoteData.net_change || 0) / quoteData.last_price) * 100 : 0,
        timestamp: new Date().toISOString(),
      };
    }).filter(q => q.symbol);

    res.status(200).json({ quotes });
  } catch (err) {
    logger.error('Market quotes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

