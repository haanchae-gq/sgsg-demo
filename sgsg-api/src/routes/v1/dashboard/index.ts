import { FastifyInstance } from 'fastify';
import {
  getDashboardMetrics,
  getRevenueData,
  getOrderStatusDistribution,
  getRecentOrders,
  getPendingReviews
} from './handler';
import {
  DashboardMetricsSchema,
  RevenueDataSchema,
  OrderStatusDistributionSchema,
  RecentOrderSchema,
  PendingReviewSchema
} from './schema';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // Dashboard metrics endpoint
  fastify.get('/metrics', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: DashboardMetricsSchema
          }
        }
      }
    }
  }, getDashboardMetrics);

  // Revenue data endpoint
  fastify.get('/revenue', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'string', default: '30' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: RevenueDataSchema
            }
          }
        }
      }
    }
  }, getRevenueData);

  // Order status distribution endpoint
  fastify.get('/order-status-distribution', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: OrderStatusDistributionSchema
            }
          }
        }
      }
    }
  }, getOrderStatusDistribution);

  // Recent orders endpoint
  fastify.get('/recent-orders', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '10' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: RecentOrderSchema
            }
          }
        }
      }
    }
  }, getRecentOrders);

  // Pending reviews endpoint
  fastify.get('/pending-reviews', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', default: '5' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: PendingReviewSchema
            }
          }
        }
      }
    }
  }, getPendingReviews);
}