import { FastifyRequest, FastifyReply } from 'fastify';
import { Static } from '@sinclair/typebox';
import { ReviewService } from '../../../services/review.service.js';
import { AppError } from '../../../types/errors.js';
import { 
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewListQuerySchema,
  ReviewParamsSchema,
  ReportReviewSchema
} from './schema.js';

type CreateReviewBody = Static<typeof CreateReviewSchema>;
type UpdateReviewBody = Static<typeof UpdateReviewSchema>;
type ReviewListQuery = Static<typeof ReviewListQuerySchema>;
type ReviewParams = Static<typeof ReviewParamsSchema>;
type ReportReviewBody = Static<typeof ReportReviewSchema>;

export class ReviewHandler {
  constructor(private reviewService: ReviewService) {}

  /**
   * POST /reviews - 리뷰 작성
   */
  createReview = async (
    request: FastifyRequest<{ Body: CreateReviewBody }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user) {
        throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
      }

      // 고객인지 확인
      if (user.role !== 'customer') {
        throw new AppError('FORBIDDEN_001', '고객만 리뷰를 작성할 수 있습니다.', 403);
      }

      if (!user.customerId) {
        throw new AppError('NOT_FOUND_001', '고객 정보를 찾을 수 없습니다.', 404);
      }

      const review = await this.reviewService.createReview(user.customerId, request.body);

      reply.code(201).send({
        success: true,
        data: review,
        message: '리뷰가 성공적으로 작성되었습니다.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 작성 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * GET /reviews - 리뷰 목록 조회
   */
  getReviews = async (
    request: FastifyRequest<{ Querystring: ReviewListQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.reviewService.getReviews(
        request.query,
        request.user?.id
      );

      reply.send({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
        statistics: result.statistics
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 목록 조회 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * GET /reviews/:reviewId - 리뷰 상세 조회
   */
  getReviewById = async (
    request: FastifyRequest<{ Params: ReviewParams }>,
    reply: FastifyReply
  ) => {
    try {
      const review = await this.reviewService.getReviewById(
        request.params.reviewId,
        request.user?.id
      );

      reply.send({
        success: true,
        data: review
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 조회 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * PUT /reviews/:reviewId - 리뷰 수정
   */
  updateReview = async (
    request: FastifyRequest<{ Params: ReviewParams; Body: UpdateReviewBody }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user) {
        throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
      }

      // 고객인지 확인
      if (user.role !== 'customer') {
        throw new AppError('FORBIDDEN_001', '고객만 리뷰를 수정할 수 있습니다.', 403);
      }

      if (!user.customerId) {
        throw new AppError('NOT_FOUND_001', '고객 정보를 찾을 수 없습니다.', 404);
      }

      const review = await this.reviewService.updateReview(
        request.params.reviewId,
        user.customerId,
        request.body
      );

      reply.send({
        success: true,
        data: review,
        message: '리뷰가 성공적으로 수정되었습니다.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 수정 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * DELETE /reviews/:reviewId - 리뷰 삭제
   */
  deleteReview = async (
    request: FastifyRequest<{ Params: ReviewParams }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user) {
        throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
      }

      // 고객인지 확인
      if (user.role !== 'customer') {
        throw new AppError('FORBIDDEN_001', '고객만 리뷰를 삭제할 수 있습니다.', 403);
      }

      if (!user.customerId) {
        throw new AppError('NOT_FOUND_001', '고객 정보를 찾을 수 없습니다.', 404);
      }

      await this.reviewService.deleteReview(
        request.params.reviewId,
        user.customerId
      );

      reply.send({
        success: true,
        message: '리뷰가 성공적으로 삭제되었습니다.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 삭제 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * POST /reviews/:reviewId/helpful - 도움됨 표시/취소
   */
  toggleHelpful = async (
    request: FastifyRequest<{ Params: ReviewParams }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user) {
        throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
      }

      const result = await this.reviewService.toggleHelpful(
        request.params.reviewId,
        user.userId
      );

      reply.send({
        success: true,
        data: result,
        message: result.isHelpful ? '도움됨을 표시했습니다.' : '도움됨을 취소했습니다.'
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '도움됨 표시 처리 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * POST /reviews/:reviewId/report - 리뷰 신고
   */
  reportReview = async (
    request: FastifyRequest<{ Params: ReviewParams; Body: ReportReviewBody }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user) {
        throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
      }

      const reportId = await this.reviewService.reportReview(
        request.params.reviewId,
        user.userId,
        request.body.reason,
        request.body.description
      );

      reply.send({
        success: true,
        message: '리뷰 신고가 접수되었습니다.',
        reportId
      });
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send({
          success: false,
          error: error.message,
          statusCode: error.statusCode
        });
      } else {
        request.log.error(error);
        reply.code(500).send({
          success: false,
          error: '리뷰 신고 처리 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };
}