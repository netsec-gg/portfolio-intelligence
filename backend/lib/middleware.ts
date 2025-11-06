import { NextApiRequest, NextApiResponse } from 'next';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import { logger, logApiRequest, logApiError, logSecurityEvent } from './logger';
import { ValidationError } from './validation';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logSecurityEvent('rate_limit_exceeded', {
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        userAgent: req.headers['user-agent'],
        path: req.url,
      });
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Default rate limits
export const defaultRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const strictRateLimit = createRateLimit(15 * 60 * 1000, 20); // 20 requests per 15 minutes
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_BASE_URL!, 'https://portfy.ai']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://kite.zerodha.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request ID middleware
export const addRequestId = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

// Logging middleware
export const requestLogger = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.headers['x-user-id'] as string;
    
    logApiRequest(req.method!, req.url!, userId, duration);
  });
  
  next();
};

// Authentication middleware
export const authenticate = async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      logSecurityEvent('missing_auth_token', {
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        userAgent: req.headers['user-agent'],
        path: req.url,
      });
      return res.status(401).json({
        success: false,
        error: 'Authentication token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { subscription: true },
    });

    if (!user) {
      logSecurityEvent('invalid_user_token', {
        userId: decoded.userId,
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
        path: req.url,
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
      });
    }

    req.headers['x-user-id'] = user.id;
    req.user = user;
    next();
  } catch (error) {
    logSecurityEvent('auth_token_verification_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
      path: req.url,
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
};

// Subscription check middleware
export const requireSubscription = (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
  const user = req.user;
  
  if (!user?.subscription || user.subscription.status !== 'active') {
    return res.status(402).json({
      success: false,
      error: 'Active subscription required',
      checkoutUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });
  }
  
  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: NextApiRequest, res: NextApiResponse) => {
  const requestId = req.headers['x-request-id'] as string;
  const userId = req.headers['x-user-id'] as string;
  
  logApiError(req.method!, req.url!, error, userId);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors,
      requestId,
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      requestId,
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      requestId,
    });
  }

  // Generic error response
  const statusCode = process.env.NODE_ENV === 'production' ? 500 : 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  return res.status(statusCode).json({
    success: false,
    error: message,
    requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

// Webhook signature verification
export const verifyWebhookSignature = (secret: string) => {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const signature = req.headers['x-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Implement signature verification logic based on your webhook provider
    // This is a placeholder - implement actual verification
    if (!signature) {
      logSecurityEvent('missing_webhook_signature', {
        path: req.url,
        ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
      });
      return res.status(401).json({
        success: false,
        error: 'Webhook signature required',
      });
    }
    
    next();
  };
};

// Method validation middleware
export const allowMethods = (methods: string[]) => {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    if (!methods.includes(req.method!)) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`,
      });
    }
    next();
  };
};

// Middleware composer
export const withMiddleware = (...middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>) => {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      let index = 0;
      
      const next = () => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          middleware(req, res, next);
        } else {
          handler(req, res).catch((error) => errorHandler(error, req, res));
        }
      };
      
      next();
    };
  };
};

// Extend NextApiRequest type
declare module 'next' {
  interface NextApiRequest {
    user?: any;
  }
} 