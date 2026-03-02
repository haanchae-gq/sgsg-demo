import { FastifyRequest, FastifyReply } from 'fastify';
import { Static } from '@sinclair/typebox';
import { AdminReviewService } from '../../../../services/admin-review.service.js';
import { AppError } from '../../../../types/errors.js';
import {
  ReviewApprovalSchema,
  AdminReviewListQuerySchema,
  AdminReviewParamsSchema,
  BulkActionSchema
} from './schema.js';

type ReviewApprovalBody = Static<typeof ReviewApprovalSchema>;
type AdminReviewListQuery = Static<typeof AdminReviewListQuerySchema>;
type AdminReviewParams = Static<typeof AdminReviewParamsSchema>;
type BulkActionBody = Static<typeof BulkActionSchema>;

export class AdminReviewHandler {
  constructor(private adminReviewService: AdminReviewService) {}

  /**
   * GET /admin/reviews - 관리자용 리뷰 목록 조회
   */
  getReviewsForAdmin = async (
    request: FastifyRequest<{ Querystring: AdminReviewListQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user || user.role !== 'admin') {
        throw new AppError('ADMIN_001', '관리자 권한이 필요합니다.', 403);
      }

      const result = await this.adminReviewService.getReviewsForAdmin(request.query);

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
   * GET /admin/reviews/:reviewId - 관리자용 리뷰 상세 조회
   */
  getReviewByIdForAdmin = async (
    request: FastifyRequest<{ Params: AdminReviewParams }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user || user.role !== 'admin') {
        throw new AppError('ADMIN_001', '관리자 권한이 필요합니다.', 403);
      }

      const review = await this.adminReviewService.getReviewByIdForAdmin(
        request.params.reviewId
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
   * POST /admin/reviews/:reviewId/approve-reject - 리뷰 승인/거부
   */
  approveOrRejectReview = async (
    request: FastifyRequest<{ Params: AdminReviewParams; Body: ReviewApprovalBody }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user || user.role !== 'admin') {
        throw new AppError('ADMIN_001', '관리자 권한이 필요합니다.', 403);
      }

      if (!user.adminId) {
        throw new AppError('ADMIN_002', '관리자 정보를 찾을 수 없습니다.', 404);
      }

      // 거부 시 이유 필수
      if (request.body.action === 'reject' && !request.body.reason) {
        throw new AppError('VALIDATION_001', '리뷰 거부 시 이유를 입력해야 합니다.', 400);
      }

      const review = await this.adminReviewService.approveOrRejectReview(
        request.params.reviewId,
        user.adminId,
        request.body
      );

      const actionText = request.body.action === 'approve' ? '승인' : '거부';
      reply.send({
        success: true,
        data: review,
        message: `리뷰가 성공적으로 ${actionText}되었습니다.`
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
          error: '리뷰 처리 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };

  /**
   * POST /admin/reviews/bulk-action - 리뷰 일괄 승인/거부
   */
  bulkApproveOrReject = async (
    request: FastifyRequest<{ Body: BulkActionBody }>,
    reply: FastifyReply
  ) => {
    try {
      const user = request.user;
      if (!user || user.role !== 'admin') {
        throw new AppError('ADMIN_001', '관리자 권한이 필요합니다.', 403);
      }

      if (!user.adminId) {
        throw new AppError('ADMIN_002', '관리자 정보를 찾을 수 없습니다.', 404);
      }

      // 거부 시 이유 필수
      if (request.body.action === 'reject' && !request.body.reason) {
        throw new AppError('VALIDATION_001', '리뷰 거부 시 이유를 입력해야 합니다.', 400);
      }

      const result = await this.adminReviewService.bulkApproveOrReject(
        user.adminId,
        request.body
      );

      const actionText = request.body.action === 'approve' ? '승인' : '거부';
      reply.send({
        success: true,
        data: result,
        message: `일괄 ${actionText} 처리가 완료되었습니다. (성공: ${result.successful}, 실패: ${result.failed})`
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
          error: '일괄 처리 중 오류가 발생했습니다.',
          statusCode: 500
        });
      }
    }
  };
}