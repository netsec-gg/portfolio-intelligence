import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'BUY' | 'SELL' | 'EDUCATION' | 'NEWS' | 'FII' | 'DII' | 'GAINER' | 'LOSER' | 'ACTIVE' | '52WHIGH' | '52WLOW';
  symbol?: string;
  title: string;
  message: string;
  color: string;
  timestamp: string | Date;
  quantity?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'NEWS' | 'EDUCATION' | 'FII' | 'GAINER' | 'LOSER'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toDateString());

  useEffect(() => {
    loadNotifications();
    
    // Refresh every 10 seconds to get new notifications
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadNotifications = () => {
    try {
      const key = `notifications_${selectedDate}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects for display
        const formatted = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        // Sort by timestamp (newest first)
        formatted.sort((a: Notification, b: Notification) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(formatted);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
      setNotifications([]);
    }
  };

  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    // Get last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toDateString());
    }
    return dates;
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      case 'NEWS': return '📰';
      case 'FII': return '💰';
      case 'GAINER': return '🚀';
      case 'LOSER': return '📉';
      case 'EDUCATION': return '💡';
      default: return '📊';
    }
  };

  return (
    <>
      <Head>
        <title>Daily Notifications - Portify | Portfolio Intelligence</title>
      </Head>
      <div className="min-h-screen netsec-bg">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold neon-green neon-glow">PORTIFY</h1>
              <p className="text-sm text-gray-400 mt-1">portfolio intelligence</p>
            </div>
            <Link href="/" className="px-4 py-2 neon-bg-button rounded font-medium">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold neon-green neon-glow mb-2">Daily Notifications</h2>
            <p className="text-gray-400">All notifications for the selected trading day</p>
          </div>

          {/* Date Selector */}
          <div className="mb-6 neon-bg-card rounded-lg p-4">
            <label className="block text-sm font-medium mb-2 neon-green">Select Date:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-4 py-2 neon-bg-button rounded-lg text-white"
            >
              {getAvailableDates().map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'BUY', 'SELL', 'NEWS', 'FII', 'GAINER', 'LOSER', 'EDUCATION'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'neon-bg-button-selected'
                    : 'neon-bg-button'
                }`}
              >
                {f === 'all' && '🎲 All'}
                {f === 'BUY' && '📈 BUY'}
                {f === 'SELL' && '📉 SELL'}
                {f === 'NEWS' && '📰 News'}
                {f === 'FII' && '💰 FII'}
                {f === 'GAINER' && '🚀 Gainers'}
                {f === 'LOSER' && '📉 Losers'}
                {f === 'EDUCATION' && '💡 Education'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="neon-bg-card rounded-lg p-8 text-center">
                <p className="text-gray-400 text-lg">No notifications found for {selectedDate}</p>
                <p className="text-gray-600 text-sm mt-2">
                  Notifications will appear here as they are generated during trading hours.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="neon-bg-card rounded-lg p-6 border-l-4"
                  style={{ borderLeftColor: notification.color }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                      <div>
                        <h3 className="text-xl font-semibold neon-green">{notification.title}</h3>
                        {notification.symbol && (
                          <span className="text-sm text-gray-400">Symbol: {notification.symbol}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-3 whitespace-pre-wrap">{notification.message}</p>
                  {notification.quantity && (
                    <div className="mt-3 text-sm text-gray-400">
                      Suggested Quantity: {notification.quantity} shares
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {notifications.length > 0 && (
            <div className="mt-8 neon-bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 neon-green">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold neon-green">{notifications.filter(n => n.type === 'BUY').length}</div>
                  <div className="text-sm text-gray-400">BUY Signals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold neon-red">{notifications.filter(n => n.type === 'SELL').length}</div>
                  <div className="text-sm text-gray-400">SELL Signals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{notifications.filter(n => n.type === 'NEWS').length}</div>
                  <div className="text-sm text-gray-400">News Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">{notifications.filter(n => n.type === 'EDUCATION' || n.type === 'FII' || n.type === 'GAINER' || n.type === 'LOSER').length}</div>
                  <div className="text-sm text-gray-400">Other</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

