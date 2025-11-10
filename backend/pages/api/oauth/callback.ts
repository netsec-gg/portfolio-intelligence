import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import crypto from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Hardcoded API keys
const KITE_API_KEY = 'f284nayjeebjjha0';
const KITE_API_SECRET = 'wm1psj4mwwwxamopfck6iq08dr1vxf70';

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { request_token, status, action } = req.query;
    
    // Check if user denied access
    if (status === 'failure' || action === 'deny') {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Authentication Denied</h1>
            <p>You denied access to the application.</p>
            <p><a href="/api/oauth/authorize">Try again</a></p>
          </body>
        </html>
      `);
    }
    
    if (!request_token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Missing Request Token</h1>
            <p>No request token received from Zerodha.</p>
            <p><a href="/api/oauth/authorize">Try again</a></p>
          </body>
        </html>
      `);
    }

    // Calculate checksum: SHA256(api_key + request_token + api_secret)
    const checksum = crypto
      .createHash('sha256')
      .update(KITE_API_KEY + String(request_token) + KITE_API_SECRET)
      .digest('hex');
    
    console.log('Exchanging token:', {
      apiKey: KITE_API_KEY,
      requestToken: String(request_token).substring(0, 20) + '...',
      checksumLength: checksum.length
    });
    
    try {
      // Kite API expects form-urlencoded data
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
        throw new Error('No access token in response');
      }
      
      // Save token to kite-config.json (for personal use - no database needed)
      const configPath = join(process.cwd(), 'kite-config.json');
      let config: any = {};
      
      if (existsSync(configPath)) {
        config = JSON.parse(readFileSync(configPath, 'utf-8'));
      }
      
      config.apiKey = KITE_API_KEY;
      config.apiSecret = KITE_API_SECRET;
      config.accessToken = accessToken;
      config.lastUpdated = new Date().toISOString();
      
      writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log('Token saved successfully');
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      // Redirect back to dashboard after successful authentication
      res.redirect(`${baseUrl}/?authenticated=true`);
    } catch (apiError: any) {
      console.error('Kite API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Unknown error';
      const errorDetails = apiError.response?.data || {};
      
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Authentication Failed</h1>
            <p><strong>Error:</strong> ${errorMessage}</p>
            ${errorDetails.error_type ? `<p><strong>Error Type:</strong> ${errorDetails.error_type}</p>` : ''}
            <p style="margin-top: 30px;">
              <strong>Common issues:</strong><br/>
              1. Make sure redirect URL in Zerodha app settings matches: http://localhost:3000/api/oauth/callback<br/>
              2. Check that API Key and Secret are correct<br/>
              3. Ensure you're using the latest request_token
            </p>
            <p style="margin-top: 20px;">
              <a href="/api/oauth/authorize">Try again</a> | 
              <a href="/">Go to Dashboard</a>
            </p>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>Unexpected Error</h1>
          <p>${error.message}</p>
          <p><a href="/api/oauth/authorize">Try again</a></p>
        </body>
      </html>
    `);
  }
}
