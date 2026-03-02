import { FastifyReply, FastifyRequest } from 'fastify';
import { PaymentService } from '../../../services/payment.service';

interface PaymentParams {
  paymentId: string;
}

interface InitializePaymentBody {
  orderId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  method?: 'credit_card' | 'virtual_account' | 'simple_payment' | 'cash';
}

interface CompletePaymentBody {
  paymentId: string;
  pgTransactionId: string;
  pgResponse: any;
  paidAt?: string;
}

interface RefundPaymentBody {
  amount: number;
  reason: string;
}

interface HectoWebhookBody {
  mid: string;
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed' | 'cancelled';
  amount: number;
  pgTransactionId: string;
  paidAt: string;
  timestamp: string;
  signature: string;
}

export class PaymentHandler {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  // 결제 초기화
  initializePayment = async (
    request: FastifyRequest<{ Body: InitializePaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;

      if (!userId || userRole !== 'customer') {
        reply.code(401).send({
          success: false,
          message: '고객 권한이 필요합니다.',
          code: 'PAYMENT_AUTH_001',
        });
        return;
      }

      const payment = await this.paymentService.initializePayment(userId, request.body);

      reply.code(201).send({
        success: true,
        message: '결제가 초기화되었습니다.',
        data: payment,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to initialize payment');
      const statusCode = error.code?.startsWith('PAYMENT_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '결제 초기화에 실패했습니다.',
        code: error.code || 'PAYMENT_INIT_001',
      });
    }
  };

  // 결제 완료 처리 (PG 콜백)
  completePayment = async (
    request: FastifyRequest<{ Body: CompletePaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const payment = await this.paymentService.completePayment(request.body);

      reply.code(200).send({
        success: true,
        message: '결제가 완료되었습니다.',
        data: payment,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to complete payment');
      const statusCode = error.code?.startsWith('PAYMENT_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '결제 완료 처리에 실패했습니다.',
        code: error.code || 'PAYMENT_COMPLETE_001',
      });
    }
  };

  // 결제 정보 조회
  getPaymentById = async (
    request: FastifyRequest<{ Params: PaymentParams }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { paymentId } = request.params;

      if (!userId) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const payment = await this.paymentService.getPaymentById(paymentId, userId, userRole);

      reply.code(200).send({
        success: true,
        message: '결제 정보 조회 성공',
        data: payment,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to get payment');
      const statusCode = error.code === 'PAYMENT_008' ? 404 : error.code === 'PAYMENT_009' ? 403 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '결제 정보 조회에 실패했습니다.',
        code: error.code || 'PAYMENT_GET_001',
      });
    }
  };

  // 결제 환불
  refundPayment = async (
    request: FastifyRequest<{ Params: PaymentParams; Body: RefundPaymentBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userRole = request.jwtPayload?.role;
      const { paymentId } = request.params;

      if (userRole !== 'admin') {
        reply.code(403).send({
          success: false,
          message: '관리자 권한이 필요합니다.',
          code: 'PAYMENT_REFUND_AUTH_001',
        });
        return;
      }

      const payment = await this.paymentService.refundPayment(paymentId, request.body);

      reply.code(200).send({
        success: true,
        message: '환불이 처리되었습니다.',
        data: payment,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to refund payment');
      const statusCode = error.code?.startsWith('PAYMENT_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '환불 처리에 실패했습니다.',
        code: error.code || 'PAYMENT_REFUND_001',
      });
    }
  };

  // 헥토 웹훅 처리 (인증 불필요)
  handleHectoWebhook = async (
    request: FastifyRequest<{ Body: HectoWebhookBody }>,
    reply: FastifyReply
  ) => {
    try {
      const webhookData = request.body;

      // 웹훅 데이터 로깅
      request.log.info('헥토 웹훅 수신', {
        paymentId: webhookData.paymentId,
        orderId: webhookData.orderId,
        status: webhookData.status,
        amount: webhookData.amount,
      });

      // 웹훅 처리
      const processed = await this.paymentService.processHectoWebhook(webhookData);

      if (processed) {
        reply.code(200).send({
          success: true,
          message: 'Webhook processed successfully',
        });
      } else {
        reply.code(400).send({
          success: false,
          message: 'Webhook processing failed',
        });
      }
    } catch (error: any) {
      request.log.error(error, 'Failed to process Hecto webhook');
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  // 결제 상태 동기화 (관리자 전용)
  syncPaymentStatus = async (
    request: FastifyRequest<{ Params: PaymentParams }>,
    reply: FastifyReply
  ) => {
    try {
      const userRole = request.jwtPayload?.role;

      if (userRole !== 'admin') {
        reply.code(403).send({
          success: false,
          message: '관리자 권한이 필요합니다.',
          code: 'PAYMENT_AUTH_002',
        });
        return;
      }

      const { paymentId } = request.params;
      const synced = await this.paymentService.syncPaymentStatus(paymentId);

      if (synced) {
        reply.send({
          success: true,
          message: '결제 상태가 동기화되었습니다.',
        });
      } else {
        reply.code(400).send({
          success: false,
          message: '결제 상태 동기화에 실패했습니다.',
        });
      }
    } catch (error: any) {
      request.log.error(error, 'Failed to sync payment status');
      reply.code(500).send({
        success: false,
        message: '결제 상태 동기화에 실패했습니다.',
      });
    }
  };
}