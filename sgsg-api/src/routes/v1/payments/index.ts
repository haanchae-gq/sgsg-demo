import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { PaymentService } from '../../../services/payment.service';
import { PaymentHandler } from './handler';
import * as schemas from '../orders/schema'; // 결제 스키마는 주문 스키마와 공유

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Create service instance
  const paymentService = new PaymentService(fastify.prisma);
  const handler = new PaymentHandler(paymentService);

  // 결제 초기화
  fastify.post('/initialize', {
    schema: {
      body: schemas.InitializePaymentRequest,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.PaymentResponse,
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
        401: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.initializePayment);

  // 결제 완료 처리 (PG 콜백)
  fastify.post('/complete', {
    schema: {
      body: schemas.CompletePaymentRequest,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.PaymentResponse,
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    // PG 콜백은 인증 없이 접근 가능 (실제로는 PG 서버 IP 검증 필요)
  }, handler.completePayment);

  // 결제 정보 조회
  fastify.get('/:paymentId', {
    schema: {
      params: schemas.PaymentIdParam,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.PaymentResponse,
        }),
        404: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
        403: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.getPaymentById);

  // 결제 환불
  fastify.post('/:paymentId/refund', {
    schema: {
      params: schemas.PaymentIdParam,
      body: schemas.RefundPaymentRequest,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.PaymentResponse,
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
        403: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
  }, handler.refundPayment);

  // 헥토 웹훅 처리 (인증 불필요 - IP 검증으로 보안)
  fastify.post('/webhook', {
    schema: {
      body: Type.Object({
        mid: Type.String(),
        orderId: Type.String(),
        paymentId: Type.String(),
        status: Type.Union([
          Type.Literal('success'),
          Type.Literal('failed'),
          Type.Literal('cancelled'),
        ]),
        amount: Type.Number(),
        pgTransactionId: Type.String(),
        paidAt: Type.String(),
        timestamp: Type.String(),
        signature: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
    // 웹훅은 인증 없이 접근 (실제 운영에서는 PG 서버 IP 화이트리스트 필요)
  }, handler.handleHectoWebhook);

  // 결제 상태 동기화 (관리자 전용)
  fastify.post('/:paymentId/sync', {
    schema: {
      params: schemas.PaymentIdParam,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
        403: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
  }, handler.syncPaymentStatus);
}