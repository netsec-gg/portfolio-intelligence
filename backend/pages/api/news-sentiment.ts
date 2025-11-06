import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { scoreSentiment } from '../../lib/sentiment';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.headers['x-user-id'] as string } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!sub || sub.status !== 'active') return res.status(402).json({ error: 'Payment required', checkoutUrl: '/pricing' });
    const { symbols } = req.query as { symbols: string };
    const apiKey = process.env.NEWS_API_KEY!;
    const all = await Promise.all(symbols.split(',').map(async sym => {
      const r = await axios.get('https://newsapi.org/v2/everything', { params: { q: sym, sortBy: 'publishedAt', apiKey } });
      const headlines = r.data.articles.slice(0,5).map((a: any) => a.title);
      const scored = await scoreSentiment(headlines);
      return { symbol: sym, sentiment: scored };
    }));
    res.status(200).json(all);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
