import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchHoldings } from '../../../lib/mcp';
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

    const holdings = await fetchHoldings(kiteToken);
    
    if (!holdings || !Array.isArray(holdings)) {
      return res.status(200).json({
        totalValue: 0,
        totalInvested: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positions: [],
      });
    }

    let totalValue = 0;
    let totalInvested = 0;
    let totalPnL = 0;
    let dayChange = 0;

    const positions = holdings.map((holding: any) => {
      const currentValue = (holding.last_price || 0) * (holding.quantity || 0);
      const investedValue = (holding.average_price || 0) * (holding.quantity || 0);
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
      const dayChangeAmount = (holding.day_change || 0) * (holding.quantity || 0);
      const dayChangePercent = holding.last_price > 0 ? 
        ((holding.day_change || 0) / holding.last_price) * 100 : 0;

      totalValue += currentValue;
      totalInvested += investedValue;
      totalPnL += pnl;
      dayChange += dayChangeAmount;

      return {
        symbol: holding.tradingsymbol || '',
        exchange: holding.exchange || '',
        quantity: holding.quantity || 0,
        averagePrice: holding.average_price || 0,
        lastPrice: holding.last_price || 0,
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

    res.status(200).json(overview);
  } catch (err) {
    logger.error('Portfolio overview error:', err);
    res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) });
  }
}
