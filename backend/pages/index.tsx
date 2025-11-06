import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface MarketMood {
  value: number;
  label: string;
  color: string;
}

interface StockListItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}


interface NewsEvent {
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

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Notification {
  id: string;
  type: 'BUY' | 'SELL' | 'EDUCATION' | 'NEWS' | 'FII' | 'DII' | 'GAINER' | 'LOSER' | 'ACTIVE' | '52WHIGH' | '52WLOW';
  symbol?: string;
  title: string;
  message: string;
  color: string;
  timestamp: Date;
  quantity?: number;
}

interface FIIDIIDeal {
  type: 'FII' | 'DII';
  buy: number;
  sell: number;
  net: number;
}

export default function Dashboard() {
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [nifty50, setNifty50] = useState({ value: 0, change: 0, changePercent: 0 });
  const [sensex, setSensex] = useState({ value: 0, change: 0, changePercent: 0 });
  const [portfolioSummary, setPortfolioSummary] = useState({ totalValue: 0, totalPnL: 0, totalPnLPercent: 0, dayChange: 0, dayChangePercent: 0 });
  const [marketMood, setMarketMood] = useState<MarketMood | null>(null);
  const [todayStocks, setTodayStocks] = useState({
    gainers: [] as StockListItem[],
    losers: [] as StockListItem[],
    mostActive: [] as StockListItem[],
    near52WHigh: [] as StockListItem[],
    near52WLow: [] as StockListItem[],
  });
  const [stockFilter, setStockFilter] = useState<'gainers' | 'losers' | 'mostActive' | 'near52WHigh' | 'near52WLow'>('gainers');
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [newsFilter, setNewsFilter] = useState<'all' | 'news' | 'macro' | 'earnings' | 'corp_action' | 'dividend'>('all');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [fiiDiiData, setFiiDiiData] = useState<FIIDIIDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; suggestions?: any[]; executed?: any }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeOrderType, setTradeOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeProduct, setTradeProduct] = useState<'CNC' | 'MIS' | 'NRML'>('CNC');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [kiteToken, setKiteToken] = useState('');
  const [notificationQueueUpdated, setNotificationQueueUpdated] = useState(0);
  
  const notificationQueue = useRef<Notification[]>([]);
  const currentNotificationIndex = useRef(0);
  const seenNewsIds = useRef<Set<string>>(new Set());
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCyclingRef = useRef(false);
  const sentNotificationsToday = useRef<Set<string>>(new Set());
  const lastNotificationEvaluation = useRef<number>(0);
  const shownNotificationIds = useRef<Set<string>>(new Set()); // Track shown notifications in current session

  useEffect(() => {
    checkAuth();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('authenticated') === 'true') {
      setAuthenticated(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
      console.log('useEffect triggered - authenticated:', authenticated, 'kiteToken:', kiteToken ? 'present' : 'missing');
      
      // Fetch public data immediately (news, indices, mood, FII, stocks) even without auth
      const fetchPublicData = async () => {
        try {
          // Fetch news
          const newsRes = await fetch('/api/news/events');
          if (newsRes.ok) {
            const newsData = await newsRes.json();
            if (newsData?.events && Array.isArray(newsData.events)) {
              console.log(`Setting ${newsData.events.length} news events from initial fetch`);
              setNewsEvents(newsData.events);
            }
          }
          
          // Fetch FII/DII
          const intelRes = await fetch('/api/market/intelligence');
          if (intelRes.ok) {
            const intelData = await intelRes.json();
            if (intelData?.fiiDii?.fii) {
              setFiiDiiData({
                type: 'FII',
                buy: intelData.fiiDii.fii.buy || 0,
                sell: intelData.fiiDii.fii.sell || 0,
                net: intelData.fiiDii.fii.net || 0,
              });
            }
          }
          
          // Fetch indices
          const indicesRes = await fetch('/api/market/indices');
          if (indicesRes.ok) {
            const indicesData = await indicesRes.json();
            if (indicesData) {
              if (indicesData.nifty50) setNifty50(indicesData.nifty50);
              if (indicesData.sensex) setSensex(indicesData.sensex);
            }
          }
          
          // Fetch market mood
          const moodRes = await fetch('/api/market/mood');
          if (moodRes.ok) {
            const moodData = await moodRes.json();
            if (moodData?.mood) {
              setMarketMood(moodData.mood);
            }
          }
          
          // Fetch today's stocks (public data)
          const stocksRes = await fetch('/api/market/today-stocks');
          if (stocksRes.ok) {
            const stocksData = await stocksRes.json();
            if (stocksData) {
              console.log('Setting today stocks:', stocksData);
              setTodayStocks(stocksData);
            }
          }
        } catch (e) {
          console.error('Error fetching public data:', e);
        }
      };
      
      fetchPublicData();
      
      if (authenticated && kiteToken) {
        console.log('Starting fetchData and setting up intervals');
        fetchData();
        
        // Update ticker every 1 second for ultra-real-time updates (like Tickertape)
        const tickerInterval = setInterval(() => {
          if (kiteToken) {
            fetch(`/api/market/ticker?token=${encodeURIComponent(kiteToken)}`)
              .then(res => res.ok ? res.json() : null)
              .then(tickerData => {
                if (tickerData?.ticker) {
                  const priceItems = tickerData.ticker.filter((t: any) => t.type === 'price') || [];
                  const newTicker = priceItems.map((t: any) => ({
                    symbol: t.symbol || '',
                    price: parseFloat(t.value?.replace('₹', '').replace(',', '') || '0') || 0,
                    change: t.change || 0,
                    changePercent: t.changePercent || 0,
                  })).slice(0, 20);
                  setTicker(prev => {
                    // Force update to trigger re-render
                    return [...newTicker];
                  });
                }
              })
              .catch(() => {});
          }
        }, 1000);
        
        // Update portfolio summary every 1 second for real-time updates
        const portfolioInterval = setInterval(() => {
          if (kiteToken) {
            fetch(`/api/portfolio/overview?token=${encodeURIComponent(kiteToken)}`)
              .then(res => res.ok ? res.json() : null)
              .then(portfolioData => {
                if (portfolioData && !portfolioData.error) {
                  setPortfolioSummary({
                    totalValue: portfolioData.totalValue || 0,
                    totalPnL: portfolioData.totalPnL || 0,
                    totalPnLPercent: portfolioData.totalPnLPercent || 0,
                    dayChange: portfolioData.dayChange || 0,
                    dayChangePercent: portfolioData.dayChangePercent || 0,
                  });
                }
              })
              .catch(() => {});
          }
        }, 1000);
        
        return () => {
          clearInterval(tickerInterval);
          clearInterval(portfolioInterval);
        };
      }
      
      // Update indices every 1 second for ultra-real-time (like Tickertape)
      const indicesInterval = setInterval(() => {
        fetch('/api/market/indices')
          .then(res => res.ok ? res.json() : null)
          .then(indicesData => {
            if (indicesData) {
              if (indicesData.nifty50) {
                setNifty50(prev => {
                  // Only update if value changed to trigger re-render
                  if (prev.value !== indicesData.nifty50.value) {
                    console.log('Nifty50 updated:', indicesData.nifty50.value);
                    return indicesData.nifty50;
                  }
                  return prev;
                });
              }
              if (indicesData.sensex) {
                setSensex(prev => {
                  if (prev.value !== indicesData.sensex.value) {
                    console.log('Sensex updated:', indicesData.sensex.value);
                    return indicesData.sensex;
                  }
                  return prev;
                });
              }
            }
          })
          .catch(() => {});
      }, 1000);
      
      // Update today's stocks every 1 second for real-time price updates
      const stocksInterval = setInterval(() => {
        fetch('/api/market/today-stocks')
          .then(res => res.ok ? res.json() : null)
          .then(stocksData => {
            if (stocksData) {
              setTodayStocks(prev => {
                // Force update to trigger re-render
                return { ...stocksData };
              });
            }
          })
          .catch(() => {});
      }, 1000);
      
      // Update news, FII, mood every 1 second for real-time updates
      const publicDataInterval = setInterval(() => {
        console.log('Updating public data...');
        
        fetch('/api/news/events')
          .then(res => res.ok ? res.json() : null)
          .then(newsData => {
            if (newsData?.events && Array.isArray(newsData.events)) {
              console.log(`Updating news: ${newsData.events.length} events`);
              setNewsEvents(newsData.events);
            }
          })
          .catch(() => {});
        
        fetch('/api/market/intelligence')
          .then(res => res.ok ? res.json() : null)
          .then(intelData => {
            if (intelData?.fiiDii?.fii) {
              setFiiDiiData({
                type: 'FII',
                buy: intelData.fiiDii.fii.buy || 0,
                sell: intelData.fiiDii.fii.sell || 0,
                net: intelData.fiiDii.fii.net || 0,
              });
            }
          })
          .catch(() => {});
        
        fetch('/api/market/mood')
          .then(res => res.ok ? res.json() : null)
          .then(moodData => {
            if (moodData?.mood) {
              setMarketMood(moodData.mood);
            }
          })
          .catch(() => {});
      }, 1000);
      
      // Update full data every 10 seconds if authenticated
      const fullInterval = authenticated && kiteToken ? setInterval(() => {
        fetchData();
      }, 1000) : null;
      
        return () => {
          clearInterval(indicesInterval);
          clearInterval(stocksInterval);
          clearInterval(publicDataInterval);
          if (fullInterval) clearInterval(fullInterval);
        };
  }, [authenticated, kiteToken]);

  useEffect(() => {
    // Build queue when data changes - work even without full authentication for public data
    buildNotificationQueue();
  }, [todayStocks, newsEvents, fiiDiiData, marketMood, authenticated]);

  // Prefill chat input with market analysis prompt when market data is available
  useEffect(() => {
    if (authenticated && marketMood && todayStocks.gainers.length > 0 && chatMessages.length === 0 && !chatInput) {
      const prefillMessage = `Based on today's market conditions, tell me what to buy or sell. Please do a proper technical and fundamental analysis before telling me the answer.`;
      setChatInput(prefillMessage);
    }
  }, [authenticated, marketMood, todayStocks.gainers.length, chatMessages.length, chatInput]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages]);

  // Periodically evaluate and generate fresh notifications every minute
  useEffect(() => {
    const evaluationInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastEval = now - lastNotificationEvaluation.current;
      
      // Evaluate every 60 seconds (1 minute) for fresh notifications
      if (timeSinceLastEval >= 60000) {
        console.log('Evaluating fresh notifications...');
        lastNotificationEvaluation.current = now;
        
        // Clear old shown notifications (keep only last 30 minutes)
        const thirtyMinutesAgo = now - (30 * 60 * 1000);
        // Reset shownNotificationIds periodically to allow re-showing after 30 minutes
        if (shownNotificationIds.current.size > 50) {
          shownNotificationIds.current.clear();
        }
        
        // Rebuild notification queue with fresh data
        buildNotificationQueue();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(evaluationInterval);
  }, [todayStocks, newsEvents, fiiDiiData, marketMood]);

  useEffect(() => {
    // Start notification cycling - restart if queue changes significantly
    if (notificationQueue.current.length > 0) {
      // If not cycling, start cycling
      if (!isCyclingRef.current) {
        console.log(`Starting notification cycle with ${notificationQueue.current.length} notifications`);
        cycleNotifications();
      } else {
        // If already cycling but queue changed significantly, restart cycle
        const currentQueueSize = notificationQueue.current.length;
        if (currentQueueSize > 0 && currentNotificationIndex.current >= currentQueueSize) {
          console.log(`Queue updated, restarting cycle with ${currentQueueSize} notifications`);
          currentNotificationIndex.current = 0;
          // Don't restart if already showing a notification, let it finish
        }
      }
    } else {
      console.log('Notification queue is empty, will retry when data loads');
      // Retry after a short delay if queue is empty
      const retryTimeout = setTimeout(() => {
        if (notificationQueue.current.length > 0 && !isCyclingRef.current) {
          console.log(`Retrying notification cycle with ${notificationQueue.current.length} notifications`);
          cycleNotifications();
        }
      }, 2000);
      return () => clearTimeout(retryTimeout);
    }
  }, [notificationQueueUpdated, notification]);

  const cycleNotifications = () => {
    if (notificationQueue.current.length === 0) {
      isCyclingRef.current = false;
      return;
    }
    
    // Start cycling if not already cycling
    if (!isCyclingRef.current) {
      isCyclingRef.current = true;
      
      const showNext = () => {
        if (notificationQueue.current.length === 0) {
          isCyclingRef.current = false;
          return;
        }
        
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        
        // Reset index if it's beyond queue length
        if (currentNotificationIndex.current >= notificationQueue.current.length) {
          currentNotificationIndex.current = 0;
        }
        
        const notification = notificationQueue.current[currentNotificationIndex.current % notificationQueue.current.length];
        setNotification(notification);
        console.log(`Showing notification ${currentNotificationIndex.current + 1}/${notificationQueue.current.length}: ${notification.title}`);
        
        // Auto-dismiss after 30 seconds
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null);
          notificationTimeoutRef.current = setTimeout(() => {
            currentNotificationIndex.current++;
            showNext();
          }, 1000); // 1 second gap between notifications
        }, 30000); // 30 seconds display duration
      };
      
      showNext();
    }
  };

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('Token found, setting authenticated state');
          setKiteToken(data.token);
          setAuthenticated(true);
          return;
        }
      }
      console.log('No token found, redirecting to OAuth');
      window.location.href = '/api/oauth/authorize';
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/api/oauth/authorize';
    }
  };

  // Check if market is open (9:15 AM - 3:30 PM IST)
  const isMarketOpen = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTime = hours * 60 + minutes;
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    const dayOfWeek = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5 && currentTime >= marketOpen && currentTime <= marketClose;
  };

  // Get daily count for BUY/SELL from localStorage
  const getDailyCount = (type: 'BUY' | 'SELL') => {
    const key = `daily_${type}_count_${new Date().toDateString()}`;
    const count = parseInt(localStorage.getItem(key) || '0');
    // Reset sentNotificationsToday if it's a new day
    const lastReset = localStorage.getItem('last_notification_reset');
    if (lastReset !== new Date().toDateString()) {
      sentNotificationsToday.current.clear();
      localStorage.setItem('last_notification_reset', new Date().toDateString());
    }
    return count;
  };

  // Increment daily count
  const incrementDailyCount = (type: 'BUY' | 'SELL') => {
    const key = `daily_${type}_count_${new Date().toDateString()}`;
    const current = getDailyCount(type);
    localStorage.setItem(key, (current + 1).toString());
  };

  // Check if notification was already sent today
  const wasNotificationSentToday = (notificationId: string) => {
    return sentNotificationsToday.current.has(notificationId);
  };

  // Mark notification as sent
  const markNotificationSent = (notificationId: string) => {
    sentNotificationsToday.current.add(notificationId);
  };

  const buildNotificationQueue = () => {
    const queue: Notification[] = [];
    const marketOpen = isMarketOpen();
    const now = Date.now();
    
    console.log('Building notification queue, marketOpen:', marketOpen, 'todayStocks:', todayStocks.gainers.length, 'newsEvents:', newsEvents.length, 'fiiDiiData:', fiiDiiData);
    
    // Helper to check if notification was shown recently (last 30 minutes)
    const wasShownRecently = (notificationId: string) => {
      return shownNotificationIds.current.has(notificationId);
    };
    
    // Helper to mark notification as shown
    const markAsShown = (notificationId: string) => {
      shownNotificationIds.current.add(notificationId);
    };
    
    // Save notification to daily history
    const saveToDailyHistory = (notification: Notification) => {
      const today = new Date().toDateString();
      const key = `notifications_${today}`;
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({
          ...notification,
          id: notification.id,
          timestamp: notification.timestamp.toISOString(),
        });
        // Keep only last 200 notifications per day
        const recent = existing.slice(-200);
        localStorage.setItem(key, JSON.stringify(recent));
      } catch (e) {
        console.error('Error saving notification to history:', e);
      }
    };

    // Generate BUY/SELL recommendations during trading hours
    if (marketOpen && todayStocks.gainers.length > 0) {
      const buyCount = getDailyCount('BUY');
      const sellCount = getDailyCount('SELL');
      const maxBuy = 10;
      const maxSell = 10;

      // Generate BUY recommendations (up to 10 per day) - always generate fresh ones
      if (buyCount < maxBuy) {
        // 1. Strong gainers (high momentum) - lower threshold to get more notifications
        const strongGainers = todayStocks.gainers.filter(s => s.changePercent > 0.5).slice(0, Math.min(5, maxBuy - buyCount));
        strongGainers.forEach((stock, idx) => {
          if (buyCount + idx < maxBuy) {
            const notificationId = `buy-gainer-${stock.symbol}-${new Date().toDateString()}`;
            // Don't check wasNotificationSentToday - generate fresh notifications each evaluation
            const suggestedQty = stock.price > 1000 ? 10 : stock.price > 500 ? 20 : 50;
            const stopLoss = stock.price * 0.95; // -5% stop-loss
            const target1 = stock.price * 1.10; // +10% target
            const target2 = stock.price * 1.15; // +15% target
            
            const notification: Notification = {
              id: `${notificationId}-${now}-${idx}`,
              type: 'BUY',
              symbol: stock.symbol,
              title: `📈 BUY Signal: ${stock.symbol}`,
              message: `${stock.symbol} up ${stock.changePercent.toFixed(2)}% - Strong momentum! 💡 Recommendation: Buy ${suggestedQty} shares @ ₹${stock.price.toFixed(2)} (~₹${(stock.price * suggestedQty).toFixed(0)}). Stop-Loss: ₹${stopLoss.toFixed(2)} (-5%). Targets: ₹${target1.toFixed(2)} (+10%) & ₹${target2.toFixed(2)} (+15%).`,
              color: '#00FF80',
              timestamp: new Date(),
              quantity: suggestedQty,
            };
            queue.push(notification);
            saveToDailyHistory(notification);
            incrementDailyCount('BUY');
          }
        });

        // 2. Near 52W Low (oversold opportunities)
        const near52WLow = todayStocks.near52WLow.filter(s => s.changePercent < -0.3).slice(0, Math.min(3, maxBuy - getDailyCount('BUY')));
        near52WLow.forEach((stock, idx) => {
          if (getDailyCount('BUY') + idx < maxBuy) {
            const notificationId = `buy-52wlow-${stock.symbol}-${new Date().toDateString()}`;
            const suggestedQty = stock.price > 1000 ? 10 : stock.price > 500 ? 20 : 50;
            const stopLoss = stock.price * 0.93; // -7% stop-loss
            const target = stock.price * 1.12; // +12% target
            
            const notification: Notification = {
              id: `${notificationId}-${now}-${idx}`,
              type: 'BUY',
              symbol: stock.symbol,
              title: `📈 BUY Opportunity: ${stock.symbol}`,
              message: `${stock.symbol} near 52W low (${stock.changePercent.toFixed(2)}%) - Possible oversold! 💡 Recommendation: Buy ${suggestedQty} shares @ ₹${stock.price.toFixed(2)} (~₹${(stock.price * suggestedQty).toFixed(0)}). Stop-Loss: ₹${stopLoss.toFixed(2)} (-7%). Target: ₹${target.toFixed(2)} (+12%). Check fundamentals first.`,
              color: '#00FF80',
              timestamp: new Date(),
              quantity: suggestedQty,
            };
            queue.push(notification);
            saveToDailyHistory(notification);
            incrementDailyCount('BUY');
          }
        });

        // 3. Most Active with positive momentum
        const activePositives = todayStocks.mostActive.filter(s => s.changePercent > 0.3).slice(0, Math.min(3, maxBuy - getDailyCount('BUY')));
        activePositives.forEach((stock, idx) => {
          if (getDailyCount('BUY') + idx < maxBuy) {
            const notificationId = `buy-active-${stock.symbol}-${new Date().toDateString()}`;
            const suggestedQty = stock.price > 1000 ? 10 : stock.price > 500 ? 20 : 50;
            const stopLoss = stock.price * 0.95; // -5% stop-loss
            const target = stock.price * 1.10; // +10% target
            
            const notification: Notification = {
              id: `${notificationId}-${now}-${idx}`,
              type: 'BUY',
              symbol: stock.symbol,
              title: `📈 BUY Signal: ${stock.symbol}`,
              message: `${stock.symbol} active +${stock.changePercent.toFixed(2)}% - High volume confirms trend! 💡 Recommendation: Buy ${suggestedQty} shares @ ₹${stock.price.toFixed(2)} (~₹${(stock.price * suggestedQty).toFixed(0)}). Stop-Loss: ₹${stopLoss.toFixed(2)} (-5%). Target: ₹${target.toFixed(2)} (+10%).`,
              color: '#00FF80',
              timestamp: new Date(),
              quantity: suggestedQty,
            };
            queue.push(notification);
            saveToDailyHistory(notification);
            incrementDailyCount('BUY');
          }
        });
      }

      // Generate SELL recommendations (up to 10 per day)
      if (sellCount < maxSell) {
        // 1. Strong losers (weak momentum)
        const strongLosers = todayStocks.losers.filter(s => s.changePercent < -0.5).slice(0, Math.min(5, maxSell - sellCount));
        strongLosers.forEach((stock, idx) => {
          if (sellCount + idx < maxSell) {
            const notificationId = `sell-loser-${stock.symbol}-${new Date().toDateString()}`;
            const stopLoss = stock.price * 1.05; // +5% stop-loss if holding
            
            const notification: Notification = {
              id: `${notificationId}-${now}-${idx}`,
              type: 'SELL',
              symbol: stock.symbol,
              title: `📉 SELL Signal: ${stock.symbol}`,
              message: `${stock.symbol} down ${Math.abs(stock.changePercent).toFixed(2)}% - Weak momentum! 💡 Recommendation: Sell 50% if you own it @ ₹${stock.price.toFixed(2)}. If holding, set stop-loss at ₹${stopLoss.toFixed(2)} (+5%). If fundamentals are strong, wait for support before buying.`,
              color: '#EF4444',
              timestamp: new Date(),
            };
            queue.push(notification);
            saveToDailyHistory(notification);
            incrementDailyCount('SELL');
          }
        });
      }
    }
    
    // Always add educational notifications (work outside market hours too)
    // These generate fresh notifications based on latest data
    // 1. News notifications - show new/important news that hasn't been shown recently
    if (newsEvents.length > 0) {
      // Get news from different time windows to ensure freshness
      const recentNews = newsEvents
        .filter(news => {
          const newsTime = new Date(news.publishedAt).getTime();
          const hoursSincePublished = (now - newsTime) / (1000 * 60 * 60);
          return hoursSincePublished < 24; // Only show news from last 24 hours
        })
        .slice(0, 10); // Get top 10 recent news items
      
      // Show 3-5 most important news items that haven't been shown recently
      recentNews.forEach((news, idx) => {
        const notificationId = `news-${news.id}`;
        if (!wasShownRecently(notificationId)) {
          const sentiment = news.sentiment || 'neutral';
          
          const notification: Notification = {
            id: `${notificationId}-${now}-${idx}`,
            type: 'NEWS',
            title: `📰 ${sentiment === 'positive' ? '📈' : sentiment === 'negative' ? '📉' : '📊'} ${news.title.substring(0, 50)}${news.title.length > 50 ? '...' : ''}`,
            message: `${news.description.substring(0, 200)}${news.description.length > 200 ? '...' : ''} 💡 How to use: ${sentiment === 'positive' ? 'Positive news can drive stock prices up. Consider buying before the crowd reacts, but verify fundamentals first.' : sentiment === 'negative' ? 'Negative news can cause price drops. If you own this stock, consider setting stop-loss. If not, wait for stabilization before buying.' : 'Stay informed about market news. Use this information along with technical analysis to make informed decisions.'}`,
            color: sentiment === 'positive' ? '#00FF80' : sentiment === 'negative' ? '#EF4444' : '#FFA500',
            timestamp: new Date(),
          };
          queue.push(notification);
          saveToDailyHistory(notification);
          markAsShown(notificationId);
          
          // Only add first 5 to avoid overwhelming
          if (queue.filter(n => n.type === 'NEWS').length >= 5) return;
        }
      });
    }
    
    // 2. FII/DII data notifications - show if significant change or every 30 minutes
    if (fiiDiiData && fiiDiiData.net !== 0) {
      const notificationId = `fii-${fiiDiiData.net > 0 ? 'buy' : 'sell'}`;
      const hourKey = Math.floor(now / (30 * 60 * 1000)); // Change every 30 minutes
      const uniqueId = `${notificationId}-${hourKey}`;
      
      if (!wasShownRecently(uniqueId)) {
        const notification: Notification = {
          id: `${uniqueId}-${now}`,
          type: 'FII',
          title: `💰 FII ${fiiDiiData.net > 0 ? 'Net Buying' : 'Net Selling'}: ₹${Math.abs(fiiDiiData.net).toLocaleString('en-IN')} Cr`,
          message: `FII ${fiiDiiData.net > 0 ? 'bought' : 'sold'} ₹${fiiDiiData.buy.toLocaleString('en-IN')} Cr and ${fiiDiiData.net > 0 ? 'sold' : 'bought'} ₹${fiiDiiData.sell.toLocaleString('en-IN')} Cr. Net: ₹${fiiDiiData.net.toLocaleString('en-IN')} Cr. 💡 How to use: ${fiiDiiData.net > 0 ? 'FII buying indicates foreign confidence. Look for stocks they might be buying. However, don\'t blindly follow - do your own research.' : 'FII selling can create buying opportunities if fundamentals are strong. Monitor for oversold conditions.'}`,
          color: fiiDiiData.net > 0 ? '#00FF80' : '#EF4444',
          timestamp: new Date(),
        };
        queue.push(notification);
        saveToDailyHistory(notification);
        markAsShown(uniqueId);
      }
    }
    
    // 3. Top gainers/losers educational notifications - show fresh data every minute
    if (todayStocks.gainers.length > 0) {
      // Show top 3 gainers that haven't been shown recently
      const topGainers = todayStocks.gainers
        .filter(g => g.changePercent > 0.5)
        .slice(0, 3);
      
      topGainers.forEach((gainer, idx) => {
        const notificationId = `gainer-${gainer.symbol}`;
        const minuteKey = Math.floor(now / 60000); // Change every minute
        const uniqueId = `${notificationId}-${minuteKey}`;
        
        if (!wasShownRecently(uniqueId)) {
          const notification: Notification = {
            id: `${uniqueId}-${now}-${idx}`,
            type: 'GAINER',
            symbol: gainer.symbol,
            title: `🚀 Top Gainer: ${gainer.symbol} +${gainer.changePercent.toFixed(2)}%`,
            message: `${gainer.symbol} is up ${gainer.changePercent.toFixed(2)}% today. 💡 How to interpret: Strong momentum can continue, but be cautious of buying at highs. Consider waiting for a pullback or using a trailing stop-loss if you buy.`,
            color: '#00FF80',
            timestamp: new Date(),
          };
          queue.push(notification);
          saveToDailyHistory(notification);
          markAsShown(uniqueId);
        }
      });
    }
    
    if (todayStocks.losers.length > 0) {
      // Show top 3 losers that haven't been shown recently
      const topLosers = todayStocks.losers
        .filter(l => l.changePercent < -0.5)
        .slice(0, 3);
      
      topLosers.forEach((loser, idx) => {
        const notificationId = `loser-${loser.symbol}`;
        const minuteKey = Math.floor(now / 60000); // Change every minute
        const uniqueId = `${notificationId}-${minuteKey}`;
        
        if (!wasShownRecently(uniqueId)) {
          const notification: Notification = {
            id: `${uniqueId}-${now}-${idx}`,
            type: 'LOSER',
            symbol: loser.symbol,
            title: `📉 Top Loser: ${loser.symbol} ${loser.changePercent.toFixed(2)}%`,
            message: `${loser.symbol} is down ${Math.abs(loser.changePercent).toFixed(2)}% today. 💡 How to interpret: Check if it's a temporary dip or fundamental issue. If fundamentals are strong, this could be a buying opportunity. Otherwise, avoid or sell if you own it.`,
            color: '#EF4444',
            timestamp: new Date(),
          };
          queue.push(notification);
          saveToDailyHistory(notification);
          markAsShown(uniqueId);
        }
      });
    }
    
    // 4. Market mood educational notification - show every 10 minutes if changed
    if (marketMood) {
      const minuteKey = Math.floor(now / 600000); // Change every 10 minutes
      const uniqueId = `mood-${marketMood.label}-${minuteKey}`;
      
      if (!wasShownRecently(uniqueId)) {
        const notification: Notification = {
          id: `${uniqueId}-${now}`,
          type: 'EDUCATION',
          title: `📊 Market Mood: ${marketMood.label} (${marketMood.value}/100)`,
          message: `Current market sentiment is ${marketMood.label.toLowerCase()}. 💡 How to use: ${marketMood.value > 70 ? 'High greed can mean overvaluation. Be cautious and take profits. Consider defensive stocks.' : marketMood.value < 30 ? 'High fear can create buying opportunities. Look for quality stocks at discounts, but be patient.' : 'Neutral mood suggests balanced market. Focus on stock-specific fundamentals rather than market sentiment.'}`,
          color: marketMood.color,
          timestamp: new Date(),
        };
        queue.push(notification);
        saveToDailyHistory(notification);
        markAsShown(uniqueId);
      }
    }

    if (!marketOpen) {
      // Outside trading hours - show market closed notification every hour
      const hourKey = Math.floor(now / 3600000);
      const uniqueId = `market-closed-${hourKey}`;
      
      if (!wasShownRecently(uniqueId)) {
        const notification: Notification = {
          id: `${uniqueId}-${now}`,
          type: 'EDUCATION',
          title: '⏰ Market Closed',
          message: 'Indian stock market is closed. Trading hours: 9:15 AM - 3:30 PM IST (Mon-Fri). BUY/SELL recommendations resume when market opens.',
          color: '#00FF80',
          timestamp: new Date(),
        };
        queue.push(notification);
        saveToDailyHistory(notification);
        markAsShown(uniqueId);
      }
    }

    notificationQueue.current = queue;
    console.log(`Notification queue built with ${queue.length} notifications`);
    // Trigger useEffect to check if we should start cycling
    setNotificationQueueUpdated(prev => prev + 1);
  };

  const fetchData = async () => {
    console.log('fetchData called, kiteToken:', kiteToken ? 'present' : 'missing');
    try {
      let currentToken = kiteToken;
      
      if (!currentToken) {
        console.log('Token not in state, fetching from API...');
        // Try to get token if not set
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            currentToken = data.token;
            setKiteToken(data.token);
          } else {
            console.log('No token in response, redirecting to OAuth');
            window.location.href = '/api/oauth/authorize';
            return;
          }
        } else {
          console.log('Token fetch failed, redirecting to OAuth');
          window.location.href = '/api/oauth/authorize';
          return;
        }
      }

      // Add timeout wrapper for each fetch
      const fetchWithTimeout = async (url: string, timeout = 10000) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          console.warn(`Timeout or error fetching ${url}:`, error);
          return null;
        }
      };

      if (!currentToken) {
        console.error('No token available');
        setLoading(false);
        return;
      }

      const [tickerRes, moodRes, stocksRes, newsRes, intelRes, portfolioRes, indicesRes] = await Promise.allSettled([
            fetchWithTimeout(`/api/market/ticker?token=${encodeURIComponent(currentToken)}`),
            fetchWithTimeout('/api/market/mood'),
            fetchWithTimeout(`/api/market/today-stocks?token=${encodeURIComponent(currentToken)}`),
            fetchWithTimeout(`/api/news/events?token=${encodeURIComponent(currentToken)}`),
            fetchWithTimeout('/api/market/intelligence'),
            fetchWithTimeout(`/api/portfolio/overview?token=${encodeURIComponent(currentToken)}`),
            fetchWithTimeout('/api/market/indices'),
          ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

      if (tickerRes && tickerRes.ok) {
        try {
          const tickerData = await tickerRes.json();
          const priceItems = tickerData.ticker?.filter((t: any) => t.type === 'price') || [];
          setTicker(priceItems.map((t: any) => ({
            symbol: t.symbol || '',
            price: parseFloat(t.value?.replace('₹', '').replace(',', '') || '0') || 0,
            change: t.change || 0,
            changePercent: t.changePercent || 0,
          })).slice(0, 20));
        } catch (e) {
          console.error('Error parsing ticker data:', e);
        }
      }

      if (moodRes && moodRes.ok) {
        try {
          const moodData = await moodRes.json();
          setMarketMood(moodData.mood);
        } catch (e) {
          console.error('Error parsing mood data:', e);
        }
      }

      if (stocksRes && stocksRes.ok) {
        try {
          const stocksData = await stocksRes.json();
          setTodayStocks(stocksData);
        } catch (e) {
          console.error('Error parsing stocks data:', e);
        }
      }

      if (newsRes && newsRes.ok) {
        try {
          const newsData = await newsRes.json();
          console.log('News data received:', newsData);
          if (newsData.events && Array.isArray(newsData.events)) {
            console.log(`Setting ${newsData.events.length} news events`);
            setNewsEvents(newsData.events);
          } else {
            console.warn('News events format unexpected:', newsData);
            setNewsEvents([]);
          }
        } catch (e) {
          console.error('Error parsing news events:', e);
          setNewsEvents([]);
        }
      } else {
        console.warn('News fetch failed or not ok:', newsRes?.status, newsRes);
        // Try to fetch news without token (public API)
        try {
          const publicNewsRes = await fetchWithTimeout('/api/news/events');
          if (publicNewsRes && publicNewsRes.ok) {
            const publicNewsData = await publicNewsRes.json();
            if (publicNewsData.events && Array.isArray(publicNewsData.events)) {
              console.log(`Setting ${publicNewsData.events.length} news events from public API`);
              setNewsEvents(publicNewsData.events);
            }
          }
        } catch (e) {
          console.error('Error fetching public news:', e);
        }
      }

      if (intelRes && intelRes.ok) {
        try {
          const intelData = await intelRes.json();
          console.log('Intel data received:', intelData);
          if (intelData.fiiDii && intelData.fiiDii.fii) {
            const fiiData = {
              type: 'FII' as const,
              buy: intelData.fiiDii.fii.buy || 0,
              sell: intelData.fiiDii.fii.sell || 0,
              net: intelData.fiiDii.fii.net || 0,
            };
            console.log('FII/DII data set:', fiiData);
            setFiiDiiData(fiiData);
          } else if (intelData.fiiDii) {
            // Try alternative structure
            const fii = intelData.fiiDii;
            setFiiDiiData({
              type: 'FII',
              buy: fii.buy || fii.fii?.buy || 0,
              sell: fii.sell || fii.fii?.sell || 0,
              net: fii.net || fii.fii?.net || 0,
            });
          } else {
            console.warn('No FII/DII data in response:', intelData);
            // Use fallback if no data
            setFiiDiiData({
              type: 'FII',
              buy: 5000,
              sell: 4800,
              net: 200,
            });
          }
        } catch (e) {
          console.error('Error parsing intel data:', e);
          // Use fallback on error
          setFiiDiiData({
            type: 'FII',
            buy: 5000,
            sell: 4800,
            net: 200,
          });
        }
      } else {
        console.warn('Intel fetch failed or not ok:', intelRes?.status);
        // Use fallback if fetch failed
        setFiiDiiData({
          type: 'FII',
          buy: 5000,
          sell: 4800,
          net: 200,
        });
      }

      if (portfolioRes && portfolioRes.ok) {
        try {
          const portfolioData = await portfolioRes.json();
          console.log('Portfolio data received:', portfolioData);
          if (portfolioData && !portfolioData.error) {
            console.log('Setting portfolio summary:', {
              totalValue: portfolioData.totalValue,
              totalPnL: portfolioData.totalPnL,
              totalPnLPercent: portfolioData.totalPnLPercent,
            });
            setPortfolioSummary({
              totalValue: portfolioData.totalValue || 0,
              totalPnL: portfolioData.totalPnL || 0,
              totalPnLPercent: portfolioData.totalPnLPercent || 0,
              dayChange: portfolioData.dayChange || 0,
              dayChangePercent: portfolioData.dayChangePercent || 0,
            });
          } else {
            console.warn('Portfolio data has error:', portfolioData);
          }
        } catch (e) {
          console.error('Error parsing portfolio data:', e);
        }
      } else {
        console.warn('Portfolio fetch failed or not ok:', portfolioRes?.status, portfolioRes);
      }

      if (indicesRes && indicesRes.ok) {
        try {
          const indicesData = await indicesRes.json();
          if (indicesData.nifty50) setNifty50(indicesData.nifty50);
          if (indicesData.sensex) setSensex(indicesData.sensex);
        } catch (e) {
          console.error('Error parsing indices data:', e);
          // Don't set fallback values, let real-time updates handle it
        }
      } else {
        // Only set fallback if we can't fetch - real-time interval will update
        if (nifty50.value === 0 && sensex.value === 0) {
          setNifty50({ value: 25613, change: 15.5, changePercent: 0.06 });
          setSensex({ value: 83760, change: 300, changePercent: 0.36 });
        }
      }

      // Build notification queue after data is fetched
      try {
        buildNotificationQueue();
      } catch (e) {
        console.error('Error building notification queue:', e);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
    }
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

      const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !kiteToken || chatLoading) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        
        // Auto-scroll to bottom when user sends message
        setTimeout(() => {
          chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        setChatLoading(true);

        try {
          // Build conversation history for context
          const conversationHistory = chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          }));

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: userMessage, 
              token: kiteToken,
              conversationHistory: conversationHistory,
            }),
          });

          const data = await response.json();
          if (data.error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
          } else {
            const newMessage: any = { 
              role: 'assistant' as const, 
              content: data.response, 
              suggestions: data.suggestions 
            };
            
            // If trade was executed, add that info
            if (data.executed) {
              newMessage.executed = data.executed;
            }
            
            setChatMessages(prev => [...prev, newMessage]);
            
            // Auto-scroll to bottom when new message arrives
            setTimeout(() => {
              chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            // If trade was executed, refresh portfolio data
            if (data.executed) {
              setTimeout(() => {
                fetchData();
              }, 2000);
            }
          }
        } catch (error) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
        } finally {
          setChatLoading(false);
        }
      };

      const handleTrade = async () => {
        if (!tradeSymbol || !tradeQuantity || !kiteToken || tradeLoading) return;

        setTradeLoading(true);
        try {
          const response = await fetch('/api/trade/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: kiteToken,
              symbol: tradeSymbol,
              exchange: 'NSE',
              quantity: parseInt(tradeQuantity),
              transactionType: tradeType,
              orderType: tradeOrderType,
              product: tradeProduct,
              price: tradePrice || undefined,
            }),
          });

          const data = await response.json();
          if (data.error) {
            alert(`Error: ${data.error}`);
          } else {
            alert(`Success: ${data.message}`);
            setTradeModalOpen(false);
            setTradeSymbol('');
            setTradeQuantity('');
            setTradePrice('');
          }
        } catch (error) {
          alert('Failed to place order. Please try again.');
        } finally {
          setTradeLoading(false);
        }
      };

      const handleSearchSymbol = async (query: string) => {
        if (!query.trim() || !kiteToken) {
          setSearchResults([]);
          return;
        }

        try {
          const response = await fetch(`/api/trade/search-instruments?token=${encodeURIComponent(kiteToken)}&query=${encodeURIComponent(query)}`);
          const data = await response.json();
          if (data.instruments) {
            setSearchResults(data.instruments);
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      };


  const getMoodGaugeRotation = () => {
    if (!marketMood) return 0;
    return (marketMood.value / 100) * 180 - 90;
  };

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen netsec-bg flex items-center justify-center">
        <div className="text-center">
          <div className="neon-green text-xl mb-4 neon-glow">Connecting to Zerodha...</div>
          <div className="text-gray-400 text-sm">
            {!authenticated ? 'Redirecting to authentication...' : 'Loading market data...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Portify - Stock Market Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Netsec Style Push Notification */}
      {notification && (
        <div 
          className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl max-w-sm animate-slide-in-right border border-green-500"
          style={{ 
            backgroundColor: '#222225',
            borderColor: notification.color,
            color: notification.color,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-bold text-lg mb-2" style={{ color: notification.color }}>
                {notification.title}
              </div>
              <div className="text-sm leading-relaxed text-gray-300">
                {notification.message}
              </div>
              {notification.quantity && (
                <div className="mt-2 text-xs opacity-90 font-medium text-gray-400">
                  💰 Suggested Quantity: {notification.quantity} shares
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (notificationTimeoutRef.current) {
                  clearTimeout(notificationTimeoutRef.current);
                }
                setNotification(null);
                currentNotificationIndex.current++;
                setTimeout(() => {
                  isCyclingRef.current = false;
                  cycleNotifications();
                }, 1000);
              }}
              className="ml-2 hover:opacity-70 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen netsec-bg neon-green-text">
        {/* Top Scrolling Ticker Bar */}
        <div className="bg-gray-900 border-b border-gray-800 py-2 overflow-hidden">
          <div className="flex space-x-6 animate-scroll">
            {ticker.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 whitespace-nowrap">
                <span className="font-medium neon-green">{item.symbol}</span>
                <span className="neon-green-text">{formatCurrency(item.price)}</span>
                <span className={item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {item.changePercent >= 0 ? '▲' : '▼'} {formatPercent(item.changePercent)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold neon-green neon-glow">PORTIFY</h1>
              <div className="flex items-center space-x-4">
              <button 
                onClick={() => setTradeModalOpen(true)} 
                className="px-4 py-2 neon-bg-button rounded font-medium"
              >
                📈 Trade
              </button>
              <Link href="/portfolio" className="px-4 py-2 neon-bg-button rounded font-medium">
                Portfolio
              </Link>
              <Link href="/notifications" className="px-4 py-2 neon-bg-button rounded font-medium">
                📬 Notifications
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Market and Sectors Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold neon-green neon-glow">Market and sectors</h2>
              <a href="#" className="neon-green text-sm hover:neon-pulse">See All</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* PORTFOLIO */}
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-sm text-gray-400 mb-2">PORTFOLIO</div>
                <div className="text-2xl font-bold mb-1 neon-green">{formatCurrency(portfolioSummary.totalValue)}</div>
                <div className="flex items-center space-x-2">
                  <span className={portfolioSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {portfolioSummary.totalPnL >= 0 ? '▲' : '▼'} {formatPercent(portfolioSummary.totalPnLPercent)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Day: <span className={portfolioSummary.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {portfolioSummary.dayChange >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.dayChange)} ({formatPercent(portfolioSummary.dayChangePercent)})
                  </span>
                </div>
              </div>

              {/* NIFTY 50 */}
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-sm text-gray-400 mb-2">NIFTY 50</div>
                <div className="text-2xl font-bold mb-1 neon-green">{formatCurrency(nifty50.value)}</div>
                <div className="flex items-center space-x-2">
                  <span className={nifty50.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {nifty50.changePercent >= 0 ? '▲' : '▼'} {formatPercent(nifty50.changePercent)}
                  </span>
                </div>
              </div>

              {/* SENSEX */}
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-sm text-gray-400 mb-2">SENSEX</div>
                <div className="text-2xl font-bold mb-1 neon-green">{formatCurrency(sensex.value)}</div>
                <div className="flex items-center space-x-2">
                  <span className={sensex.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {sensex.changePercent >= 0 ? '▲' : '▼'} {formatPercent(sensex.changePercent)}
                  </span>
                </div>
              </div>

              {/* MARKET MOOD */}
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-sm text-gray-400 mb-2">MARKET MOOD</div>
                <div className="relative h-24 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="#333333"
                      strokeWidth="8"
                    />
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke={marketMood?.color || '#00FF80'}
                      strokeWidth="8"
                      strokeDasharray={`${marketMood?.value || 50} 100`}
                    />
                    <line
                      x1="100"
                      y1="80"
                      x2="100"
                      y2="20"
                      stroke={marketMood?.color || '#00FF80'}
                      strokeWidth="3"
                      transform={`rotate(${getMoodGaugeRotation()} 100 80)`}
                    />
                  </svg>
                </div>
                <div className="text-xl font-bold text-center neon-green" style={{ color: marketMood?.color || '#00FF80' }}>
                  {marketMood?.label || 'Neutral'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Today's Stocks & News */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Stocks */}
              <div className="neon-bg-card rounded-lg">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold neon-green neon-glow">Today&apos;s stocks</h2>
                    <span className="text-sm text-gray-400">Large Cap</span>
                  </div>
                  <div className="flex space-x-2 flex-wrap">
                    {(['gainers', 'losers', 'mostActive', 'near52WHigh', 'near52WLow'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStockFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          stockFilter === filter
                            ? 'neon-bg-button-selected'
                            : 'neon-bg-button'
                        }`}
                      >
                        {filter === 'gainers' && '📈 Gainers'}
                        {filter === 'losers' && '📉 Losers'}
                        {filter === 'mostActive' && '🔥 Most Active'}
                        {filter === 'near52WHigh' && '⬆️ 52W High'}
                        {filter === 'near52WLow' && '⬇️ 52W Low'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Header row for columns */}
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10"></div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-400 uppercase">Stock</div>
                      </div>
                    </div>
                    <div className="text-right mr-4 min-w-[100px]">
                      <div className="text-xs font-medium text-gray-400 uppercase">Price</div>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-700">
                  {(todayStocks[stockFilter] || []).slice(0, 10).map((stock, idx) => (
                    <div key={`${stockFilter}-${stock.symbol}-${idx}`} className="p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-800 border border-green-500 flex items-center justify-center text-sm font-bold neon-green">
                            {stock.symbol.substring(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium neon-green">{stock.symbol}</div>
                            <div className="text-sm text-gray-400">{stock.name}</div>
                          </div>
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-medium neon-green-text">{formatCurrency(stock.price)}</div>
                          <div className={stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {stock.changePercent >= 0 ? '▲' : '▼'} {formatPercent(stock.changePercent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's News and Events */}
              <div className="neon-bg-card rounded-lg">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 neon-green neon-glow">Today&apos;s news and events</h2>
                  <div className="flex space-x-2 flex-wrap">
                    {(['all', 'news', 'macro', 'earnings', 'corp_action', 'dividend'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setNewsFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          newsFilter === filter
                            ? 'neon-bg-button-selected'
                            : 'neon-bg-button'
                        }`}
                      >
                        {filter === 'all' && '🎲 All'}
                        {filter === 'news' && '🌐 News'}
                        {filter === 'macro' && '📊 Macro'}
                        {filter === 'earnings' && '👍 Earnings'}
                        {filter === 'corp_action' && '📄 Corp Action'}
                        {filter === 'dividend' && '💰 Dividends'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-gray-700">
                  {newsEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <p>No news events available at the moment.</p>
                      <p className="mt-2 text-sm">News will appear here when available.</p>
                      <p className="mt-1 text-xs text-gray-600">Check browser console for details.</p>
                    </div>
                  ) : (
                    (newsFilter === 'all' 
                      ? newsEvents 
                      : newsEvents.filter(e => e.type === newsFilter)
                    ).slice(0, 20).map((event) => (
                      <div key={event.id} className="p-4 hover:bg-gray-800 transition-colors">
                        {event.symbol && (
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-gray-800 border border-green-500 rounded text-xs font-medium neon-green">
                              {event.symbol}
                            </span>
                            {event.sentiment && (
                              <span className="text-xs">
                                {event.sentiment === 'positive' && '📈'}
                                {event.sentiment === 'negative' && '📉'}
                                {event.sentiment === 'neutral' && '➡️'}
                              </span>
                            )}
                          </div>
                        )}
                        <a
                          href={event.metadata?.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neon-green hover:neon-pulse font-medium block mb-2"
                        >
                          {event.title}
                        </a>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{event.source}</span>
                          <span>{new Date(event.publishedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="neon-bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3 neon-green neon-glow">Near 52W lows</h3>
                <div className="space-y-2">
                  {todayStocks.near52WLow.slice(0, 5).map((stock, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="neon-green-text">{stock.symbol}</span>
                      <span className="text-red-400">{formatPercent(stock.changePercent)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="neon-bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3 neon-green neon-glow">Momentum Monsters</h3>
                <div className="space-y-2">
                  {todayStocks.gainers.slice(0, 5).map((stock, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="neon-green-text">{stock.symbol}</span>
                      <span className="text-green-400">{formatPercent(stock.changePercent)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="neon-bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3 neon-green neon-glow">Latest deals by FII</h3>
                <div className="text-sm text-gray-400">
                  {fiiDiiData ? (
                    <div>
                      <div className={fiiDiiData.net >= 0 ? 'text-green-400' : 'text-red-400'}>
                        Net: ₹{(fiiDiiData.net / 100).toFixed(2)} Cr
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Buy: ₹{(fiiDiiData.buy / 100).toFixed(2)} Cr
                      </div>
                      <div className="text-xs text-gray-500">
                        Sell: ₹{(fiiDiiData.sell / 100).toFixed(2)} Cr
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      <p>Loading FII data...</p>
                      <p className="mt-1 text-xs">Data updates every 10 seconds</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Icon Button - Minimized */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 neon-bg-button rounded-full flex items-center justify-center shadow-2xl z-50 hover:neon-pulse transition-all"
          style={{ boxShadow: '0 0 20px #00FF80' }}
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Chatbox - Expanded */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] neon-bg-card rounded-lg border border-green-500 flex flex-col shadow-2xl z-50 animate-slide-in-right">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold neon-green neon-glow">💬 Portfolio Assistant</h3>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatMessagesEndRef}>
            {chatMessages.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-8">
                Ask me anything about your portfolio, buy/sell suggestions, or market analysis!
              </div>
            )}
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-green-500 text-black' 
                          : msg.executed 
                          ? 'bg-green-900 text-green-100 border-2 border-green-400'
                          : 'bg-gray-800 text-gray-200 border border-green-500'
                      }`}>
                        {msg.executed && (
                          <div className="mb-2 pb-2 border-b border-green-600">
                            <div className="text-xs font-bold text-green-300 mb-1">✅ ORDER EXECUTED</div>
                            <div className="text-xs">
                              {msg.executed.action} {msg.executed.quantity} shares of {msg.executed.symbol}
                              {msg.executed.price && ` at ₹${msg.executed.price}`}
                              {msg.executed.orderId && ` (Order ID: ${msg.executed.orderId})`}
                            </div>
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.suggestions.map((sug, sugIdx) => (
                              <button
                                key={sugIdx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (sug.symbol && sug.quantity) {
                                    setTradeSymbol(sug.symbol.toUpperCase());
                                    setTradeQuantity(sug.quantity.toString());
                                    setTradeType(sug.action === 'BUY' ? 'BUY' : 'SELL');
                                    setTradeOrderType('MARKET');
                                    setTradeProduct('CNC');
                                    setTradePrice('');
                                    setTradeModalOpen(true);
                                    setChatOpen(false);
                                  }
                                }}
                                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-left border border-green-500 cursor-pointer transition-colors"
                              >
                                {sug.action} {sug.quantity} shares of {sug.symbol}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-green-500 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about portfolio, buy/sell suggestions..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-green-500 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 neon-bg-button rounded font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="neon-bg-card rounded-lg border border-green-500 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold neon-green neon-glow">Place Order</h2>
              <button 
                onClick={() => setTradeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Symbol Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <input
                  type="text"
                  value={tradeSymbol}
                  onChange={(e) => {
                    setTradeSymbol(e.target.value);
                    handleSearchSymbol(e.target.value);
                  }}
                  placeholder="Type symbol (e.g., RELIANCE)"
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-green-500 rounded bg-gray-900">
                    {searchResults.map((inst, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTradeSymbol(inst.symbol);
                          setSearchResults([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 border-b border-gray-700 last:border-b-0"
                      >
                        {inst.symbol} - {inst.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Buy/Sell Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTradeType('BUY')}
                    className={`flex-1 px-4 py-2 rounded font-medium ${
                      tradeType === 'BUY' 
                        ? 'bg-green-500 text-black' 
                        : 'neon-bg-button'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setTradeType('SELL')}
                    className={`flex-1 px-4 py-2 rounded font-medium ${
                      tradeType === 'SELL' 
                        ? 'bg-red-500 text-black' 
                        : 'neon-bg-button'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                <input
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTradeOrderType('MARKET')}
                    className={`flex-1 px-4 py-2 rounded font-medium ${
                      tradeOrderType === 'MARKET' 
                        ? 'neon-bg-button-selected' 
                        : 'neon-bg-button'
                    }`}
                  >
                    MARKET
                  </button>
                  <button
                    onClick={() => setTradeOrderType('LIMIT')}
                    className={`flex-1 px-4 py-2 rounded font-medium ${
                      tradeOrderType === 'LIMIT' 
                        ? 'neon-bg-button-selected' 
                        : 'neon-bg-button'
                    }`}
                  >
                    LIMIT
                  </button>
                </div>
              </div>

              {/* Price (for LIMIT orders) */}
              {tradeOrderType === 'LIMIT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.05"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    placeholder="Enter limit price"
                    className="w-full px-3 py-2 bg-gray-800 border border-green-500 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
                <select
                  value={tradeProduct}
                  onChange={(e) => setTradeProduct(e.target.value as 'CNC' | 'MIS' | 'NRML')}
                  className="w-full px-3 py-2 bg-gray-800 border border-green-500 rounded text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="CNC">CNC (Delivery)</option>
                  <option value="MIS">MIS (Intraday)</option>
                  <option value="NRML">NRML (Carry Forward)</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleTrade}
                disabled={tradeLoading || !tradeSymbol || !tradeQuantity || (tradeOrderType === 'LIMIT' && !tradePrice)}
                className={`w-full px-4 py-3 rounded font-medium ${
                  tradeType === 'BUY' 
                    ? 'bg-green-500 text-black hover:bg-green-600' 
                    : 'bg-red-500 text-black hover:bg-red-600'
                } disabled:opacity-50`}
              >
                {tradeLoading ? 'Placing Order...' : `${tradeType} ${tradeQuantity} ${tradeSymbol || 'shares'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
