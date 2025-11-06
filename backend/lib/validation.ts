import { z } from 'zod';
import { NextApiRequest } from 'next';

// User validation schemas
export const userSchema = z.object({
  platform: z.enum(['slack', 'telegram', 'whatsapp', 'web']),
  platformId: z.string().min(1),
  kiteToken: z.string().min(1),
});

export const updateUserSchema = z.object({
  kiteToken: z.string().min(1).optional(),
});

// Analysis request validation
export const analysisRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  includeHoldings: z.boolean().optional(),
  includeNews: z.boolean().optional(),
});

// Alert validation schemas
export const alertSchema = z.object({
  type: z.enum(['price', 'news', 'portfolio']),
  params: z.record(z.any()),
  schedule: z.string().optional(),
});

// Subscription validation
export const subscriptionSchema = z.object({
  planId: z.string().min(1),
  paymentMethodId: z.string().min(1).optional(),
});

// Webhook validation
export const webhookSchema = z.object({
  event: z.string().min(1),
  payload: z.record(z.any()),
  signature: z.string().optional(),
});

// Bot message validation
export const botMessageSchema = z.object({
  platform: z.enum(['slack', 'telegram', 'whatsapp']),
  userId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Generic validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest): T => {
    try {
      return schema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  };
}

// Query parameter validation
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest): T => {
    try {
      return schema.parse(req.query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', error.errors);
      }
      throw error;
    }
  };
}

// Custom validation error class
export class ValidationError extends Error {
  public errors: z.ZodIssue[];

  constructor(message: string, errors: z.ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Rate limiting validation
export const rateLimitSchema = z.object({
  windowMs: z.number().min(1000),
  max: z.number().min(1),
  message: z.string().optional(),
});

export default {
  userSchema,
  updateUserSchema,
  analysisRequestSchema,
  alertSchema,
  subscriptionSchema,
  webhookSchema,
  botMessageSchema,
  paginationSchema,
  validateRequest,
  validateQuery,
  ValidationError,
  sanitizeString,
  sanitizeEmail,
}; 