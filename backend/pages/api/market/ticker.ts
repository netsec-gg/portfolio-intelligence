import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { fetchHoldings, fetchQuotes } from '../../../lib/mcp';
import { logger } from '../../../lib/logger';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface TickerItem {
  id: string;
  type: 'price' | 'news' | 'fii' | 'dii' | 'bulk_deal' | 'insider' | 'sentiment';
  symbol?: string;
  title: string;
  value?: string;
  change?: number;
  changePercent?: number;
  timestamp: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ticker: TickerItem[] } | { error: string }>
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

    const tickerItems: TickerItem[] = [];

    // 1. Get portfolio holdings for price updates
    if (kiteToken) {
      try {
        const holdings = await fetchHoldings(kiteToken);
        const symbols = holdings.map((h: any) => `${h.exchange || 'NSE'}:${h.tradingsymbol}`).filter(Boolean);
        
        if (symbols.length > 0) {
          const quotes = await fetchQuotes(kiteToken, symbols.slice(0, 20));
          
          Object.entries(quotes || {}).forEach(([key, quote]: [string, any]) => {
            if (quote && quote.last_price) {
              tickerItems.push({
                id: `price-${quote.tradingsymbol}-${Date.now()}`,
                type: 'price',
                symbol: quote.tradingsymbol,
                title: `${quote.tradingsymbol}`,
                value: `₹${quote.last_price?.toFixed(2)}`,
                change: quote.net_change || 0,
                changePercent: quote.last_price > 0 ? ((quote.net_change || 0) / quote.last_price) * 100 : 0,
                timestamp: new Date().toISOString(),
                metadata: {
                  volume: quote.volume,
                  high: quote.ohlc?.high,
                  low: quote.ohlc?.low,
                }
              });
            }
          });
        }
      } catch (e) {
        logger.warn('Error fetching portfolio prices:', e);
      }

      // 2. Fetch news for holdings
      try {
        const holdings = await fetchHoldings(kiteToken);
        const symbols = holdings.map((h: any) => h.tradingsymbol).filter(Boolean).slice(0, 5);
        
        const newsApiKey = process.env.NEWS_API_KEY || '5e4d26bcce5546b58463ab88838a972d';
        
        for (const symbol of symbols) {
          try {
            const newsRes = await axios.get('https://newsapi.org/v2/everything', {
              params: {
                q: symbol,
                sortBy: 'publishedAt',
                pageSize: 3,
                apiKey: newsApiKey,
              },
              timeout: 3000,
            });

            const articles = newsRes.data?.articles || [];
            articles.slice(0, 2).forEach((article: any) => {
              tickerItems.push({
                id: `news-${symbol}-${article.publishedAt}`,
                type: 'news',
                symbol,
                title: article.title || '',
                value: article.source?.name || 'News',
                timestamp: article.publishedAt || new Date().toISOString(),
                metadata: {
                  url: article.url,
                  description: article.description,
                }
              });
            });
          } catch (e) {
            // Ignore individual news errors
          }
        }
      } catch (e) {
        logger.warn('Error fetching news:', e);
      }
    }

    // 3. Fetch FII/DII data from NSE (scraping approach)
    try {
      // Note: For production, use proper NSE API or data provider
      // This is a placeholder that can be enhanced
      const fiiDiiData = await fetchFIIDIIData();
      tickerItems.push(...fiiDiiData);
    } catch (e) {
      logger.warn('Error fetching FII/DII data:', e);
    }

    // 4. Fetch bulk deals (placeholder - can be enhanced with actual API)
    try {
      const bulkDeals = await fetchBulkDeals();
      tickerItems.push(...bulkDeals);
    } catch (e) {
      logger.warn('Error fetching bulk deals:', e);
    }

    // 5. Fetch market intelligence (FII/DII summary)
    try {
      const intelResponse = await axios.get(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/market/intelligence`, {
        timeout: 5000,
        validateStatus: () => true,
      });
      
      if (intelResponse.status === 200 && intelResponse.data) {
        const intel = intelResponse.data;
        
        // Add market sentiment to ticker
        if (intel.marketSentiment) {
          tickerItems.push({
            id: `sentiment-${Date.now()}`,
            type: 'sentiment',
            title: `Market Sentiment: ${intel.marketSentiment.overall.toUpperCase()}`,
            value: `Score: ${intel.marketSentiment.score}`,
            change: intel.marketSentiment.score,
            timestamp: new Date().toISOString(),
            sentiment: intel.marketSentiment.overall === 'bullish' ? 'positive' : intel.marketSentiment.overall === 'bearish' ? 'negative' : 'neutral',
          });
        }
      }
    } catch (e) {
      logger.warn('Error fetching market intelligence:', e);
    }

    // Sort by timestamp (newest first)
    tickerItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({ ticker: tickerItems.slice(0, 100) });
  } catch (err) {
    logger.error('Ticker feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function fetchFIIDIIData(): Promise<TickerItem[]> {
  const items: TickerItem[] = [];
  
  try {
    // Fetch FII/DII data from NSE
    // Using NSE's public API endpoint
    const response = await axios.get('https://www.nseindia.com/api/fii-dii-data', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data) {
      const latest = response.data.data?.[0] || response.data;
      
      // Process FII data
      if (latest.fii) {
        const netValue = parseFloat(latest.fii.net) || 0;
        const buyValue = parseFloat(latest.fii.buy) || 0;
        const sellValue = parseFloat(latest.fii.sell) || 0;
        
        items.push({
          id: `fii-${Date.now()}`,
          type: 'fii',
          title: 'FII Net Investment',
          value: `₹${Math.abs(netValue / 100).toFixed(2)} Cr`,
          change: netValue,
          changePercent: netValue > 0 ? 100 : -100,
          timestamp: latest.date || new Date().toISOString(),
          sentiment: netValue > 0 ? 'positive' : 'negative',
          metadata: {
            buy: buyValue,
            sell: sellValue,
            net: netValue,
          }
        });
      }

      // Process DII data
      if (latest.dii) {
        const netValue = parseFloat(latest.dii.net) || 0;
        const buyValue = parseFloat(latest.dii.buy) || 0;
        const sellValue = parseFloat(latest.dii.sell) || 0;
        
        items.push({
          id: `dii-${Date.now()}`,
          type: 'dii',
          title: 'DII Net Investment',
          value: `₹${Math.abs(netValue / 100).toFixed(2)} Cr`,
          change: netValue,
          changePercent: netValue > 0 ? 100 : -100,
          timestamp: latest.date || new Date().toISOString(),
          sentiment: netValue > 0 ? 'positive' : 'negative',
          metadata: {
            buy: buyValue,
            sell: sellValue,
            net: netValue,
          }
        });
      }
    }
  } catch (error: any) {
    // If NSE API fails, try alternative approach or return placeholder
    logger.warn('FII/DII fetch failed, trying alternative:', error.message);
    
    // Try alternative: Use market sentiment API or placeholder
    items.push({
      id: `fii-placeholder-${Date.now()}`,
      type: 'fii',
      title: 'FII Activity',
      value: 'Loading...',
      timestamp: new Date().toISOString(),
      sentiment: 'neutral',
    });
  }

  return items;
}

async function fetchBulkDeals(): Promise<TickerItem[]> {
  const items: TickerItem[] = [];
  
  try {
    // Fetch bulk deals from NSE
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(`https://www.nseindia.com/api/equity-bulk-deals`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.nseindia.com/',
      },
      params: {
        index: 'equity',
        date: today,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data) {
      const deals = response.data.data || [];
      deals.slice(0, 10).forEach((deal: any) => {
        const quantity = parseFloat(deal.quantity) || 0;
        const price = parseFloat(deal.price) || 0;
        const transactionType = deal.transaction_type || '';
        
        items.push({
          id: `bulk-${deal.symbol}-${deal.client_name}-${Date.now()}`,
          type: 'bulk_deal',
          symbol: deal.symbol,
          title: `${deal.client_name || 'Unknown'}`,
          value: `${transactionType.includes('BUY') ? 'BUY' : 'SELL'} ${(quantity / 100000).toFixed(2)}L shares @ ₹${price.toFixed(2)}`,
          change: transactionType.includes('BUY') ? quantity : -quantity,
          timestamp: deal.date || new Date().toISOString(),
          sentiment: transactionType.includes('BUY') ? 'positive' : 'negative',
          metadata: {
            price,
            quantity,
            clientName: deal.client_name,
            transactionType,
          }
        });
      });
    }
  } catch (error: any) {
    // Placeholder if scraping fails
    logger.warn('Bulk deals fetch failed:', error.message);
  }

  return items;
}

