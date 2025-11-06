import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface PortfolioPosition {
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
}

interface PortfolioOverview {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: PortfolioPosition[];
}

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

interface TechnicalIndicator {
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

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioOverview | null>(null);
  const [indicators, setIndicators] = useState<Record<string, TechnicalIndicator>>({});
  const [dividends, setDividends] = useState<DividendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchPortfolio();
      const interval = setInterval(fetchPortfolio, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setAuthenticated(true);
          return;
        }
      }
      window.location.href = '/api/oauth/authorize';
    } catch (error) {
      window.location.href = '/api/oauth/authorize';
    }
  };

  const fetchPortfolio = async () => {
    try {
      let kiteToken = '';
      try {
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          kiteToken = data.token || '';
        }
      } catch (e) {
        window.location.href = '/api/oauth/authorize';
        return;
      }

      if (!kiteToken) {
        window.location.href = '/api/oauth/authorize';
        return;
      }

      const portfolioRes = await fetch(`/api/portfolio/overview?token=${encodeURIComponent(kiteToken)}`);
      
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        
        if (portfolioData.error && portfolioData.authUrl) {
          window.location.href = '/api/oauth/authorize';
          return;
        }
        
        setPortfolio(portfolioData);

        // Fetch technical indicators
        if (portfolioData.positions?.length > 0) {
          const symbols = portfolioData.positions.map((p: PortfolioPosition) => p.symbol).join(',');
          const indicatorsRes = await fetch(`/api/analysis/technical?symbols=${symbols}&token=${encodeURIComponent(kiteToken)}`);
          
          if (indicatorsRes.ok) {
            const indicatorsData = await indicatorsRes.json();
            const indicatorsMap: Record<string, TechnicalIndicator> = {};
            indicatorsData.indicators.forEach((ind: TechnicalIndicator) => {
              indicatorsMap[ind.symbol] = ind;
            });
            setIndicators(indicatorsMap);
          }
        }
      }

      // Fetch dividend data
      const dividendsRes = await fetch(`/api/portfolio/dividends?token=${encodeURIComponent(kiteToken)}`);
      if (dividendsRes.ok) {
        const dividendsData = await dividendsRes.json();
        setDividends(dividendsData);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-300';
      case 'SELL': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen netsec-bg flex items-center justify-center">
        <div className="text-center">
          <div className="neon-green text-xl mb-4 neon-glow">Loading portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Portfolio - Portify</title>
      </Head>
      <div className="min-h-screen netsec-bg neon-green-text">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold neon-green neon-glow">PORTIFY</h1>
            <div className="flex items-center space-x-4">
              <Link href="/" className="px-4 py-2 neon-bg-button rounded font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Portfolio Summary */}
          {portfolio && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Total Value</div>
                <div className="text-2xl font-bold neon-green">{formatCurrency(portfolio.totalValue)}</div>
              </div>
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Total Invested</div>
                <div className="text-2xl font-bold neon-green">{formatCurrency(portfolio.totalInvested)}</div>
              </div>
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Total P&L</div>
                <div className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(portfolio.totalPnL)} ({formatPercent(portfolio.totalPnLPercent)})
                </div>
              </div>
              <div className="neon-bg-card rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Day Change</div>
                <div className={`text-2xl font-bold ${portfolio.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(portfolio.dayChange)} ({formatPercent(portfolio.dayChangePercent)})
                </div>
              </div>
            </div>
          )}

          {/* Holdings Table */}
          <div className="neon-bg-card rounded-lg">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold neon-green neon-glow">Portfolio Holdings</h2>
              <p className="text-sm text-gray-400 mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Symbol</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">Qty</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">Avg Price</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">Current Price</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">Value</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">P&L</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-300">Day Change</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-300">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio?.positions.map((position) => {
                    const indicator = indicators[position.symbol];
                    return (
                      <tr key={position.symbol} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                        <td className="p-4">
                          <div className="font-medium neon-green">{position.symbol}</div>
                          <div className="text-xs text-gray-400">{position.exchange}</div>
                        </td>
                        <td className="p-4 text-right text-gray-300">{position.quantity}</td>
                        <td className="p-4 text-right text-gray-300">{formatCurrency(position.averagePrice)}</td>
                        <td className="p-4 text-right text-gray-300">{formatCurrency(position.lastPrice)}</td>
                        <td className="p-4 text-right text-gray-300">{formatCurrency(position.currentValue)}</td>
                        <td className={`p-4 text-right ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(position.pnl)} ({formatPercent(position.pnlPercent)})
                        </td>
                        <td className={`p-4 text-right ${position.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(position.dayChangePercent)}
                        </td>
                        <td className="p-4 text-center">
                          {indicator?.recommendation && (
                            <div className="flex flex-col items-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getRecommendationColor(indicator.recommendation)}`}>
                                {indicator.recommendation}
                              </span>
                              {indicator.rsi && (
                                <span className="text-xs text-gray-400 mt-1">
                                  RSI: {indicator.rsi.toFixed(1)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dividend Tracking Section */}
          <div className="neon-bg-card rounded-lg mt-6">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold neon-green neon-glow">Dividend Tracking</h2>
            </div>
            
            {dividends && (
              <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="neon-bg-card rounded-lg p-4 border border-green-500">
                    <div className="text-gray-400 text-sm mb-1">Last Year Total</div>
                    <div className="text-2xl font-bold neon-green">{formatCurrency(dividends.lastYearTotal)}</div>
                  </div>
                  <div className="neon-bg-card rounded-lg p-4 border border-green-500">
                    <div className="text-gray-400 text-sm mb-1">This Year Total</div>
                    <div className="text-2xl font-bold neon-green">{formatCurrency(dividends.thisYearTotal)}</div>
                  </div>
                  <div className="neon-bg-card rounded-lg p-4 border border-green-500">
                    <div className="text-gray-400 text-sm mb-1">This Year Projected</div>
                    <div className="text-2xl font-bold neon-green">{formatCurrency(dividends.thisYearProjected)}</div>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                {dividends.monthlyBreakdown.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold neon-green mb-4">Monthly Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {dividends.monthlyBreakdown.map((month, idx) => (
                        <div key={idx} className="neon-bg-card rounded-lg p-3 border border-gray-700">
                          <div className="text-xs text-gray-400">{month.month} {month.year}</div>
                          <div className="text-lg font-bold neon-green mt-1">{formatCurrency(month.amount)}</div>
                          <div className="text-xs text-gray-500 mt-1">{month.count} dividend{month.count !== 1 ? 's' : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Dividends */}
                {dividends.upcomingDividends.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold neon-green mb-4">Upcoming Dividends</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Symbol</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Ex-Date</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Record Date</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Payment Date</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Amount/Share</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Quantity</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dividends.upcomingDividends.map((div, idx) => (
                            <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                              <td className="p-3">
                                <div className="font-medium neon-green">{div.symbol}</div>
                              </td>
                              <td className="p-3 text-gray-300">{new Date(div.exDate).toLocaleDateString()}</td>
                              <td className="p-3 text-gray-300">{new Date(div.recordDate).toLocaleDateString()}</td>
                              <td className="p-3 text-gray-300">{new Date(div.paymentDate).toLocaleDateString()}</td>
                              <td className="p-3 text-right text-gray-300">{formatCurrency(div.dividendAmount)}</td>
                              <td className="p-3 text-right text-gray-300">{div.quantity}</td>
                              <td className="p-3 text-right neon-green font-medium">{formatCurrency(div.totalDividend)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent Dividends */}
                {dividends.recentDividends.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold neon-green mb-4">Recent Dividends</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Symbol</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Ex-Date</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Record Date</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-300">Payment Date</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Amount/Share</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Quantity</th>
                            <th className="text-right p-3 text-sm font-medium text-gray-300">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dividends.recentDividends.map((div, idx) => (
                            <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                              <td className="p-3">
                                <div className="font-medium neon-green">{div.symbol}</div>
                              </td>
                              <td className="p-3 text-gray-300">{new Date(div.exDate).toLocaleDateString()}</td>
                              <td className="p-3 text-gray-300">{new Date(div.recordDate).toLocaleDateString()}</td>
                              <td className="p-3 text-gray-300">{new Date(div.paymentDate).toLocaleDateString()}</td>
                              <td className="p-3 text-right text-gray-300">{formatCurrency(div.dividendAmount)}</td>
                              <td className="p-3 text-right text-gray-300">{div.quantity}</td>
                              <td className="p-3 text-right neon-green font-medium">{formatCurrency(div.totalDividend)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dividends.monthlyBreakdown.length === 0 && dividends.upcomingDividends.length === 0 && dividends.recentDividends.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-lg mb-2">No dividend data available</div>
                    <div className="text-sm">Dividend tracking requires integration with dividend data providers</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

