import { FastifyPluginAsync } from 'fastify';
import { ReviewHandler } from './handler.js';
import { ReviewService } from '../../../services/review.service.js';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewListQuerySchema,
  ReviewResponseSchema,
  ReviewListResponseSchema,
  HelpfulResponseSchema,
  ReviewParamsSchema,
  ReportReviewSchema,
  ReportResponseSchema,
  ErrorResponseSchema
} from './schema.js';

const reviewRoutes: FastifyPluginAsync = async function (fastify) {
  // 서비스 및 핸들러 인스턴스 생성
  const reviewService = new ReviewService(fastify.prisma);
  const reviewHandler = new ReviewHandler(reviewService);

  // 리뷰 작성
  fastify.post('/', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 작성',
      description: '주문 완료 후 리뷰를 작성합니다. (고객만 가능, 주문 완료 후 30일 이내)',
      security: [{ bearerAuth: [] }],
      body: CreateReviewSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: ReviewResponseSchema,
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
    handler: reviewHandler.createReview
  });

  // 리뷰 목록 조회
  fastify.get('/', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 목록 조회',
      description: '리뷰 목록을 조회합니다. 필터링, 정렬, 페이징 지원',
      querystring: ReviewListQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: ReviewResponseSchema },
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
                averageRating: { type: ['number', 'null'] },
                totalReviews: { type: 'integer' },
                ratingDistribution: {
                  type: 'object',
                  properties: {
                    1: { type: 'integer' },
                    2: { type: 'integer' },
                    3: { type: 'integer' },
                    4: { type: 'integer' },
                    5: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.optionalAuthenticate,
    handler: reviewHandler.getReviews
  });

  // 리뷰 상세 조회
  fastify.get('/:reviewId', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 상세 조회',
      description: '리뷰 상세 정보를 조회합니다.',
      params: ReviewParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: ReviewResponseSchema
          }
        },
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.optionalAuthenticate,
    handler: reviewHandler.getReviewById
  });

  // 리뷰 수정
  fastify.put('/:reviewId', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 수정',
      description: '리뷰를 수정합니다. (작성자만 가능, 작성 후 7일 이내)',
      security: [{ bearerAuth: [] }],
      params: ReviewParamsSchema,
      body: UpdateReviewSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: ReviewResponseSchema,
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
    handler: reviewHandler.updateReview
  });

  // 리뷰 삭제
  fastify.delete('/:reviewId', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 삭제',
      description: '리뷰를 삭제합니다. (작성자만 가능)',
      security: [{ bearerAuth: [] }],
      params: ReviewParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: reviewHandler.deleteReview
  });

  // 도움됨 표시/취소
  fastify.post('/:reviewId/helpful', {
    schema: {
      tags: ['Reviews'],
      summary: '도움됨 표시/취소',
      description: '리뷰에 도움됨 표시를 추가하거나 취소합니다. (인증된 사용자)',
      security: [{ bearerAuth: [] }],
      params: ReviewParamsSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: HelpfulResponseSchema,
            message: { type: 'string' }
          }
        },
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: reviewHandler.toggleHelpful
  });

  // 리뷰 신고
  fastify.post('/:reviewId/report', {
    schema: {
      tags: ['Reviews'],
      summary: '리뷰 신고',
      description: '부적절한 리뷰를 신고합니다. (인증된 사용자)',
      security: [{ bearerAuth: [] }],
      params: ReviewParamsSchema,
      body: ReportReviewSchema,
      response: {
        200: ReportResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    },
    preHandler: fastify.authenticate,
    handler: reviewHandler.reportReview
  });
};

export default reviewRoutes;