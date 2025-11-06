import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { logger } from '../../../lib/logger';

export interface MarketMood {
  value: number; // 0-100
  label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  color: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ mood: MarketMood } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Calculate market mood based on multiple factors
    let moodScore = 50; // Start neutral
    
    // Fetch FII/DII data
    try {
      const fiiDiiResponse = await axios.get('https://www.nseindia.com/api/fii-dii-data', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.nseindia.com/',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (fiiDiiResponse.status === 200 && fiiDiiResponse.data) {
        const latest = fiiDiiResponse.data.data?.[0] || fiiDiiResponse.data;
        
        // FII buying increases greed
        if (latest.fii?.net) {
          const fiiNet = parseFloat(latest.fii.net) || 0;
          moodScore += Math.min(20, Math.max(-20, fiiNet / 1000)); // Cap at ±20
        }
        
        // DII buying increases greed
        if (latest.dii?.net) {
          const diiNet = parseFloat(latest.dii.net) || 0;
          moodScore += Math.min(15, Math.max(-15, diiNet / 1000)); // Cap at ±15
        }
      }
    } catch (e) {
      logger.warn('FII/DII fetch failed for mood:', e);
    }

    // Fetch NIFTY 50 data
    try {
      // Use NSE API or fallback calculation
      // For now, use a simple calculation based on market data
      // In production, fetch from NSE API
    } catch (e) {
      logger.warn('Market data fetch failed:', e);
    }

    // Normalize score to 0-100
    moodScore = Math.max(0, Math.min(100, moodScore));

    // Determine label
    let label: MarketMood['label'];
    let color: string;
    
    if (moodScore >= 80) {
      label = 'Extreme Greed';
      color = '#00FF80'; // neon green
    } else if (moodScore >= 60) {
      label = 'Greed';
      color = '#00FF80'; // neon green
    } else if (moodScore >= 40) {
      label = 'Neutral';
      color = '#00FF80'; // neon green
    } else if (moodScore >= 20) {
      label = 'Fear';
      color = '#FF6699'; // neon pink (netsec style)
    } else {
      label = 'Extreme Fear';
      color = '#EF4444'; // red
    }

    res.status(200).json({
      mood: {
        value: Math.round(moodScore),
        label,
        color,
      }
    });
  } catch (err) {
    logger.error('Market mood error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

