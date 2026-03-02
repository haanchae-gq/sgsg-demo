import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../../../services/user.service.js';
import { AppError } from '../../../types/errors.js';
import { 
  GetNotificationsQuery, 
  MarkNotificationAsReadParams, 
  AdminSendNotificationRequest 
} from './schema.js';
import WebSocket from 'ws';

// 에러 코드를 HTTP 상태 코드로 매핑하는 헬퍼 함수
function mapErrorCodeToStatusCode(code: string): number {
  switch (code) {
    case 'VALIDATION_001':
    case 'VALIDATION_002':
      return 409; // Conflict
    case 'AUTH_001':
    case 'AUTH_003':
    case 'AUTH_004':
      return 401; // Unauthorized
    case 'AUTH_002':
      return 403; // Forbidden
    case 'NOT_FOUND':
      return 404; // Not Found
    default:
      return 500; // Internal Server Error
  }
}

// 에러 응답 형식화
function formatErrorResponse(error: any) {
  return {
    success: false as const,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || '서버 내부 오류가 발생했습니다.',
      details: error.details || undefined
    }
  };
}

// 성공 응답 형식화
function formatSuccessResponse(data: any, meta?: any) {
  return {
    success: true as const,
    data,
    ...(meta && { meta })
  };
}

// WebSocket 연결 관리를 위한 맵
const clientConnections = new Map<string, WebSocket>();

// 실시간 알림을 위한 WebSocket 핸들러
export async function notificationWebSocketHandler(connection: any, request: any) {
  console.log('WebSocket handler called for user:', request.user?.userId);
  console.log('Connection keys:', Object.keys(connection));
  console.log('Connection socket:', connection.socket);
  const userId = request.user?.userId;
  if (!userId) {
    connection.close(1008, 'Unauthorized');
    return;
  }

  // 기존 연결이 있다면 닫기
  const existingConnection = clientConnections.get(userId);
  if (existingConnection) {
    console.log('Closing existing connection for user:', userId);
    existingConnection.close(1000, 'New connection replacing old one');
  }

  // 새 연결 저장
  console.log('Storing new connection for user:', userId);
  clientConnections.set(userId, connection);

  connection.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      // 클라이언트로부터의 메시지 처리 (필요시)
      console.log(`Message from user ${userId}:`, data);
    } catch (error) {
      console.error('Invalid message from client:', error);
    }
  });

  connection.on('close', () => {
    clientConnections.delete(userId);
    console.log(`WebSocket connection closed for user ${userId}`);
  });

  connection.on('error', (error: Error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    clientConnections.delete(userId);
  });

  // 연결 성공 메시지 전송
  console.log('Sending connected message to user:', userId);
  try {
    connection.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established for real-time notifications',
      timestamp: new Date().toISOString()
    }));
    console.log('Connected message sent successfully');
  } catch (error) {
    console.error('Error sending connected message:', error);
  }
}

// 새 알림을 특정 사용자에게 전송하는 함수
export function sendRealTimeNotification(userId: string, notification: any) {
  const connection = clientConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify({
      type: 'new_notification',
      data: notification,
      timestamp: new Date().toISOString()
    }));
    return true;
  }
  return false;
}

// 알림 목록 조회 핸들러
export async function getNotificationsHandler(
  request: FastifyRequest<{ Querystring: GetNotificationsQuery }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
    }
    const userService = new UserService(request.server);
    const result = await userService.getNotifications(
      request.user.userId,
      request.query.page,
      request.query.limit
    );
    
    return reply.status(200).send(formatSuccessResponse(result));
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code);
    return reply.status(statusCode).send(formatErrorResponse(error));
  }
}

// 알림 읽음 표시 핸들러
export async function markNotificationAsReadHandler(
  request: FastifyRequest<{ Params: MarkNotificationAsReadParams }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401);
    }
    const userService = new UserService(request.server);
    const result = await userService.markNotificationAsRead(
      request.user.userId,
      request.params.notificationId
    );
    
    return reply.status(200).send(formatSuccessResponse(result));
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code);
    return reply.status(statusCode).send(formatErrorResponse(error));
  }
}

// 관리자 알림 발송 핸들러
export async function adminSendNotificationHandler(
  request: FastifyRequest<{ Body: AdminSendNotificationRequest }>,
  reply: FastifyReply
) {
  try {
    // 관리자 권한 확인 (추후 구현)
    // const user = request.user;
    // if (user.role !== 'admin') {
    //   throw { code: 'AUTH_004', message: 'Forbidden' };
    // }

    const { userIds, userType, type, title, message, data } = request.body;
    
    // TODO: NotificationService 구현 필요
    // 임시로 사용자 서비스 활용
    const userService = new UserService(request.server);
    
    // 사용자 ID 목록 결정
    let targetUserIds: string[] = [];
    
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (userType) {
      // userType에 따라 사용자 조회
      const users = await request.server.prisma.user.findMany({
        where: {
          ...(userType === 'all' ? {} : { role: userType as any })
        },
        select: { id: true }
      });
      targetUserIds = users.map(user => user.id);
    }
    
    // 알림 생성
    const notifications = await Promise.all(
      targetUserIds.map(userId => 
        request.server.prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            data: data || {},
            isRead: false
          }
        })
      )
    );
    
    return reply.status(201).send(formatSuccessResponse({
      message: '알림이 성공적으로 발송되었습니다.',
      sentCount: notifications.length
    }));
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code);
    return reply.status(statusCode).send(formatErrorResponse(error));
  }
}