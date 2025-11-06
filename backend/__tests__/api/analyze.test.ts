import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/analyze';
import { prisma } from '../../lib/db';
import { analyzePortfolio } from '../../lib/mcp';

// Mock dependencies
jest.mock('../../lib/db');
jest.mock('../../lib/mcp');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAnalyzePortfolio = analyzePortfolio as jest.MockedFunction<typeof analyzePortfolio>;

describe('/api/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user not found', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'nonexistent-user' },
      body: { prompt: 'Analyze my portfolio' },
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should return 402 if user has no active subscription', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'user-123' },
      body: { prompt: 'Analyze my portfolio' },
    });

    const mockUser = {
      id: 'user-123',
      kiteToken: 'token-123',
    };

    const mockSubscription = {
      status: 'inactive',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(402);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Payment required',
      checkoutUrl: '/pricing',
    });
  });

  it('should return analysis for valid user with active subscription', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'user-123' },
      body: { prompt: 'Analyze my portfolio' },
    });

    const mockUser = {
      id: 'user-123',
      kiteToken: 'token-123',
    };

    const mockSubscription = {
      status: 'active',
    };

    const mockAnalysis = {
      analysis: 'Your portfolio shows strong diversification...',
      recommendations: ['Consider rebalancing', 'Add more tech stocks'],
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
    mockAnalyzePortfolio.mockResolvedValue(mockAnalysis);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      analysis: mockAnalysis,
    });
    expect(mockAnalyzePortfolio).toHaveBeenCalledWith('token-123', 'Analyze my portfolio');
  });

  it('should handle analysis errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'x-user-id': 'user-123' },
      body: { prompt: 'Analyze my portfolio' },
    });

    const mockUser = {
      id: 'user-123',
      kiteToken: 'token-123',
    };

    const mockSubscription = {
      status: 'active',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
    mockAnalyzePortfolio.mockRejectedValue(new Error('Analysis failed'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Internal server error',
    });
  });

  it('should validate request method', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { 'x-user-id': 'user-123' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });
}); 