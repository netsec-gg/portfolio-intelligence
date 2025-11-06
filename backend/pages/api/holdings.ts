import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/db';
import { fetchHoldings } from '../../lib/mcp';
import { logger } from '../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.headers['x-user-id'] as string } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (!sub || sub.status !== 'active') return res.status(402).json({ error: 'Payment required', checkoutUrl: '/pricing' });
    const holdings = await fetchHoldings(user.kiteToken);
    res.status(200).json({ holdings });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
