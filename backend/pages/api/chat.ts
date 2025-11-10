import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { fetchHoldings, fetchPositions, fetchQuotes } from '../../lib/mcp';
import { logger } from '../../lib/logger';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

async function executeTrade(token: string, tradeCommand: { action: 'BUY' | 'SELL'; symbol: string; quantity: number; orderType?: 'MARKET' | 'LIMIT'; price?: number; product?: 'CNC' | 'MIS' | 'NRML'; exchange?: string }) {
  try {
    const auth = getKiteAuth(token);
    
    // Ensure exchange is set - default to NSE for equity stocks
    const exchange = (tradeCommand.exchange || 'NSE').toUpperCase();
    
    // Ensure quantity is an integer
    const quantity = parseInt(tradeCommand.quantity.toString(), 10);
    
    // Build order parameters - ensure all required fields are present
    const orderParams: Record<string, string | number> = {
      exchange: exchange,
      tradingsymbol: tradeCommand.symbol.toUpperCase().trim(),
      transaction_type: tradeCommand.action.toUpperCase(),
      quantity: quantity,
      product: (tradeCommand.product || 'CNC').toUpperCase(),
      order_type: (tradeCommand.orderType || 'MARKET').toUpperCase(),
      validity: 'DAY',
    };

    // Add price for LIMIT orders
    if (tradeCommand.orderType === 'LIMIT' && tradeCommand.price) {
      orderParams.price = parseFloat(tradeCommand.price.toString());
    }

    // Log the exact parameters being sent
    logger.info(`Placing order params:`, JSON.stringify(orderParams, null, 2));
    logger.info(`Exchange value:`, exchange, typeof exchange);

    // Convert to URL-encoded form data (Kite API expects form-urlencoded)
    // Use qs library or manual encoding to ensure proper format
    const formDataPairs: string[] = [];
    Object.entries(orderParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formDataPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });
    const formDataString = formDataPairs.join('&');
    
    logger.info(`Form data string:`, formDataString);
    logger.info(`Form data includes exchange:`, formDataString.includes('exchange'));

    const response = await axios.post(
      `${KITE_API_BASE}/orders/regular`,
      formDataString,
      {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${auth.apiKey}:${auth.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: () => true, // Don't throw on any status
      }
    );

    logger.info(`Kite API response status:`, response.status);
    logger.info(`Kite API response data:`, JSON.stringify(response.data, null, 2));

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        orderId: response.data.data?.order_id || 'Unknown',
        message: `Order placed successfully: ${tradeCommand.action} ${tradeCommand.quantity} ${tradeCommand.symbol} @ ${tradeCommand.orderType || 'MARKET'}`,
      };
    } else {
      const errorMsg = response.data?.message || response.data?.error || 'Failed to place order';
      return {
        success: false,
        error: String(errorMsg),
      };
    }
  } catch (error: any) {
    // Extract error message safely to avoid circular references
    const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to place order';
    logger.error('Trade execution error:', errorMessage);
    logger.error('Error details:', {
      symbol: tradeCommand.symbol,
      action: tradeCommand.action,
      quantity: tradeCommand.quantity,
      exchange: tradeCommand.exchange || 'NSE',
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return {
      success: false,
      error: String(errorMessage),
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ response: string; suggestions?: any[]; executed?: any } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Declare variables outside try block for catch block access
  let portfolioContext = '';
  let marketContext = '';

  try {
    const { message, token, conversationHistory } = req.body;

    if (!message || !token) {
      return res.status(400).json({ error: 'Message and token are required' });
    }

    // Check if user wants to execute a trade
    const tradeCommands = parseTradeCommands(message, conversationHistory);
    if (tradeCommands && tradeCommands.length > 0) {
      const executionResults = [];
      const errors = [];
      
      // Execute all trade commands
      for (const tradeCommand of tradeCommands) {
        logger.info(`Executing trade: ${tradeCommand.action} ${tradeCommand.quantity} ${tradeCommand.symbol}`);
        const tradeResult = await executeTrade(token, tradeCommand);
        
        if (!tradeResult.success) {
          const errorMsg = String(tradeResult.error || 'Unknown error');
          errors.push(`${tradeCommand.symbol}: ${errorMsg}`);
          logger.error(`Trade execution failed for ${tradeCommand.symbol}:`, errorMsg);
        } else {
          executionResults.push({
            action: tradeCommand.action,
            symbol: tradeCommand.symbol,
            quantity: tradeCommand.quantity,
            price: tradeCommand.price,
            orderId: tradeResult.orderId,
          });
        }
      }
      
      if (executionResults.length === 0) {
        return res.status(200).json({
          response: `❌ All order executions failed:\n${errors.join('\n')}`,
          executed: null,
        });
      }
      
      const successMessage = executionResults.map(r => 
        `✅ ${r.action} ${r.quantity} shares of ${r.symbol}${r.price ? ` at ₹${r.price}` : ' (MARKET order)'} - Order ID: ${r.orderId || 'N/A'}`
      ).join('\n\n');
      
      const errorMessage = errors.length > 0 ? `\n\n❌ Failed orders:\n${errors.join('\n')}` : '';
      
      return res.status(200).json({
        response: `✅ Orders executed successfully!\n\n${successMessage}${errorMessage}`,
        executed: executionResults.length === 1 ? executionResults[0] : executionResults,
      });
    }

    // Fetch comprehensive portal context
    let holdings: any[] = [];
    
    try {
      holdings = await fetchHoldings(token);
      const positions = await fetchPositions(token);
      
      if (holdings.length > 0) {
        const totalValue = holdings.reduce((sum, h) => sum + ((h.last_price || 0) * h.quantity), 0);
        portfolioContext += `\n\n=== PORTFOLIO HOLDINGS (Total Value: ₹${totalValue.toLocaleString('en-IN')}) ===\n${holdings.slice(0, 20).map((h: any) => 
          `- ${h.tradingsymbol}: ${h.quantity} shares @ ₹${h.average_price}, Current: ₹${h.last_price || 'N/A'}, P&L: ₹${((h.last_price || 0) - h.average_price) * h.quantity}`
        ).join('\n')}`;
      }

      if (positions && positions.length > 0) {
        portfolioContext += `\n\n=== OPEN POSITIONS ===\n${positions.slice(0, 10).map((p: any) => 
          `- ${p.tradingsymbol}: ${p.quantity} @ ₹${p.average_price}, P&L: ₹${p.pnl || 0}`
        ).join('\n')}`;
      }
    } catch (e) {
      logger.warn('Could not fetch portfolio context:', e);
    }

    // Fetch current market data for context
    let todayStocksData: any = null;
    let marketMoodData: any = null;
    let indicesData: any = null;
    
    try {
      // Fetch today's stocks (gainers, losers, most active)
      try {
        const stocksRes = await fetch(`http://localhost:3000/api/market/today-stocks?token=${encodeURIComponent(token)}`);
        if (stocksRes.ok) {
          todayStocksData = await stocksRes.json();
        }
      } catch (e) {
        logger.warn('Could not fetch today stocks:', e);
      }
      
      // Fetch market mood
      try {
        const moodRes = await fetch('http://localhost:3000/api/market/mood');
        if (moodRes.ok) {
          marketMoodData = await moodRes.json();
        }
      } catch (e) {
        logger.warn('Could not fetch market mood:', e);
      }
      
      // Fetch indices (NIFTY 50, SENSEX)
      try {
        const indicesRes = await fetch('http://localhost:3000/api/market/indices');
        if (indicesRes.ok) {
          indicesData = await indicesRes.json();
        }
      } catch (e) {
        logger.warn('Could not fetch indices:', e);
      }
      
      // Build market context
      if (indicesData) {
        marketContext += `\n\n=== MARKET INDICES ===\n`;
        if (indicesData.nifty50) {
          marketContext += `NIFTY 50: ₹${indicesData.nifty50.value.toLocaleString('en-IN')} (${indicesData.nifty50.change >= 0 ? '+' : ''}${indicesData.nifty50.change.toFixed(2)}%)\n`;
        }
        if (indicesData.sensex) {
          marketContext += `SENSEX: ₹${indicesData.sensex.value.toLocaleString('en-IN')} (${indicesData.sensex.change >= 0 ? '+' : ''}${indicesData.sensex.change.toFixed(2)}%)\n`;
        }
      }
      
      if (marketMoodData && marketMoodData.mood) {
        marketContext += `\n=== MARKET MOOD ===\n`;
        marketContext += `${marketMoodData.mood.label} (${marketMoodData.mood.value}/100)\n`;
        marketContext += `Interpretation: ${marketMoodData.mood.value > 70 ? 'High Greed - Be cautious, consider taking profits' : marketMoodData.mood.value < 30 ? 'High Fear - Good buying opportunities may exist' : 'Neutral - Balanced market conditions'}\n`;
      }
      
      if (todayStocksData) {
        marketContext += `\n=== TODAY'S MARKET MOVERS ===\n`;
        
        if (todayStocksData.gainers && todayStocksData.gainers.length > 0) {
          marketContext += `\nTop Gainers:\n`;
          todayStocksData.gainers.slice(0, 5).forEach((g: any) => {
            marketContext += `- ${g.symbol}: ₹${g.price.toFixed(2)} (+${g.changePercent.toFixed(2)}%)\n`;
          });
        }
        
        if (todayStocksData.losers && todayStocksData.losers.length > 0) {
          marketContext += `\nTop Losers:\n`;
          todayStocksData.losers.slice(0, 5).forEach((l: any) => {
            marketContext += `- ${l.symbol}: ₹${l.price.toFixed(2)} (${l.changePercent.toFixed(2)}%)\n`;
          });
        }
        
        if (todayStocksData.mostActive && todayStocksData.mostActive.length > 0) {
          marketContext += `\nMost Active:\n`;
          todayStocksData.mostActive.slice(0, 5).forEach((a: any) => {
            marketContext += `- ${a.symbol}: ₹${a.price.toFixed(2)} (${a.changePercent >= 0 ? '+' : ''}${a.changePercent.toFixed(2)}%)\n`;
          });
        }
        
        if (todayStocksData.near52WLow && todayStocksData.near52WLow.length > 0) {
          marketContext += `\nNear 52W Low (Potential Buy Opportunities):\n`;
          todayStocksData.near52WLow.slice(0, 5).forEach((l: any) => {
            marketContext += `- ${l.symbol}: ₹${l.price.toFixed(2)} (${l.changePercent.toFixed(2)}%)\n`;
          });
        }
      }
      
      // Fetch quotes for holdings
      if (holdings.length > 0) {
        const symbols = holdings.slice(0, 15).map((h: any) => `NSE:${h.tradingsymbol}`);
        const quotes = await fetchQuotes(token, symbols);
        
        if (quotes && Object.keys(quotes).length > 0) {
          marketContext += `\n\n=== YOUR HOLDINGS CURRENT PRICES ===\n`;
          Object.entries(quotes).forEach(([key, data]: [string, any]) => {
            const symbol = key.split(':')[1];
            if (data && data.last_price) {
              const change = data.net_change_percentage || data.net_change || 0;
              marketContext += `- ${symbol}: ₹${data.last_price} (${change >= 0 ? '+' : ''}${change}%)\n`;
            }
          });
        }
      }
    } catch (e) {
      logger.warn('Could not fetch market context:', e);
    }

    // Get current time and market status
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15;
    const marketClose = 15 * 60 + 30;
    const isMarketOpen = istTime.getDay() >= 1 && istTime.getDay() <= 5 && currentTime >= marketOpen && currentTime <= marketClose;

    const systemPrompt = `You are a professional stock market advisor and portfolio manager. 
You help users make informed decisions about buying, selling, and managing their stock portfolio.

IMPORTANT: You can execute trades directly. When user says:
- "buy X shares of SYMBOL" or "buy SYMBOL" or "purchase SYMBOL"
- "sell X shares of SYMBOL" or "sell SYMBOL"
- "execute buy/sell order for SYMBOL"

You have access to the user's complete portfolio, holdings, positions, and current market data.
Use this information to provide contextual, personalized advice that varies based on the question.

RECOMMENDATION GUIDELINES:
- When asked "what should I buy" or "what to buy today", analyze TODAY'S market conditions:
  * Look at top gainers with strong momentum (change > 1%)
  * Identify stocks near 52W low that might be oversold
  * Consider most active stocks with positive momentum
  * Factor in market mood (greed vs fear)
  * Check indices direction (NIFTY 50, SENSEX)
- Provide 3-5 specific buy recommendations with:
  * Stock symbol
  * Current price
  * Suggested quantity (based on portfolio size)
  * Entry price
  * Stop-loss level
  * Target price
  * Reasoning based on today's market data
- Format recommendations clearly: "buy X shares of SYMBOL" so they can be executed
- Consider diversification - don't recommend all stocks from same sector
- If market mood is high greed (>70), be cautious and suggest defensive stocks
- If market mood is high fear (<30), suggest quality stocks at discounts

TRADE EXECUTION:
- CRITICAL: NEVER claim you executed an order unless you actually did
- NEVER say "Order executed successfully" or "Successfully purchased" unless the order was actually placed
- If user says "do it", "execute", "proceed", "go ahead" - they want to execute previous recommendations
- When suggesting trades, format them clearly as: "buy X shares of SYMBOL" or "sell X shares of SYMBOL"
- If user wants to trade, explain the reasoning first
- Ask for confirmation if quantity is not specified
- Suggest appropriate quantities based on portfolio size
- Recommend stop-loss levels
- Consider market conditions before executing
- IMPORTANT: Only claim execution if you actually called the trade execution API

Current Market Status: ${isMarketOpen ? 'OPEN' : 'CLOSED'} (IST: ${istTime.toLocaleTimeString()})
Trading Hours: 9:15 AM - 3:30 PM IST (Mon-Fri)

Be concise, actionable, and educational. Always explain WHY you're making a recommendation.
Reference specific holdings and market data when relevant.`;

    // Build conversation history for context
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: any) => {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    const userPrompt = `${message}${portfolioContext}${marketContext}`;
    messages.push({ role: 'user', content: userPrompt });

    let response: string;
    const suggestions: any[] = [];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8, // Higher temperature for more varied responses
        max_tokens: 1000, // Increased for detailed recommendations
      });

      response = completion.choices[0].message.content || 'Sorry, I could not generate a response.';

      // Extract actionable suggestions - improved pattern matching
      const buyPatterns = [
        /buy\s+(\d+)\s+shares?\s+of\s+([A-Z]+)/i,
        /buy\s+(\d+)\s+([A-Z]+)/i,
        /purchase\s+(\d+)\s+shares?\s+of\s+([A-Z]+)/i,
        /execute\s+buy\s+(\d+)\s+shares?\s+of\s+([A-Z]+)/i,
      ];

      const sellPatterns = [
        /sell\s+(\d+)\s+shares?\s+of\s+([A-Z]+)/i,
        /sell\s+(\d+)\s+([A-Z]+)/i,
        /execute\s+sell\s+(\d+)\s+shares?\s+of\s+([A-Z]+)/i,
      ];

      for (const pattern of buyPatterns) {
        const match = response.match(pattern);
        if (match) {
          suggestions.push({
            action: 'BUY',
            symbol: match[2] || match[1],
            quantity: parseInt(match[1] || match[2]),
          });
          break;
        }
      }

      for (const pattern of sellPatterns) {
        const match = response.match(pattern);
        if (match) {
          suggestions.push({
            action: 'SELL',
            symbol: match[2] || match[1],
            quantity: parseInt(match[1] || match[2]),
          });
          break;
        }
      }
    } catch (error: any) {
      // Handle OpenAI quota errors - extract message safely to avoid circular references
      const errorMessage = error?.message || String(error) || 'Unknown error';
      if (error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('429')) {
        logger.warn('OpenAI API quota exceeded, using fallback response');
        response = `⚠️ OpenAI API quota exceeded. Based on your portfolio data:\n\n${portfolioContext ? `Your Portfolio:\n${portfolioContext}\n\n` : ''}${marketContext ? `Current Market:\n${marketContext}\n\n` : ''}Please check your portfolio manually or contact support to increase your OpenAI API quota.`;
      } else {
        logger.error('Chat API OpenAI error:', errorMessage);
        response = `Sorry, I encountered an error: ${errorMessage}. Please try again later.`;
      }
    }

    res.status(200).json({
      response,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    });
  } catch (error: any) {
    // Extract error message safely to avoid circular references
    const errorMessage = error?.message || String(error) || 'Internal server error';
    logger.error('Chat API error:', errorMessage);
    res.status(500).json({ 
      error: errorMessage
    });
  }
}

// Parse trade commands from user message and conversation history
function parseTradeCommands(message: string, conversationHistory?: any[]): Array<{ action: 'BUY' | 'SELL'; symbol: string; quantity: number; orderType?: 'MARKET' | 'LIMIT'; price?: number; product?: 'CNC' | 'MIS' | 'NRML'; exchange?: string }> | null {
  const trimmed = message.trim().toLowerCase();
  const commands: Array<{ action: 'BUY' | 'SELL'; symbol: string; quantity: number; orderType?: 'MARKET' | 'LIMIT'; price?: number; product?: 'CNC' | 'MIS' | 'NRML'; exchange?: string }> = [];
  
  // Check for explicit execution commands ("do it", "execute", "proceed", "go ahead")
  const executionKeywords = ['do it', 'execute', 'proceed', 'go ahead', 'place orders', 'execute orders', 'buy them', 'sell them'];
  const wantsExecution = executionKeywords.some(keyword => trimmed.includes(keyword));
  
  // If user wants execution, look for recommendations in conversation history
  if (wantsExecution && conversationHistory && conversationHistory.length > 0) {
    // Look through last 5 messages for trade recommendations
    const recentMessages = conversationHistory.slice(-5).map((m: any) => m.content || '').join('\n');
    
    // Pattern to find multiple buy recommendations: "buy X shares of SYMBOL" or "X shares of SYMBOL"
    const recommendationPatterns = [
      /buy\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
      /(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
      /([A-Z]{2,15}):\s*(\d+)\s+shares?/gi,
      /([A-Z]{2,15})\s+.*?(\d+)\s+shares?/gi,
    ];
    
    for (const pattern of recommendationPatterns) {
      let match;
      while ((match = pattern.exec(recentMessages)) !== null) {
        const quantity = parseInt(match[1] || match[2]);
        const symbol = (match[2] || match[1] || match[0]).toUpperCase().trim();
        
        // Validate symbol (should be 2-15 uppercase letters)
        if (symbol.length >= 2 && symbol.length <= 15 && /^[A-Z]+$/.test(symbol)) {
          // Check for price in the same context
          const contextStart = Math.max(0, match.index - 100);
          const contextEnd = Math.min(recentMessages.length, match.index + match[0].length + 100);
          const context = recentMessages.substring(contextStart, contextEnd);
          const priceMatch = context.match(/₹?\s*(\d+\.?\d*)\s*(?:per|@|at)/i);
          const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
          
          // Determine if it's a buy or sell (default to buy)
          const isSell = context.toLowerCase().includes('sell');
          
          commands.push({
            action: isSell ? 'SELL' : 'BUY',
            symbol,
            quantity,
            orderType: price ? 'LIMIT' : 'MARKET',
            price,
            product: 'CNC',
            exchange: 'NSE',
          });
        }
      }
    }
    
    // Also check for explicit stock names mentioned in recommendations
    const stockNames = ['ICICIBANK', 'ICICI', 'INFY', 'INFOSYS', 'TCS', 'TATA CONSULTANCY'];
    for (const stockName of stockNames) {
      const stockPattern = new RegExp(`${stockName}.*?(\\d+)\\s*shares?`, 'gi');
      const match = stockPattern.exec(recentMessages);
      if (match) {
        const quantity = parseInt(match[1]);
        const priceMatch = recentMessages.match(new RegExp(`${stockName}.*?₹?\\s*(\\d+\\.?\\d*)`, 'i'));
        const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;
        
        commands.push({
          action: 'BUY',
          symbol: stockName === 'ICICI' ? 'ICICIBANK' : stockName,
          quantity,
          orderType: price ? 'LIMIT' : 'MARKET',
          price,
          product: 'CNC',
          exchange: 'NSE',
        });
      }
    }
  }
  
  // Patterns for explicit buy commands in current message
  const buyPatterns = [
    /buy\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
    /buy\s+(\d+)\s+([A-Z]{2,15})/gi,
    /execute\s+buy\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
    /place\s+buy\s+order\s+for\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
    /purchase\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
  ];

  // Patterns for explicit sell commands in current message
  const sellPatterns = [
    /sell\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
    /sell\s+(\d+)\s+([A-Z]{2,15})/gi,
    /execute\s+sell\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
    /place\s+sell\s+order\s+for\s+(\d+)\s+shares?\s+of\s+([A-Z]{2,15})/gi,
  ];

  // Check for buy commands in current message
  for (const pattern of buyPatterns) {
    let match;
    while ((match = pattern.exec(trimmed)) !== null) {
      const quantity = parseInt(match[1] || match[2]);
      const symbol = (match[2] || match[1]).toUpperCase().trim();
      
      if (symbol.length >= 2 && symbol.length <= 15) {
        const limitMatch = trimmed.match(/at\s+₹?(\d+\.?\d*)/i);
        const price = limitMatch ? parseFloat(limitMatch[1]) : undefined;
        
        commands.push({
          action: 'BUY',
          symbol,
          quantity,
          orderType: price ? 'LIMIT' : 'MARKET',
          price,
          product: 'CNC',
          exchange: 'NSE',
        });
      }
    }
  }

  // Check for sell commands in current message
  for (const pattern of sellPatterns) {
    let match;
    while ((match = pattern.exec(trimmed)) !== null) {
      const quantity = parseInt(match[1] || match[2]);
      const symbol = (match[2] || match[1]).toUpperCase().trim();
      
      if (symbol.length >= 2 && symbol.length <= 15) {
        const limitMatch = trimmed.match(/at\s+₹?(\d+\.?\d*)/i);
        const price = limitMatch ? parseFloat(limitMatch[1]) : undefined;
        
        commands.push({
          action: 'SELL',
          symbol,
          quantity,
          orderType: price ? 'LIMIT' : 'MARKET',
          price,
          product: 'CNC',
          exchange: 'NSE',
        });
      }
    }
  }

  return commands.length > 0 ? commands : null;
}

