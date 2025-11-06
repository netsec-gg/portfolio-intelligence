import axios from 'axios';

const KITE_API_BASE = 'https://api.kite.trade';

interface KiteAuth {
  apiKey: string;
  accessToken: string;
}

function getKiteAuth(token: string): KiteAuth {
  // Hardcoded API keys for now
  const HARDCODED_API_KEY = 'f284nayjeebjjha0';
  
  // Token format: "apiKey:accessToken" or just accessToken
  if (token.includes(':')) {
    const [apiKey, accessToken] = token.split(':');
    return { apiKey, accessToken };
  }
  // If only accessToken is provided, use hardcoded API key
  return {
    apiKey: process.env.KITE_API_KEY || HARDCODED_API_KEY,
    accessToken: token,
  };
}

async function makeKiteRequest(
  endpoint: string,
  token: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any
) {
  const auth = getKiteAuth(token);
  const headers = {
    'X-Kite-Version': '3',
    Authorization: `token ${auth.apiKey}:${auth.accessToken}`,
  };

  try {
    const response = await axios({
      method,
      url: `${KITE_API_BASE}${endpoint}`,
      headers,
      data,
    });
    return response.data?.data || response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(`Kite API error: ${error.message}`);
  }
}

export async function fetchHoldings(token: string) {
  try {
    const data = await makeKiteRequest('/portfolio/holdings', token);
    return data?.holdings || data || [];
  } catch (error) {
    console.error('Error fetching holdings:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
}

export async function fetchPositions(token: string) {
  try {
    const data = await makeKiteRequest('/portfolio/positions', token);
    return data?.net || data || [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

export async function fetchQuotes(token: string, instruments: string[]) {
  try {
    const params = instruments.map((i) => `i=${i}`).join('&');
    const data = await makeKiteRequest(`/quote?${params}`, token);
    return data;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return {};
  }
}

export async function fetchHistoricalData(
  token: string,
  instrumentToken: string,
  from: string,
  to: string,
  interval: string = 'day'
) {
  try {
    const data = await makeKiteRequest(
      `/instruments/historical/${instrumentToken}/${interval}?from=${from}&to=${to}`,
      token
    );
    return data?.candles || data || [];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

export async function analyzePortfolio(token: string, prompt: string) {
  // This would integrate with OpenAI for analysis
  // For now, return a placeholder
  return {
    analysis: 'Portfolio analysis feature coming soon',
    prompt,
  };
}
