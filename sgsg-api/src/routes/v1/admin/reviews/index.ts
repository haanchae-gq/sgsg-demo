import { FastifyPluginAsync } from 'fastify';
import { AdminReviewHandler } from './handler.js';
import { AdminReviewService } from '../../../../services/admin-review.service.js';
import {
  ReviewApprovalSchema,
  AdminReviewListQuerySchema,
  AdminReviewResponseSchema,
  AdminReviewListResponseSchema,
  BulkActionSchema,
  BulkActionResultSchema,
  AdminReviewParamsSchema,
  ErrorResponseSchema
} from './schema.js';

const adminReviewRoutes: FastifyPluginAsync = async function (fastify) {
  // 서비스 및 핸들러 인스턴스 생성
  const adminReviewService = new AdminReviewService(fastify.prisma);
  const adminReviewHandler = new AdminReviewHandler(adminReviewService);

  // 관리자용 리뷰 목록 조회
  fastify.get('/', {
    schema: {
      tags: ['Admin - Reviews'],
      summary: '관리자용 리뷰 목록 조회',
      description: '관리자가 모든 리뷰를 조회하고 관리할 수 있습니다. 승인 상태, 신고 현황 등 상세 정보 포함',
      security: [{ bearerAuth: [] }],
      querystring: AdminReviewListQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: AdminReviewResponseSchema },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                pending: { type: 'integer' },
                approved: { type: 'integer' },
                rejected: { type: 'integer' },
                totalReports: { type: 'integer' },
                averageRating: { type: ['number', 'null'] },
                reportedReviews: { type: 'integer' }
              }
            }
          }
        },
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: adminReviewHandler.getReviewsForAdmin
  });

  // 관리자용 리뷰 상세 조회
  fastify.get('/:reviewId', {
    schema: {
      tags: ['Admin - Reviews'],
      summary: '관리자용 리뷰 상세 조회',
      description: '관리자가 특정 리뷰의 상세 정보를 조회합니다. 신고 내역, 처리 이력 등 포함',
      security: [{ bearerAuth: [] }],
      params: AdminReviewParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: AdminReviewResponseSchema
          }
        },
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: adminReviewHandler.getReviewByIdForAdmin
  });

  // 리뷰 승인/거부
  fastify.post('/:reviewId/approve-reject', {
    schema: {
      tags: ['Admin - Reviews'],
      summary: '리뷰 승인/거부',
      description: '관리자가 특정 리뷰를 승인하거나 거부합니다. 거부 시 이유 입력 필수',
      security: [{ bearerAuth: [] }],
      params: AdminReviewParamsSchema,
      body: ReviewApprovalSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: AdminReviewResponseSchema,
            message: { type: 'string' }
          }
        },
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: adminReviewHandler.approveOrRejectReview
  });

  // 리뷰 일괄 승인/거부
  fastify.post('/bulk-action', {
    schema: {
      tags: ['Admin - Reviews'],
      summary: '리뷰 일괄 승인/거부',
      description: '관리자가 여러 리뷰를 한 번에 승인하거나 거부합니다. 최대 50개까지 처리 가능',
      security: [{ bearerAuth: [] }],
      body: BulkActionSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: BulkActionResultSchema,
            message: { type: 'string' }
          }
        },
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: adminReviewHandler.bulkApproveOrReject
  });
};

export default adminReviewRoutes;