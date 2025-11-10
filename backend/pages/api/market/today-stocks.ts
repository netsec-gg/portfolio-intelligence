import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { fetchQuotes } from '../../../lib/mcp';
import { logger } from '../../../lib/logger';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface StockListItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ 
    gainers: StockListItem[];
    losers: StockListItem[];
    mostActive: StockListItem[];
    near52WHigh: StockListItem[];
    near52WLow: StockListItem[];
  } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query as { token?: string };
    const tokenFromHeader = req.headers['x-kite-token'] as string;
    
    // Get token from config if not provided
    let kiteToken = token || tokenFromHeader;
    if (!kiteToken) {
      try {
        const configPath = join(process.cwd(), 'kite-config.json');
        if (existsSync(configPath)) {
          const config = JSON.parse(readFileSync(configPath, 'utf-8'));
          kiteToken = config.accessToken || '';
        }
      } catch (e) {
        // Ignore
      }
    }

    // Fetch top stocks from NSE
    // Note: This uses NSE's public API. In production, you might want to use a data provider
    try {
      // Fetch NIFTY 50 stocks
      const niftyResponse = await axios.get('https://www.nseindia.com/api/equity-stockIndices', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.nseindia.com/',
        },
        params: {
          index: 'NIFTY 50',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      let stocks: StockListItem[] = [];

      if (niftyResponse.status === 200 && niftyResponse.data) {
        const data = niftyResponse.data.data || [];
        stocks = data.map((item: any) => ({
          symbol: item.symbol || '',
          name: item.meta?.companyName || item.symbol || '',
          price: parseFloat(item.lastPrice) || 0,
          change: parseFloat(item.change) || 0,
          changePercent: parseFloat(item.pChange) || 0,
          volume: parseFloat(item.totalTradedVolume) || 0,
          marketCap: parseFloat(item.marketCap) || 0,
        })).filter((s: StockListItem) => s.symbol && s.price > 0);
      }

      // If NSE API fails, use portfolio holdings as fallback
      if (stocks.length === 0 && kiteToken) {
        try {
          const { fetchHoldings } = await import('../../../lib/mcp');
          const holdings = await fetchHoldings(kiteToken);
          
          if (holdings.length > 0) {
            const symbols = holdings.map((h: any) => `${h.exchange || 'NSE'}:${h.tradingsymbol}`).filter(Boolean);
            const quotes = await fetchQuotes(kiteToken, symbols.slice(0, 50));
            
            stocks = Object.values(quotes || {}).map((quote: any) => ({
              symbol: quote.tradingsymbol || '',
              name: quote.company_name || quote.tradingsymbol || '',
              price: quote.last_price || 0,
              change: quote.net_change || 0,
              changePercent: quote.last_price > 0 ? ((quote.net_change || 0) / quote.last_price) * 100 : 0,
              volume: quote.volume || 0,
            })).filter((s: StockListItem) => s.symbol && s.price > 0);
          }
        } catch (e) {
          logger.warn('Fallback stock fetch failed:', e);
        }
      }

      // Sort and categorize
      const gainers = [...stocks]
        .filter(s => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);

      const losers = [...stocks]
        .filter(s => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 10);

      const mostActive = [...stocks]
        .sort((a, b) => (b.volume || 0) - (a.volume || 0))
        .slice(0, 10);

      const near52WHigh = [...stocks]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 10);

      const near52WLow = [...stocks]
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 10);

      // Prevent caching for real-time data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Timestamp', Date.now().toString());

      res.status(200).json({
        gainers,
        losers,
        mostActive,
        near52WHigh,
        near52WLow,
      });
    } catch (err) {
      logger.error('Today stocks error:', err);
      
      // Return empty arrays on error
      res.status(200).json({
        gainers: [],
        losers: [],
        mostActive: [],
        near52WHigh: [],
        near52WLow: [],
      });
    }
  } catch (err) {
    logger.error('Today stocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

