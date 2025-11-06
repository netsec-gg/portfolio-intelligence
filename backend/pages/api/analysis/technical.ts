import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchQuotes, fetchHistoricalData } from '../../../lib/mcp';
import { logger } from '../../../lib/logger';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export interface TechnicalIndicator {
  symbol: string;
  rsi?: number;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  movingAverages?: {
    sma20: number;
    sma50: number;
    sma200: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  recommendation?: 'BUY' | 'SELL' | 'HOLD';
  strength?: number;
  metadata?: Record<string, any>;
}

async function getAIRecommendation(
  symbol: string,
  quote: any,
  technicalData: any,
  changePercent: number,
  volume: number
): Promise<{ recommendation: 'BUY' | 'SELL' | 'HOLD'; strength: number; reasoning?: string }> {
  try {
    const stockData = {
      symbol,
      currentPrice: quote.last_price || quote.close || 0,
      openPrice: quote.ohlc?.open || quote.open || 0,
      high: quote.ohlc?.high || quote.high || 0,
      low: quote.ohlc?.low || quote.low || 0,
      changePercent,
      volume,
      ...technicalData,
    };

    // Quick fallback based on price action before AI call - VERY AGGRESSIVE
    // If there's ANY movement, make a recommendation
    if (volume > 0) {
      let quickRec: { recommendation: 'BUY' | 'SELL' | 'HOLD'; strength: number };
      
      if (changePercent > 0.1) {
        quickRec = { recommendation: 'BUY', strength: Math.min(100, Math.abs(changePercent) * 50 + 20) };
      } else if (changePercent < -0.1) {
        quickRec = { recommendation: 'SELL', strength: Math.min(100, Math.abs(changePercent) * 50 + 20) };
      } else {
        // Even for tiny movements, be decisive
        quickRec = changePercent > 0 
          ? { recommendation: 'BUY', strength: 25 }
          : changePercent < 0
          ? { recommendation: 'SELL', strength: 25 }
          : { recommendation: 'HOLD', strength: 0 };
      }
      
      // Always try AI first, but use quickRec as guaranteed fallback
      try {
        const prompt = `You are an expert stock market analyst. Analyze the following stock data and provide a recommendation.

Stock Data:
- Symbol: ${stockData.symbol}
- Current Price: ₹${stockData.currentPrice}
- Open Price: ₹${stockData.openPrice}
- High: ₹${stockData.high}
- Low: ₹${stockData.low}
- Change Today: ${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%
- Volume: ${stockData.volume.toLocaleString()}
${stockData.rsi ? `- RSI (14): ${stockData.rsi.toFixed(2)}` : ''}
${stockData.macd ? `- MACD: ${stockData.macd.value.toFixed(2)}, Signal: ${stockData.macd.signal.toFixed(2)}, Histogram: ${stockData.macd.histogram.toFixed(2)}` : ''}
${stockData.movingAverages ? `- SMA 20: ₹${stockData.movingAverages.sma20.toFixed(2)}, SMA 50: ₹${stockData.movingAverages.sma50.toFixed(2)}, SMA 200: ₹${stockData.movingAverages.sma200.toFixed(2)}` : ''}
${stockData.bollingerBands ? `- Bollinger Bands: Upper ₹${stockData.bollingerBands.upper.toFixed(2)}, Middle ₹${stockData.bollingerBands.middle.toFixed(2)}, Lower ₹${stockData.bollingerBands.lower.toFixed(2)}` : ''}

Based on this data, provide a recommendation in JSON format:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "strength": 0-100,
  "reasoning": "Brief explanation of why"
}

CRITICAL RULES - FOLLOW THESE STRICTLY:
- Change > 0.1% = MUST BE BUY (not HOLD)
- Change < -0.1% = MUST BE SELL (not HOLD)
- Change > 2% = STRONG BUY (strength 70-100)
- Change < -2% = STRONG SELL (strength 70-100)
- RSI < 35 = BUY signal (oversold)
- RSI > 65 = SELL signal (overbought)
- MACD histogram > 0 = BUY signal
- MACD histogram < 0 = SELL signal
- Price above SMA20/SMA50 = BUY signal
- Price below SMA20/SMA50 = SELL signal

MOST IMPORTANT: NEVER return HOLD if changePercent is not exactly 0. If changePercent > 0, return BUY. If changePercent < 0, return SELL. Only use HOLD if changePercent is exactly 0 and no other signals.

Return ONLY valid JSON, no other text.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional stock market analyst. Always return valid JSON with recommendation (BUY/SELL/HOLD), strength (0-100), and reasoning. NEVER return HOLD if changePercent is not 0.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1, // Lower temperature for more consistent results
          max_tokens: 200,
          response_format: { type: 'json_object' },
        });

        const response = completion.choices[0].message.content || '{}';
        let parsed: any;
        
        try {
          parsed = JSON.parse(response);
        } catch (parseError) {
          logger.warn(`JSON parse failed for ${symbol}, using fallback:`, parseError);
          return quickRec;
        }

        const rec = parsed.recommendation?.toUpperCase();
        let validRec = rec === 'BUY' || rec === 'SELL' ? rec : quickRec.recommendation; // Use fallback if HOLD
        
        // FORCE override: If AI returned HOLD but we have ANY movement, use quickRec
        if (validRec === 'HOLD' && changePercent !== 0) {
          logger.warn(`AI returned HOLD for ${symbol} with changePercent=${changePercent}, overriding to ${quickRec.recommendation}`);
          return quickRec;
        }

        return {
          recommendation: validRec,
          strength: Math.min(100, Math.max(0, parsed.strength || quickRec.strength)),
          reasoning: parsed.reasoning || parsed.reason || '',
        };
      } catch (aiError: any) {
        // Handle OpenAI quota errors - use fallback
        if (aiError?.status === 429 || aiError?.message?.includes('quota') || aiError?.message?.includes('429')) {
          logger.warn(`OpenAI quota exceeded for ${symbol}, using price action fallback`);
        } else {
          logger.warn(`AI call failed for ${symbol}, using price action:`, aiError);
        }
        return quickRec;
      }
    }

    // If no volume, still try to make recommendation based on price
    if (changePercent > 0.05) {
      return { recommendation: 'BUY', strength: Math.min(50, changePercent * 100) };
    } else if (changePercent < -0.05) {
      return { recommendation: 'SELL', strength: Math.min(50, Math.abs(changePercent) * 100) };
    }
    
    return { recommendation: 'HOLD', strength: 0 };
  } catch (error) {
    logger.error(`AI recommendation error for ${symbol}:`, error);
    // Aggressive fallback
    if (changePercent > 0.05) {
      return { recommendation: 'BUY', strength: Math.min(100, changePercent * 40) };
    } else if (changePercent < -0.05) {
      return { recommendation: 'SELL', strength: Math.min(100, Math.abs(changePercent) * 40) };
    }
    return { recommendation: 'HOLD', strength: 0 };
  }
}

// Cache for instrument tokens
const instrumentTokenCache: Record<string, string> = {};

async function getInstrumentToken(symbol: string, exchange: string, token: string): Promise<string | null> {
  const cacheKey = `${exchange}:${symbol}`;
  if (instrumentTokenCache[cacheKey]) {
    return instrumentTokenCache[cacheKey];
  }

  try {
    // Get quote first to get instrument token
    const { fetchQuotes } = await import('../../../lib/mcp');
    const quotes = await fetchQuotes(token, [`${exchange}:${symbol}`]);
    const quote = Object.values(quotes || {})[0] as any;
    
    if (quote && quote.instrument_token) {
      instrumentTokenCache[cacheKey] = quote.instrument_token.toString();
      return instrumentTokenCache[cacheKey];
    }

    // Fallback: try to construct instrument token from symbol
    // This is a simplified approach - in production, maintain a proper mapping
    return null;
  } catch (e) {
    logger.warn(`Could not get instrument token for ${symbol}:`, e);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ indicators: TechnicalIndicator[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols, token } = req.query as { symbols: string; token?: string };
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    // Get token
    let finalToken = token || (req.headers['x-kite-token'] as string) || '';
    if (!finalToken) {
      try {
        const configPath = join(process.cwd(), 'kite-config.json');
        if (existsSync(configPath)) {
          const config = JSON.parse(readFileSync(configPath, 'utf-8'));
          finalToken = config.accessToken || '';
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!finalToken) {
      return res.status(400).json({ error: 'Kite token required' });
    }

    const symbolList = symbols.split(',').map(s => s.trim());
    const indicators: TechnicalIndicator[] = [];

    for (const symbol of symbolList) {
      try {
        // Extract exchange and symbol
        const [exchange, pureSymbol] = symbol.includes(':') 
          ? symbol.split(':') 
          : ['NSE', symbol];

        // Get current quote to fetch price data
        const quotes = await fetchQuotes(finalToken, [`${exchange}:${pureSymbol}`]);
        const quote = Object.values(quotes || {})[0] as any;
        
        if (!quote || !quote.last_price) {
          indicators.push({ symbol, recommendation: 'HOLD', strength: 0 });
          continue;
        }

        // Try to get instrument token for historical data
        const instrumentToken = await getInstrumentToken(pureSymbol, exchange, finalToken);
        
        let candles: number[][] = [];
        
        if (instrumentToken) {
          // Fetch historical data
          const fromDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
          const toDate = new Date();
          const from = fromDate.toISOString().split('T')[0];
          const to = toDate.toISOString().split('T')[0];
          
          try {
            candles = await fetchHistoricalData(finalToken, instrumentToken, from, to, 'day');
          } catch (e) {
            logger.warn(`Could not fetch historical data for ${symbol}:`, e);
          }
        }

        // Extract price change data from quote - handle different quote formats
        const currentPrice = quote.last_price || quote.close || 0;
        const openPrice = quote.ohlc?.open || quote.open || currentPrice;
        
        // Try multiple ways to get change percentage
        let changePercent = 0;
        
        // First try: net_change_percentage (Kite API format)
        if (quote.net_change_percentage !== undefined) {
          changePercent = quote.net_change_percentage;
        } else if (quote.net_change !== undefined) {
          // If net_change is already a percentage (typically between -100 and 100)
          if (Math.abs(quote.net_change) < 100) {
            changePercent = quote.net_change;
          } else {
            // If net_change is absolute, calculate percentage
            changePercent = openPrice > 0 ? ((quote.net_change / openPrice) * 100) : 0;
          }
        } else {
          // Calculate from price difference as last resort
          const change = currentPrice - openPrice;
          changePercent = openPrice > 0 ? ((change / openPrice) * 100) : 0;
        }
        
        const volume = quote.volume || quote.traded_quantity || 0;
        
        // CRITICAL: If changePercent is still 0 or very small, but we have price data,
        // try to infer from high/low/current price relationship
        if (Math.abs(changePercent) < 0.01 && volume > 0) {
          const high = quote.ohlc?.high || quote.high || currentPrice;
          const low = quote.ohlc?.low || quote.low || currentPrice;
          const range = high - low;
          if (range > 0 && openPrice > 0) {
            // If current price is significantly above the low, assume positive movement
            const positionInRange = (currentPrice - low) / range;
            // More aggressive: if price is in upper 60% of range, it's positive
            if (positionInRange > 0.6) {
              changePercent = 0.5 + (positionInRange - 0.6) * 5; // 0.5% to 2.5%
            } else if (positionInRange < 0.4) {
              changePercent = -0.5 - (0.4 - positionInRange) * 5; // -0.5% to -2.5%
            }
          }
        }
        
        // If still no change, make a default recommendation based on price position
        if (Math.abs(changePercent) < 0.01 && volume > 0) {
          // Default to slight BUY if we have volume (someone is trading)
          changePercent = 0.2;
        }
        
        logger.info(`Stock ${symbol}: changePercent=${changePercent}, volume=${volume}, price=${currentPrice}`);
        
        // If we don't have enough historical data, use AI recommendation with quote data
        if (candles.length < 50) {
          // Use AI to analyze quote data
          const aiRec = await getAIRecommendation(pureSymbol, quote, {}, changePercent, volume);
          
          logger.info(`AI recommendation for ${symbol}: ${aiRec.recommendation}, strength: ${aiRec.strength}`);
          
          indicators.push({
            symbol: pureSymbol,
            recommendation: aiRec.recommendation,
            strength: aiRec.strength,
            metadata: {
              currentPrice,
              change: changePercent * openPrice / 100,
              changePercent,
              volume,
              reasoning: aiRec.reasoning,
              note: 'AI recommendation based on price action',
            }
          });
          continue;
        }

        const closes = candles.map((c: number[]) => c[4]); // Close price is typically at index 4

        // Calculate RSI
        const rsi = calculateRSI(closes, 14);

        // Calculate MACD
        const macd = calculateMACD(closes);

        // Calculate Moving Averages
        const sma20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
        const sma50 = closes.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50;
        const sma200 = closes.length >= 200 
          ? closes.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200 
          : sma50;

        // Calculate Bollinger Bands
        const bollinger = calculateBollingerBands(closes.slice(-20), 20, 2);

        // Use AI to generate recommendation with all technical data
        const technicalData = {
          rsi,
          macd,
          movingAverages: { sma20, sma50, sma200 },
          bollingerBands: bollinger,
        };

        const aiRec = await getAIRecommendation(pureSymbol, quote, technicalData, changePercent, volume);

        logger.info(`AI recommendation for ${symbol} (with technicals): ${aiRec.recommendation}, strength: ${aiRec.strength}`);

        indicators.push({
          symbol: pureSymbol,
          rsi,
          macd,
          movingAverages: { sma20, sma50, sma200 },
          bollingerBands: bollinger,
          recommendation: aiRec.recommendation,
          strength: aiRec.strength,
          metadata: {
            reasoning: aiRec.reasoning,
            note: 'AI recommendation based on technical analysis',
          },
        });
      } catch (err) {
        logger.warn(`Failed to calculate indicators for ${symbol}:`, err);
        indicators.push({ symbol: symbol.split(':')[1] || symbol, recommendation: 'HOLD', strength: 0 });
      }
    }

    res.status(200).json({ indicators });
  } catch (err) {
    logger.error('Technical analysis error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Simplified signal line (9-period EMA of MACD)
  const signalLine = macdLine * 0.9; // Approximation
  const histogram = macdLine - signalLine;

  return { value: macdLine, signal: signalLine, histogram };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

function calculateBollingerBands(prices: number[], period: number, stdDev: number) {
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: mean + (stdDev * standardDeviation),
    middle: mean,
    lower: mean - (stdDev * standardDeviation),
  };
}
