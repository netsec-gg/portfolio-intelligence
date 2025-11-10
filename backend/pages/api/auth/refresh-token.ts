import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import crypto from 'crypto';

const KITE_API_KEY = 'f284nayjeebjjha0';
const KITE_API_SECRET = 'wm1psj4mwwwxamopfck6iq08dr1vxf70';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request token from OAuth flow
    const { request_token } = req.body;
    
    if (!request_token) {
      return res.status(400).json({ 
        error: 'Request token required',
        authUrl: '/api/oauth/authorize'
      });
    }

    // Calculate checksum
    const checksum = crypto
      .createHash('sha256')
      .update(KITE_API_KEY + String(request_token) + KITE_API_SECRET)
      .digest('hex');
    
    // Exchange request token for access token
    const params = new URLSearchParams();
    params.append('api_key', KITE_API_KEY);
    params.append('request_token', String(request_token));
    params.append('checksum', checksum);
    
    const response = await axios.post('https://api.kite.trade/session/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const accessToken = response.data?.data?.access_token;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }
    
    // Save to kite-config.json
    const configPath = join(process.cwd(), 'kite-config.json');
    const config = existsSync(configPath) 
      ? JSON.parse(readFileSync(configPath, 'utf-8'))
      : {};
    
    config.apiKey = KITE_API_KEY;
    config.apiSecret = KITE_API_SECRET;
    config.accessToken = accessToken;
    config.lastUpdated = new Date().toISOString();
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.status(200).json({ 
      success: true, 
      message: 'Token refreshed successfully',
      token: accessToken 
    });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh token';
    res.status(500).json({ 
      error: errorMessage,
      authUrl: '/api/oauth/authorize'
    });
  }
}

