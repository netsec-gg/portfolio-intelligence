import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { logger } from '../../../lib/logger';
import { fetchHoldings } from '../../../lib/mcp';
import { scoreSentiment } from '../../../lib/sentiment';
import RSSParser from 'rss-parser';

const parser = new RSSParser();

export interface NewsEvent {
  id: string;
  type: 'news' | 'macro' | 'earnings' | 'corp_action' | 'dividend';
  symbol?: string;
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, any>;
}

// Fetch from Moneycontrol RSS
async function fetchMoneycontrolNews(): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  try {
    const feed = await parser.parseURL('https://www.moneycontrol.com/rss/business.xml');
    feed.items?.forEach((item, index) => {
      if (item.title && item.title.trim()) {
        // Parse date properly
        let publishedDate = new Date().toISOString();
        if (item.pubDate) {
          try {
            publishedDate = new Date(item.pubDate).toISOString();
          } catch (e) {
            // Use current date if parsing fails
          }
        }
        
        events.push({
          id: `moneycontrol-${item.pubDate || Date.now()}-${index}`,
          type: 'news',
          title: item.title.trim(),
          description: (item.contentSnippet || item.content || item.title || '').trim().substring(0, 500),
          publishedAt: publishedDate,
          source: 'Moneycontrol',
          metadata: {
            url: item.link,
          },
        });
      }
    });
    logger.info(`Fetched ${events.length} items from Moneycontrol RSS`);
  } catch (e: any) {
    logger.warn('Moneycontrol RSS fetch failed:', e.message || e);
  }
  return events;
}

// Fetch from Economic Times RSS
async function fetchEconomicTimesNews(): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  try {
    const feed = await parser.parseURL('https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms');
    feed.items?.forEach((item, index) => {
      if (item.title && item.title.trim()) {
        let publishedDate = new Date().toISOString();
        if (item.pubDate) {
          try {
            publishedDate = new Date(item.pubDate).toISOString();
          } catch (e) {
            // Use current date if parsing fails
          }
        }
        
        events.push({
          id: `et-${item.pubDate || Date.now()}-${index}`,
          type: 'news',
          title: item.title.trim(),
          description: (item.contentSnippet || item.content || item.title || '').trim().substring(0, 500),
          publishedAt: publishedDate,
          source: 'Economic Times',
          metadata: {
            url: item.link,
          },
        });
      }
    });
    logger.info(`Fetched ${events.length} items from Economic Times RSS`);
  } catch (e: any) {
    logger.warn('Economic Times RSS fetch failed:', e.message || e);
  }
  return events;
}

// Fetch from Business Standard RSS
async function fetchBusinessStandardNews(): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  try {
    const feed = await parser.parseURL('https://www.business-standard.com/rss/markets-106.rss');
    feed.items?.forEach((item, index) => {
      if (item.title && item.title.trim()) {
        let publishedDate = new Date().toISOString();
        if (item.pubDate) {
          try {
            publishedDate = new Date(item.pubDate).toISOString();
          } catch (e) {
            // Use current date if parsing fails
          }
        }
        
        events.push({
          id: `bs-${item.pubDate || Date.now()}-${index}`,
          type: 'news',
          title: item.title.trim(),
          description: (item.contentSnippet || item.content || item.title || '').trim().substring(0, 500),
          publishedAt: publishedDate,
          source: 'Business Standard',
          metadata: {
            url: item.link,
          },
        });
      }
    });
    logger.info(`Fetched ${events.length} items from Business Standard RSS`);
  } catch (e: any) {
    logger.warn('Business Standard RSS fetch failed:', e.message || e);
  }
  return events;
}

// Fetch from Livemint RSS
async function fetchLivemintNews(): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  try {
    const feed = await parser.parseURL('https://www.livemint.com/rss/markets');
    feed.items?.forEach((item, index) => {
      if (item.title && item.title.trim()) {
        let publishedDate = new Date().toISOString();
        if (item.pubDate) {
          try {
            publishedDate = new Date(item.pubDate).toISOString();
          } catch (e) {
            // Use current date if parsing fails
          }
        }
        
        events.push({
          id: `livemint-${item.pubDate || Date.now()}-${index}`,
          type: 'news',
          title: item.title.trim(),
          description: (item.contentSnippet || item.content || item.title || '').trim().substring(0, 500),
          publishedAt: publishedDate,
          source: 'Livemint',
          metadata: {
            url: item.link,
          },
        });
      }
    });
    logger.info(`Fetched ${events.length} items from Livemint RSS`);
  } catch (e: any) {
    logger.warn('Livemint RSS fetch failed:', e.message || e);
  }
  return events;
}

// Fetch from NDTV Business RSS
async function fetchNDTVBusinessNews(): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  try {
    const feed = await parser.parseURL('https://feeds.feedburner.com/ndtv/business');
    feed.items?.forEach((item, index) => {
      if (item.title && item.title.trim()) {
        let publishedDate = new Date().toISOString();
        if (item.pubDate) {
          try {
            publishedDate = new Date(item.pubDate).toISOString();
          } catch (e) {
            // Use current date if parsing fails
          }
        }
        
        events.push({
          id: `ndtv-${item.pubDate || Date.now()}-${index}`,
          type: 'news',
          title: item.title.trim(),
          description: (item.contentSnippet || item.content || item.title || '').trim().substring(0, 500),
          publishedAt: publishedDate,
          source: 'NDTV Business',
          metadata: {
            url: item.link,
          },
        });
      }
    });
    logger.info(`Fetched ${events.length} items from NDTV Business RSS`);
  } catch (e: any) {
    logger.warn('NDTV Business RSS fetch failed:', e.message || e);
  }
  return events;
}

// Fetch from Alpha Vantage News API (Better for stock news)
async function fetchAlphaVantageNews(tickers: string[] = []): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'KGV4E7WUZHS7R33U';
  
  if (!alphaVantageKey) {
    logger.warn('Alpha Vantage API key not configured');
    return events;
  }

  try {
    // Alpha Vantage News API - use top Indian stocks or general market news
    // Use popular Indian stocks: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, HDFC, SBIN, BHARTIARTL
    const validTickers = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'HINDUNILVR', 'ITC', 'KOTAKBANK'];
    const tickerToUse = tickers.length > 0 && validTickers.includes(tickers[0].toUpperCase()) 
      ? tickers[0].toUpperCase() 
      : validTickers[0]; // Default to RELIANCE
    
    const newsResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'NEWS_SENTIMENT',
        tickers: tickerToUse,
        limit: 50,
        apikey: alphaVantageKey,
      },
      timeout: 10000,
    });

    if (newsResponse.data?.feed && Array.isArray(newsResponse.data.feed)) {
      newsResponse.data.feed.forEach((item: any, index: number) => {
        const sentiment = item.overall_sentiment_score || 0;
        const sentimentLabel: 'positive' | 'negative' | 'neutral' = 
          sentiment > 0.15 ? 'positive' : sentiment < -0.15 ? 'negative' : 'neutral';
        
        let eventType: NewsEvent['type'] = 'news';
        const titleLower = (item.title || '').toLowerCase();
        if (titleLower.includes('dividend')) {
          eventType = 'dividend';
        } else if (titleLower.includes('earnings') || titleLower.includes('results')) {
          eventType = 'earnings';
        } else if (titleLower.includes('merger') || titleLower.includes('acquisition')) {
          eventType = 'corp_action';
        } else if (titleLower.includes('rbi') || titleLower.includes('inflation') || titleLower.includes('gdp')) {
          eventType = 'macro';
        }

        events.push({
          id: `alphavantage-${item.time_published || Date.now()}-${index}`,
          type: eventType,
          title: item.title || '',
          description: item.summary || '',
          publishedAt: item.time_published || new Date().toISOString(),
          source: item.source || 'Alpha Vantage',
          sentiment: sentimentLabel,
          metadata: {
            url: item.url,
            ticker_sentiment: item.ticker_sentiment,
          },
        });
      });
      logger.info(`Fetched ${events.length} items from Alpha Vantage News API`);
    } else if (newsResponse.data?.Note) {
      logger.warn('Alpha Vantage API limit reached:', newsResponse.data.Note);
    }
  } catch (err: any) {
    logger.warn('Alpha Vantage News API fetch failed:', err.message || err);
  }
  
  return events;
}

// Fetch from NewsAPI as fallback
async function fetchNewsAPI(searchQuery: string): Promise<NewsEvent[]> {
  const events: NewsEvent[] = [];
  const newsApiKey = process.env.NEWS_API_KEY || '5e4d26bcce5546b58463ab88838a972d';
  
  try {
    const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: searchQuery,
        sortBy: 'publishedAt',
        pageSize: 10,
        language: 'en',
        apiKey: newsApiKey,
      },
      timeout: 5000,
    });

    const articles = newsResponse.data?.articles || [];
    const headlines = articles.map((a: any) => a.title);
    let sentimentScores: any[] = [];
    
    if (headlines.length > 0) {
      try {
        sentimentScores = await scoreSentiment(headlines);
      } catch (e) {
        logger.warn('Sentiment analysis failed:', e);
      }
    }

    articles.forEach((article: any, index: number) => {
      const sentiment = sentimentScores[index]?.score || 0;
      const sentimentLabel: 'positive' | 'negative' | 'neutral' = 
        sentiment > 1 ? 'positive' : sentiment < -1 ? 'negative' : 'neutral';
      
      let eventType: NewsEvent['type'] = 'news';
      if (article.title.toLowerCase().includes('dividend')) {
        eventType = 'dividend';
      } else if (article.title.toLowerCase().includes('earnings') || article.title.toLowerCase().includes('results')) {
        eventType = 'earnings';
      } else if (article.title.toLowerCase().includes('merger') || article.title.toLowerCase().includes('acquisition')) {
        eventType = 'corp_action';
      } else if (article.title.toLowerCase().includes('rbi') || article.title.toLowerCase().includes('inflation')) {
        eventType = 'macro';
      }

      events.push({
        id: `newsapi-${article.publishedAt}-${index}`,
        type: eventType,
        title: article.title || '',
        description: article.description || '',
        publishedAt: article.publishedAt || new Date().toISOString(),
        source: article.source?.name || 'Unknown',
        sentiment: sentimentLabel,
        metadata: {
          url: article.url,
        },
      });
    });
  } catch (err) {
    logger.warn('NewsAPI fetch failed:', err);
  }
  
  return events;
}

// Generate fallback news events (for when APIs fail)
function generateFallbackNews(): NewsEvent[] {
  return [
    {
      id: 'fallback-1',
      type: 'news',
      title: 'Indian Stock Market Update: Sensex and Nifty Show Volatility',
      description: 'The Indian stock market continues to show mixed signals with global economic trends influencing investor sentiment.',
      publishedAt: new Date().toISOString(),
      source: 'Market Update',
      sentiment: 'neutral',
    },
    {
      id: 'fallback-2',
      type: 'news',
      title: 'FII Flow Trends: Foreign Investors Monitor Indian Markets',
      description: 'Foreign Institutional Investors are closely watching policy changes and economic indicators.',
      publishedAt: new Date().toISOString(),
      source: 'Market Update',
      sentiment: 'neutral',
    },
    {
      id: 'fallback-3',
      type: 'macro',
      title: 'RBI Policy Updates: Central Bank Monitoring Inflation Trends',
      description: 'The Reserve Bank of India continues to monitor inflation and economic growth patterns.',
      publishedAt: new Date().toISOString(),
      source: 'Market Update',
      sentiment: 'neutral',
    },
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ events: NewsEvent[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, token } = req.query as { type?: string; token?: string };
    const events: NewsEvent[] = [];
    
    // Always try to fetch from RSS feeds first (more reliable and unlimited)
    const [moneycontrolNews, etNews, bsNews, livemintNews, ndtvNews] = await Promise.allSettled([
      fetchMoneycontrolNews(),
      fetchEconomicTimesNews(),
      fetchBusinessStandardNews(),
      fetchLivemintNews(),
      fetchNDTVBusinessNews(),
    ]);

    // Add successful fetches
    if (moneycontrolNews.status === 'fulfilled' && moneycontrolNews.value.length > 0) {
      events.push(...moneycontrolNews.value);
      logger.info(`Fetched ${moneycontrolNews.value.length} news items from Moneycontrol`);
    } else {
      logger.warn('Moneycontrol RSS fetch failed or returned no data');
    }
    
    if (etNews.status === 'fulfilled' && etNews.value.length > 0) {
      events.push(...etNews.value);
      logger.info(`Fetched ${etNews.value.length} news items from Economic Times`);
    } else {
      logger.warn('Economic Times RSS fetch failed or returned no data');
    }
    
    if (bsNews.status === 'fulfilled' && bsNews.value.length > 0) {
      events.push(...bsNews.value);
      logger.info(`Fetched ${bsNews.value.length} news items from Business Standard`);
    } else {
      logger.warn('Business Standard RSS fetch failed or returned no data');
    }
    
    if (livemintNews.status === 'fulfilled' && livemintNews.value.length > 0) {
      events.push(...livemintNews.value);
      logger.info(`Fetched ${livemintNews.value.length} news items from Livemint`);
    } else {
      logger.warn('Livemint RSS fetch failed or returned no data');
    }
    
    if (ndtvNews.status === 'fulfilled' && ndtvNews.value.length > 0) {
      events.push(...ndtvNews.value);
      logger.info(`Fetched ${ndtvNews.value.length} news items from NDTV Business`);
    } else {
      logger.warn('NDTV Business RSS fetch failed or returned no data');
    }

    // Skip Alpha Vantage for now - RSS feeds are more reliable for Indian markets
    // Alpha Vantage has limited Indian market coverage and primarily supports US stocks

    // Fallback to NewsAPI if Alpha Vantage didn't return enough
    if (events.length < 10) {
      const queryMap: Record<string, string> = {
        news: 'Indian stock market',
        macro: 'Indian economy RBI inflation',
        earnings: 'India earnings results Q4',
        corp_action: 'India corporate action merger',
        dividend: 'India dividend announcement',
      };

      const searchQuery = type && queryMap[type] ? queryMap[type] : 'Indian stock market';
      try {
        const newsapiEvents = await fetchNewsAPI(searchQuery);
        if (newsapiEvents.length > 0) {
          events.push(...newsapiEvents);
          logger.info(`Fetched ${newsapiEvents.length} news items from NewsAPI`);
        }
      } catch (e) {
        logger.warn('NewsAPI fetch failed:', e);
      }
    }

    // If we still have no events, use fallback
    if (events.length === 0) {
      logger.warn('All news sources failed, using fallback news');
      events.push(...generateFallbackNews());
    }

    // Score sentiment for all events (only if we have events)
    if (events.length > 0) {
      const headlines = events.map(e => e.title);
      try {
        const sentimentScores = await scoreSentiment(headlines.slice(0, 30)); // Limit to avoid API limits
        events.forEach((event, index) => {
          if (index < sentimentScores.length) {
            const sentiment = sentimentScores[index]?.score || 0;
            event.sentiment = sentiment > 1 ? 'positive' : sentiment < -1 ? 'negative' : 'neutral';
          } else if (!event.sentiment) {
            event.sentiment = 'neutral';
          }
        });
      } catch (e) {
        logger.warn('Bulk sentiment analysis failed:', e);
        // Set default neutral sentiment if scoring fails
        events.forEach(event => {
          if (!event.sentiment) event.sentiment = 'neutral';
        });
      }
    }

    // Filter by type if specified
    const filteredEvents = type && type !== 'all' 
      ? events.filter(e => e.type === type)
      : events;

    // Sort by published date (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    logger.info(`Returning ${filteredEvents.length} total news events`);
    res.status(200).json({ events: filteredEvents.slice(0, 50) });
  } catch (err) {
    logger.error('News and events error:', err);
    // Return fallback news instead of empty array
    const fallback = generateFallbackNews();
    res.status(200).json({ events: fallback });
  }
}

