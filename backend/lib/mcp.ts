import axios from 'axios';

const KITE_API_BASE = 'https://api.kite.trade';

interface KiteAuth {
  apiKey: string;
  accessToken: string;
}

function getKiteAuth(token: string): KiteAuth {
  // Hardcoded API key
  const HARDCODED_API_KEY = 'f284nayjeebjjha0';
  
  // Token format: "apiKey:accessToken" or just accessToken
  if (token.includes(':')) {
    const [apiKey, accessToken] = token.split(':');
    return { apiKey, accessToken };
  }
  // If only accessToken is provided, use hardcoded API key
  return {
    apiKey: HARDCODED_API_KEY,
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
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw new Error('Session expired or invalid token. Please login again.');
    }
    if (error.response?.data?.message?.includes('api_key') || error.response?.data?.message?.includes('access_token')) {
      throw new Error('Invalid API key or access token. Please re-authenticate.');
    }
    throw new Error(`Kite API error: ${error.message}`);
  }
}

export async function fetchHoldings(token: string) {
  try {
    const data = await makeKiteRequest('/portfolio/holdings', token);
    const holdings = data?.holdings || data || [];
    console.log(`Fetched ${holdings.length} holdings from Kite API`);
    return holdings;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error fetching holdings:', errorMsg);
    // Re-throw authentication errors so they can be handled properly
    if (errorMsg.includes('Session expired') || errorMsg.includes('invalid token') || errorMsg.includes('api_key') || errorMsg.includes('access_token')) {
      throw error; // Re-throw so caller knows it's an auth issue
    }
    // Return empty array on other errors to prevent crashes
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
