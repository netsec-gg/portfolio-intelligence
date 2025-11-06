import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Safely serialize meta to avoid circular references
    const safeMeta: any = {};
    try {
      for (const [key, value] of Object.entries(meta)) {
        if (value === null || value === undefined) {
          safeMeta[key] = value;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeMeta[key] = value;
        } else if (value instanceof Error) {
          safeMeta[key] = {
            message: value.message,
            stack: value.stack,
            name: value.name,
          };
        } else {
          // Try to stringify, but catch circular reference errors
          try {
            JSON.stringify(value);
            safeMeta[key] = value;
          } catch {
            safeMeta[key] = String(value);
          }
        }
      }
    } catch {
      // If serialization fails, just use message
    }
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      stack,
      ...safeMeta,
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'portfy-backend' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    }),
    
    // Separate file for errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
});

// Add request ID to logs for tracing
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Structured logging methods
export const logApiRequest = (method: string, url: string, userId?: string, duration?: number) => {
  logger.info('API Request', {
    type: 'api_request',
    method,
    url,
    userId,
    duration,
  });
};

export const logApiError = (method: string, url: string, error: Error, userId?: string) => {
  logger.error('API Error', {
    type: 'api_error',
    method,
    url,
    userId,
    error: error.message,
    stack: error.stack,
  });
};

export const logBusinessEvent = (event: string, data: Record<string, any>) => {
  logger.info('Business Event', {
    type: 'business_event',
    event,
    ...data,
  });
};

export const logSecurityEvent = (event: string, data: Record<string, any>) => {
  logger.warn('Security Event', {
    type: 'security_event',
    event,
    ...data,
  });
};

export { logger };
