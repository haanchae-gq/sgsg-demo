import { FastifyInstance } from 'fastify';
import * as handler from './handler.js';
import * as schema from './schema.js';

export default async function notificationRoutes(fastify: FastifyInstance) {
  // 사용자 알림 목록 조회
  fastify.get('/notifications', {
    schema: schema.GetNotificationsSchema,
    preHandler: [fastify.authenticate],
    handler: handler.getNotificationsHandler,
  });

  // 알림 읽음 표시
  fastify.put('/notifications/:notificationId/read', {
    schema: schema.MarkNotificationAsReadSchema,
    preHandler: [fastify.authenticate],
    handler: handler.markNotificationAsReadHandler,
  });

  // 관리자 알림 발송 (관리자 권한 필요)
  fastify.post('/admin/notifications/send', {
    schema: schema.AdminSendNotificationSchema,
    preHandler: [fastify.authenticate], // TODO: 관리자 권한 체크 추가
    handler: handler.adminSendNotificationHandler,
  });

  // 실시간 알림 WebSocket 연결
  fastify.get('/ws', {
    websocket: true,
    preHandler: [fastify.authenticate],
    handler: handler.notificationWebSocketHandler,
  });
}