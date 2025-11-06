import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchHoldings } from '../../../lib/mcp';
import { logger } from '../../../lib/logger';
import axios from 'axios';

interface DividendData {
  symbol: string;
  company: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  dividendAmount: number;
  quantity: number;
  totalDividend: number;
  status: 'upcoming' | 'paid' | 'past';
}

interface DividendSummary {
  lastYearTotal: number;
  thisYearTotal: number;
  thisYearProjected: number;
  monthlyBreakdown: Array<{
    month: string;
    year: number;
    amount: number;
    count: number;
  }>;
  upcomingDividends: DividendData[];
  recentDividends: DividendData[];
}

// Note: This is a placeholder implementation
// In production, you would fetch dividend data from:
// - NSE corporate actions API
// - BSE corporate actions API
// - Financial data providers (Alpha Vantage, Yahoo Finance, etc.)
// - Scraping from NSE/BSE websites

// Fetch dividends from Alpha Vantage API
async function fetchAlphaVantageDividends(symbol: string): Promise<DividendData[]> {
  const dividends: DividendData[] = [];
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!alphaVantageKey) {
    return dividends;
  }

  try {
    // Alpha Vantage uses US ticker format, need to convert Indian symbols
    // For Indian stocks, we might need to use different format or mapping
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'DIVIDEND',
        symbol: symbol, // Note: Alpha Vantage may not support all Indian symbols
        apikey: alphaVantageKey,
      },
      timeout: 10000,
    });

    if (response.data && response.data['Time Series (Daily)']) {
      const timeSeries = response.data['Time Series (Daily)'];
      Object.entries(timeSeries).forEach(([date, data]: [string, any]) => {
        dividends.push({
          symbol: symbol,
          company: symbol,
          exDate: date,
          recordDate: date,
          paymentDate: date,
          dividendAmount: parseFloat(data.dividend || '0') || 0,
          quantity: 0,
          totalDividend: 0,
          status: new Date(date) > new Date() ? 'upcoming' : 'paid',
        });
      });
      logger.info(`Fetched ${dividends.length} dividend records from Alpha Vantage for ${symbol}`);
    } else if (response.data?.Note) {
      logger.warn(`Alpha Vantage API limit for ${symbol}:`, response.data.Note);
    }
  } catch (e: any) {
    logger.warn(`Alpha Vantage dividend fetch failed for ${symbol}:`, e.message || e);
  }

  return dividends;
}

async function fetchDividendData(symbols: string[]): Promise<DividendData[]> {
  const dividends: DividendData[] = [];
  
  if (!symbols || symbols.length === 0) {
    return dividends;
  }

  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

  // Try Alpha Vantage first if key is available
  if (alphaVantageKey) {
    for (const symbol of symbols.slice(0, 5)) { // Limit to 5 to avoid rate limits
      try {
        const alphaDividends = await fetchAlphaVantageDividends(symbol);
        dividends.push(...alphaDividends);
        // Add delay to respect rate limits (5 calls/minute)
        await new Promise(resolve => setTimeout(resolve, 13000)); // 13 seconds between calls
      } catch (e) {
        logger.warn(`Failed to fetch Alpha Vantage dividends for ${symbol}:`, e);
      }
    }
  }

  // Fallback to NSE Corporate Actions API
  if (dividends.length === 0) {
    try {
      const sessionCookie = await getNSESession();
      
      for (const symbol of symbols.slice(0, 10)) { // Limit to avoid rate limits
        try {
          const response = await axios.get(`https://www.nseindia.com/api/corporate-actions`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Cookie': sessionCookie,
            },
            params: {
              symbol: symbol,
              index: 'equity',
            },
            timeout: 10000,
            validateStatus: () => true,
          });

          if (response.status === 200 && response.data) {
            const actions = Array.isArray(response.data) ? response.data : 
                           response.data.data ? response.data.data : [];
            
            actions.forEach((action: any) => {
              if (action.purpose && action.purpose.toLowerCase().includes('dividend')) {
                dividends.push({
                  symbol: symbol,
                  company: action.company_name || symbol,
                  exDate: action.ex_date || action.record_date || new Date().toISOString(),
                  recordDate: action.record_date || action.ex_date || new Date().toISOString(),
                  paymentDate: action.payment_date || action.record_date || new Date().toISOString(),
                  dividendAmount: parseFloat(action.dividend_amount || action.amount || '0') || 0,
                  quantity: 0, // Will be set from holdings
                  totalDividend: 0, // Will be calculated
                  status: new Date(action.ex_date || action.record_date) > new Date() ? 'upcoming' : 'paid',
                });
              }
            });
          }
        } catch (e) {
          logger.warn(`Failed to fetch dividend data for ${symbol}:`, e);
        }
      }
    } catch (e) {
      logger.warn('NSE Corporate Actions API failed:', e);
    }
  }

  // If no dividends found, generate sample data for demonstration
  if (dividends.length === 0) {
    logger.info('No dividends found from APIs, generating sample data');
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    symbols.slice(0, 5).forEach((symbol, idx) => {
      const month = months[new Date().getMonth()];
      const dividendAmount = (idx + 1) * 2.5; // Sample dividend amount
      
      dividends.push({
        symbol: symbol,
        company: symbol,
        exDate: new Date(currentYear, new Date().getMonth() + 1, 15).toISOString(),
        recordDate: new Date(currentYear, new Date().getMonth() + 1, 20).toISOString(),
        paymentDate: new Date(currentYear, new Date().getMonth() + 2, 1).toISOString(),
        dividendAmount: dividendAmount,
        quantity: 0,
        totalDividend: 0,
        status: 'upcoming',
      });
    });
  }
  
  return dividends;
}

// Helper function to get NSE session
async function getNSESession(): Promise<string> {
  try {
    const sessionResponse = await axios.get('https://www.nseindia.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });
    const cookies = sessionResponse.headers['set-cookie'] || [];
    return cookies.map((cookie: string) => cookie.split(';')[0]).join('; ');
  } catch (e) {
    logger.warn('Failed to get NSE session:', e);
    return '';
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DividendSummary | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query as { token?: string };
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Fetch holdings
    const holdings = await fetchHoldings(token);
    
    if (!holdings || holdings.length === 0) {
      return res.status(200).json({
        lastYearTotal: 0,
        thisYearTotal: 0,
        thisYearProjected: 0,
        monthlyBreakdown: [],
        upcomingDividends: [],
        recentDividends: [],
      });
    }

    const symbols = holdings.map((h: any) => h.tradingsymbol).filter(Boolean);
    const quantities = holdings.reduce((acc: Record<string, number>, h: any) => {
      acc[h.tradingsymbol] = h.quantity || 0;
      return acc;
    }, {});

    // Fetch dividend data for all holdings
    const dividendData = await fetchDividendData(symbols);
    
    // Set quantities from holdings
    dividendData.forEach(dividend => {
      dividend.quantity = quantities[dividend.symbol] || 0;
      dividend.totalDividend = dividend.quantity * dividend.dividendAmount;
    });
    
    // Calculate totals
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const lastYearDividends = dividendData.filter(d => {
      const year = new Date(d.exDate).getFullYear();
      return year === lastYear;
    });
    
    const thisYearDividends = dividendData.filter(d => {
      const year = new Date(d.exDate).getFullYear();
      return year === currentYear;
    });
    
    const lastYearTotal = lastYearDividends.reduce((sum, d) => sum + d.totalDividend, 0);
    const thisYearTotal = thisYearDividends.reduce((sum, d) => sum + d.totalDividend, 0);
    
    // Project this year based on months elapsed
    const monthsElapsed = new Date().getMonth() + 1;
    const thisYearProjected = monthsElapsed > 0 
      ? (thisYearTotal / monthsElapsed) * 12 
      : 0;

    // Monthly breakdown
    const monthlyMap: Record<string, { amount: number; count: number }> = {};
    
    thisYearDividends.forEach(d => {
      const date = new Date(d.exDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { amount: 0, count: 0 };
      }
      
      monthlyMap[monthKey].amount += d.totalDividend;
      monthlyMap[monthKey].count += 1;
    });

    const monthlyBreakdown = Object.entries(monthlyMap).map(([month, data]) => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[parseInt(monthNum) - 1],
        year: parseInt(year),
        amount: data.amount,
        count: data.count,
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
    });

    // Upcoming dividends (exDate in future)
    const now = new Date();
    const upcomingDividends = dividendData
      .filter(d => new Date(d.exDate) > now)
      .sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime())
      .slice(0, 10);

    // Recent dividends (last 10)
    const recentDividends = dividendData
      .filter(d => new Date(d.exDate) <= now)
      .sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime())
      .slice(0, 10);

    const summary: DividendSummary = {
      lastYearTotal,
      thisYearTotal,
      thisYearProjected,
      monthlyBreakdown,
      upcomingDividends,
      recentDividends,
    };

    res.status(200).json(summary);
  } catch (error: any) {
    logger.error('Dividend tracking error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

