import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { OrderService } from '../../../services/order.service';
import { OrderHandler } from './handler';
import * as schemas from './schema';

export default async function orderRoutes(fastify: FastifyInstance) {
  // Create service instance
  const orderService = new OrderService(fastify.prisma);
  const handler = new OrderHandler(orderService);

  // 주문 생성
  fastify.post('/', {
    schema: {
      body: schemas.CreateOrderRequest,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.OrderResponse,
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
  }, handler.createOrder);

  // 주문 목록 조회
  fastify.get('/', {
    schema: {
      querystring: schemas.OrderFilterQuery,
      response: {
        200: schemas.OrderListResponse,
      },
    },
    preHandler: fastify.authenticate,
  }, handler.getOrders);

  // 주문 상세 조회
  fastify.get('/:orderId', {
    schema: {
      params: schemas.OrderIdParam,
      response: {
        200: schemas.OrderDetailResponse,
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
  }, handler.getOrderById);

  // 주문 수정
  fastify.put('/:orderId', {
    schema: {
      params: schemas.OrderIdParam,
      body: schemas.UpdateOrderRequest,
      response: {
        200: schemas.OrderDetailResponse,
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          code: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.updateOrder);

  // 주문 취소
  fastify.post('/:orderId/cancel', {
    schema: {
      params: schemas.OrderIdParam,
      body: schemas.CancelOrderRequest,
      response: {
        200: schemas.OrderDetailResponse,
      },
    },
    preHandler: fastify.authenticate,
  }, handler.cancelOrder);

  // 주문 메모 조회
  fastify.get('/:orderId/notes', {
    schema: {
      params: schemas.OrderIdParam,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: Type.Array(schemas.OrderNoteResponse),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.getOrderNotes);

  // 주문 메모 생성
  fastify.post('/:orderId/notes', {
    schema: {
      params: schemas.OrderIdParam,
      body: schemas.CreateOrderNoteRequest,
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: schemas.OrderNoteResponse,
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.createOrderNote);

  // 주문 첨부파일 조회
  fastify.get('/:orderId/attachments', {
    schema: {
      params: schemas.OrderIdParam,
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: Type.Array(schemas.OrderAttachmentResponse),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, handler.getOrderAttachments);
}