import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/db';
import { logger } from '../../lib/logger';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    openai: 'healthy' | 'unhealthy';
    kite: 'healthy' | 'unhealthy';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let databaseStatus: 'healthy' | 'unhealthy' = 'unhealthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'healthy';
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    // Check OpenAI API (basic connectivity)
    let openaiStatus: 'healthy' | 'unhealthy' = 'healthy';
    if (!process.env.OPENAI_API_KEY) {
      openaiStatus = 'unhealthy';
    }

    // Check Kite API configuration (hardcoded, so always healthy)
    let kiteStatus: 'healthy' | 'unhealthy' = 'healthy';

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Overall health status
    const isHealthy = databaseStatus === 'healthy' && 
                     openaiStatus === 'healthy' && 
                     kiteStatus === 'healthy' &&
                     memoryPercentage < 90; // Consider unhealthy if memory usage > 90%

    const healthCheck: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseStatus,
        openai: openaiStatus,
        kite: kiteStatus,
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage),
      },
    };

    const responseTime = Date.now() - startTime;
    
    // Log health check if it takes too long or if unhealthy
    if (responseTime > 1000 || !isHealthy) {
      logger.warn('Health check concern:', {
        responseTime,
        status: healthCheck.status,
        services: healthCheck.services,
        memory: healthCheck.memory,
      });
    }

    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    // Add response headers for monitoring
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    return res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    
    return res.status(503).json({
      error: 'Health check failed',
    });
  }
} 