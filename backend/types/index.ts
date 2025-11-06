export interface User {
  id: string;
  platform: string;
  platformId: string;
  kiteToken: string;
  subscription?: Subscription;
  alerts?: Alert[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  planId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  type: 'price' | 'news' | 'portfolio';
  params: Record<string, any>;
  schedule?: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PortfolioHolding {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  published_at: string;
  sentiment_score?: number;
}

export interface AnalysisRequest {
  prompt: string;
  holdings?: PortfolioHolding[];
  news?: NewsItem[];
}

export interface AnalysisResponse {
  analysis: string;
  recommendations?: string[];
  risk_assessment?: string;
  confidence_score?: number;
}

export interface KiteTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: number;
}

export interface WebhookPayload {
  event: string;
  payload: Record<string, any>;
  signature?: string;
}

export interface BotMessage {
  platform: 'slack' | 'telegram' | 'whatsapp';
  userId: string;
  message: string;
  timestamp: Date;
}

export interface BotResponse {
  message: string;
  attachments?: any[];
  quick_replies?: string[];
} 