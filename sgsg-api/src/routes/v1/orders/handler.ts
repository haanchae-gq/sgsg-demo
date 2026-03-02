import { FastifyReply, FastifyRequest } from 'fastify';
import { OrderService } from '../../../services/order.service';
import { AuthorType } from '@prisma/client';

interface OrderParams {
  orderId: string;
}

interface CreateOrderBody {
  serviceItemId: string;
  addressId: string;
  requestedDate: string;
  customerNotes?: string;
  metadata?: any;
}

interface UpdateOrderBody {
  requestedDate?: string;
  customerNotes?: string;
  expertNotes?: string;
  metadata?: any;
}

interface CancelOrderBody {
  cancellationReason: string;
}

interface CreateOrderNoteBody {
  content: string;
  isInternal?: boolean;
}

interface OrderFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  expertId?: string;
  customerId?: string;
  serviceItemId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class OrderHandler {
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  // 주문 생성
  createOrder = async (
    request: FastifyRequest<{ Body: CreateOrderBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;

      if (!userId || userRole !== 'customer') {
        reply.code(401).send({
          success: false,
          message: '고객 권한이 필요합니다.',
          code: 'ORDER_AUTH_001',
        });
        return;
      }

      const order = await this.orderService.createOrder(userId!, request.body);

      reply.code(201).send({
        success: true,
        message: '주문이 생성되었습니다.',
        data: order,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to create order');
      const statusCode = error.code?.startsWith('ORDER_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '주문 생성에 실패했습니다.',
        code: error.code || 'ORDER_CREATE_001',
      });
    }
  };

  // 주문 목록 조회
  getOrders = async (
    request: FastifyRequest<{ Querystring: OrderFilterQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;

      if (!userId) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        expertId,
        customerId,
        serviceItemId,
        dateFrom,
        dateTo,
      } = request.query;

      const result = await this.orderService.getOrders(
        { page, limit },
        { status, paymentStatus, expertId, customerId, serviceItemId, dateFrom, dateTo },
        userId!,
        userRole
      );

      reply.code(200).send({
        success: true,
        message: '주문 목록 조회 성공',
        ...result,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to get orders');
      reply.code(500).send({
        success: false,
        message: '주문 목록 조회에 실패했습니다.',
        code: 'ORDER_LIST_001',
      });
    }
  };

  // 주문 상세 조회
  getOrderById = async (
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;

      if (!userId) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const order = await this.orderService.getOrderById(orderId, userId!, userRole);

      reply.code(200).send({
        success: true,
        message: '주문 상세 조회 성공',
        data: order,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to get order');
      const statusCode = error.code === 'ORDER_004' ? 404 : error.code === 'ORDER_005' ? 403 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '주문 조회에 실패했습니다.',
        code: error.code || 'ORDER_GET_001',
      });
    }
  };

  // 주문 수정
  updateOrder = async (
    request: FastifyRequest<{ Params: OrderParams; Body: UpdateOrderBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;

      if (!userId || !userRole) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const order = await this.orderService.updateOrder(orderId, request.body, userId, userRole);

      reply.code(200).send({
        success: true,
        message: '주문이 수정되었습니다.',
        data: order,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to update order');
      const statusCode = error.code?.startsWith('ORDER_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '주문 수정에 실패했습니다.',
        code: error.code || 'ORDER_UPDATE_001',
      });
    }
  };

  // 주문 취소
  cancelOrder = async (
    request: FastifyRequest<{ Params: OrderParams; Body: CancelOrderBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;
      const { cancellationReason } = request.body;

      if (!userId || !userRole) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const order = await this.orderService.cancelOrder(orderId, cancellationReason, userId, userRole);

      reply.code(200).send({
        success: true,
        message: '주문이 취소되었습니다.',
        data: order,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to cancel order');
      const statusCode = error.code?.startsWith('ORDER_') ? 400 : 500;
      reply.code(statusCode).send({
        success: false,
        message: error.message || '주문 취소에 실패했습니다.',
        code: error.code || 'ORDER_CANCEL_001',
      });
    }
  };

  // 주문 메모 조회
  getOrderNotes = async (
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;

      if (!userId || !userRole) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const notes = await this.orderService.getOrderNotes(orderId, userId, userRole);

      reply.code(200).send({
        success: true,
        message: '주문 메모 조회 성공',
        data: notes,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to get order notes');
      reply.code(500).send({
        success: false,
        message: '주문 메모 조회에 실패했습니다.',
        code: 'ORDER_NOTES_001',
      });
    }
  };

  // 주문 메모 생성
  createOrderNote = async (
    request: FastifyRequest<{ Params: OrderParams; Body: CreateOrderNoteBody }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;
      const { content, isInternal = false } = request.body;

      if (!userId || !userRole) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      // 내부 메모는 관리자와 전문가만 작성 가능
      if (isInternal && userRole === 'customer') {
        reply.code(403).send({
          success: false,
          message: '내부 메모를 작성할 권한이 없습니다.',
          code: 'ORDER_NOTE_AUTH_001',
        });
        return;
      }

      const note = await this.orderService.createOrderNote(
        orderId,
        userId,
        userRole as AuthorType,
        content,
        isInternal
      );

      reply.code(201).send({
        success: true,
        message: '주문 메모가 추가되었습니다.',
        data: note,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to create order note');
      reply.code(500).send({
        success: false,
        message: '주문 메모 추가에 실패했습니다.',
        code: 'ORDER_NOTE_CREATE_001',
      });
    }
  };

  // 주문 첨부파일 조회
  getOrderAttachments = async (
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.jwtPayload?.userId;
      const userRole = request.jwtPayload?.role;
      const { orderId } = request.params;

      if (!userId || !userRole) {
        reply.code(401).send({
          success: false,
          message: '인증이 필요합니다.',
          code: 'AUTH_001',
        });
        return;
      }

      const attachments = await this.orderService.getOrderAttachments(orderId, userId, userRole);

      reply.code(200).send({
        success: true,
        message: '첨부파일 목록 조회 성공',
        data: attachments,
      });
    } catch (error: any) {
      request.log.error(error, 'Failed to get order attachments');
      reply.code(500).send({
        success: false,
        message: '첨부파일 조회에 실패했습니다.',
        code: 'ORDER_ATTACHMENT_001',
      });
    }
  };
}