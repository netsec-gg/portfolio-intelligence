import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchHoldings, fetchQuotes } from '../../../lib/mcp';
import { logger } from '../../../lib/logger';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PortfolioOverview {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Array<{
    symbol: string;
    exchange: string;
    quantity: number;
    averagePrice: number;
    lastPrice: number;
    currentValue: number;
    investedValue: number;
    pnl: number;
    pnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PortfolioOverview | { error: string; authUrl?: string; details?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For personal use - skip user authentication
    // Get access token from query param, header, or kite-config.json
    const tokenFromQuery = req.query.token as string;
    const tokenFromHeader = req.headers['x-kite-token'] as string;
    
    let kiteToken = tokenFromQuery || tokenFromHeader;
    
    // Try to load from kite-config.json
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
    
    if (!kiteToken) {
      return res.status(400).json({ 
        error: 'Kite access token required. Please authenticate via OAuth or provide token in ?token=xxx or x-kite-token header',
        authUrl: 'https://kite.zerodha.com/connect/login?v=3&api_key=f284nayjeebjjha0&redirect_url=http://localhost:3000/api/oauth/callback'
      });
    }

    let holdings: any[] = [];
    try {
      holdings = await fetchHoldings(kiteToken);
      logger.info(`Fetched ${holdings.length} holdings for portfolio overview`);
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      logger.error('Error fetching holdings:', errorMsg);
      
      // If it's an auth error, return proper error response
      if (errorMsg.includes('Session expired') || errorMsg.includes('invalid token') || errorMsg.includes('api_key') || errorMsg.includes('access_token')) {
        return res.status(401).json({ 
          error: 'Authentication failed. Please re-authenticate.',
          authUrl: 'https://kite.zerodha.com/connect/login?v=3&api_key=f284nayjeebjjha0&redirect_url=http://localhost:3000/api/oauth/callback',
          details: errorMsg
        });
      }
      
      // For other errors, return empty portfolio
      return res.status(200).json({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positions: [],
        error: 'Could not fetch holdings',
        details: errorMsg
      });
    }
    
    if (!holdings || !Array.isArray(holdings)) {
      logger.warn('Holdings is not an array:', holdings);
      return res.status(200).json({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positions: [],
        warning: 'No holdings data available'
      });
    }
    
    if (holdings.length === 0) {
      logger.info('User has no holdings in portfolio');
      return res.status(200).json({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positions: [],
        message: 'No holdings found. Your portfolio is empty.'
      });
    }

    // Fetch fresh quotes for real-time prices
    const instruments = holdings
      .map((h: any) => `${h.exchange || 'NSE'}:${h.tradingsymbol}`)
      .filter(Boolean);
    
    let quotes: any = {};
    if (instruments.length > 0) {
      try {
        quotes = await fetchQuotes(kiteToken, instruments) || {};
      } catch (e) {
        logger.warn('Error fetching fresh quotes, using holdings data:', e);
      }
    }

    let totalValue = 0;
    let totalInvested = 0;
    let totalPnL = 0;
    let dayChange = 0;

    const positions = holdings.map((holding: any) => {
      // Use fresh quote data if available, otherwise fall back to holdings data
      const instrumentKey = `${holding.exchange || 'NSE'}:${holding.tradingsymbol}`;
      const quote = quotes[instrumentKey] || {};
      
      // Prefer fresh quote data for real-time prices
      const lastPrice = quote.last_price || holding.last_price || 0;
      const dayChangePrice = quote.net_change !== undefined ? quote.net_change : (holding.day_change || 0);
      
      const currentValue = lastPrice * (holding.quantity || 0);
      const investedValue = (holding.average_price || 0) * (holding.quantity || 0);
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
      const dayChangeAmount = dayChangePrice * (holding.quantity || 0);
      const dayChangePercent = lastPrice > 0 ? 
        (dayChangePrice / lastPrice) * 100 : 0;

      totalValue += currentValue;
      totalInvested += investedValue;
      totalPnL += pnl;
      dayChange += dayChangeAmount;

      return {
        symbol: holding.tradingsymbol || '',
        exchange: holding.exchange || '',
        quantity: holding.quantity || 0,
        averagePrice: holding.average_price || 0,
        lastPrice,
        currentValue,
        investedValue,
        pnl,
        pnlPercent,
        dayChange: dayChangeAmount,
        dayChangePercent,
      };
    });

    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    const overview: PortfolioOverview = {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      dayChange,
      dayChangePercent,
      positions,
    };

    // Prevent caching for real-time data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Timestamp', Date.now().toString());
    
    res.status(200).json(overview);
  } catch (err) {
    logger.error('Portfolio overview error:', err);
    res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) });
  }
}
