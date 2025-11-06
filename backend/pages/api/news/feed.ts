import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { scoreSentiment } from '../../../lib/sentiment';
import { logger } from '../../../lib/logger';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  symbol?: string;
  sentiment?: number;
  sentimentLabel?: 'positive' | 'negative' | 'neutral';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ news: NewsItem[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For personal use - no user authentication needed
    const { symbols, token } = req.query as { symbols?: string; token?: string };
    // Hardcoded News API key for now
    const apiKey = process.env.NEWS_API_KEY || process.env.ALPHA_VANTAGE_API_KEY || '5e4d26bcce5546b58463ab88838a972d';

    if (!apiKey) {
      logger.warn('News API key not configured');
      return res.status(200).json({ news: [] });
    }

    // Get user's holdings to fetch news for
    // If symbols provided, use those; otherwise try to get from portfolio
    let symbolsList: string[] = [];
    
    if (symbols) {
      symbolsList = symbols.split(',');
    } else {
      // Try to get holdings if token provided
      const tokenFromQuery = token || req.query.token as string;
      const tokenFromHeader = req.headers['x-kite-token'] as string;
      const kiteToken = tokenFromQuery || tokenFromHeader;
      
      if (kiteToken) {
        try {
          const { fetchHoldings } = await import('../../../lib/mcp');
          const holdings = await fetchHoldings(kiteToken);
          symbolsList = holdings.map((h: any) => h.tradingsymbol).filter(Boolean);
        } catch (e) {
          logger.warn('Could not fetch holdings for news:', e);
        }
      }
    }

    if (symbolsList.length === 0) {
      // Try to fetch general market news if no specific symbols
      symbolsList = ['NSE', 'BSE', 'Indian Stock Market', 'Sensex', 'Nifty'];
    }

    const allNews: NewsItem[] = [];

    // Fetch news for each symbol
    for (const symbol of symbolsList.slice(0, 10)) {
      try {
        const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: symbol,
            sortBy: 'publishedAt',
            pageSize: 5,
            apiKey,
          },
          timeout: 5000,
        });

        const articles = newsResponse.data?.articles || [];
        const headlines = articles.map((a: any) => a.title);
        
        let sentimentScores: any[] = [];
        if (headlines.length > 0) {
          try {
            sentimentScores = await scoreSentiment(headlines);
          } catch (sentimentErr) {
            logger.warn('Sentiment analysis failed:', sentimentErr);
          }
        }

        articles.forEach((article: any, index: number) => {
          const sentiment = sentimentScores[index]?.score || 0;
          allNews.push({
            id: `${symbol}-${article.publishedAt}-${index}`,
            title: article.title || '',
            description: article.description || '',
            url: article.url || '',
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt || new Date().toISOString(),
            symbol,
            sentiment,
            sentimentLabel: sentiment > 1 ? 'positive' : sentiment < -1 ? 'negative' : 'neutral',
          });
        });
      } catch (err) {
        logger.warn(`Failed to fetch news for ${symbol}:`, err);
      }
    }

    // Sort by published date (newest first)
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.status(200).json({ news: allNews.slice(0, 50) });
  } catch (err) {
    logger.error('News feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
