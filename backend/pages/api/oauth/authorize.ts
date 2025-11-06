import { NextApiRequest, NextApiResponse } from 'next';

// Hardcoded API key for now
const KITE_API_KEY = process.env.KITE_API_KEY || 'f284nayjeebjjha0';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function authorize(req: NextApiRequest, res: NextApiResponse) {
  // Generate a simple state (can be improved for production)
  const state = 'web:default';
  // IMPORTANT: Redirect URL must match exactly what's configured in Zerodha app settings
  const redirectUrl = `${baseUrl}/api/oauth/callback`;
  const redirectUri = encodeURIComponent(redirectUrl);
  const kiteAuthUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${KITE_API_KEY}&redirect_url=${redirectUri}`;
  
  console.log('Redirecting to:', kiteAuthUrl);
  console.log('Redirect URL configured:', redirectUrl);
  
  res.redirect(kiteAuthUrl);
}
