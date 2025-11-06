import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Read token from kite-config.json
    const configPath = join(process.cwd(), 'kite-config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const token = config.accessToken || '';
    
    res.status(200).json({ token });
  } catch (error) {
    res.status(404).json({ token: '', error: 'Token not found. Please authenticate via OAuth.' });
  }
}

