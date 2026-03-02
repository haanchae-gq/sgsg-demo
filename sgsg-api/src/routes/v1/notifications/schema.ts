import { Static, Type } from '@sinclair/typebox';
import { SuccessResponseSchema, ErrorResponseSchema } from '../../../types/schemas.js';

// ==================== 알림 스키마 ====================
export const NotificationSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  type: Type.String(),
  title: Type.String(),
  message: Type.String(),
  data: Type.Optional(Type.Any()),
  isRead: Type.Boolean(),
  readAt: Type.Optional(Type.String({ format: 'date-time' })),
  createdAt: Type.String({ format: 'date-time' })
});

// ==================== 알림 목록 조회 ====================
export const GetNotificationsSchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 }))
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      notifications: Type.Array(NotificationSchema),
      pagination: Type.Object({
        page: Type.Integer(),
        limit: Type.Integer(),
        total: Type.Integer(),
        pages: Type.Integer()
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
};

export type GetNotificationsQuery = Static<typeof GetNotificationsSchema.querystring>;

// ==================== 알림 읽음 표시 ====================
export const MarkNotificationAsReadSchema = {
  params: Type.Object({
    notificationId: Type.String()
  }),
  response: {
    200: SuccessResponseSchema(NotificationSchema),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
};

export type MarkNotificationAsReadParams = Static<typeof MarkNotificationAsReadSchema.params>;

// ==================== 관리자 알림 발송 ====================
export const AdminSendNotificationSchema = {
  body: Type.Object({
    userIds: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
    userType: Type.Optional(Type.String()), // 'customer', 'expert', 'admin', 'all'
    type: Type.String(),
    title: Type.String({ minLength: 1, maxLength: 100 }),
    message: Type.String({ minLength: 1, maxLength: 500 }),
    data: Type.Optional(Type.Any())
  }, {
    // userIds나 userType 중 하나는 필수
    anyOf: [
      { required: ['userIds'] },
      { required: ['userType'] }
    ]
  }),
  response: {
    201: SuccessResponseSchema(Type.Object({
      message: Type.String(),
      sentCount: Type.Integer()
    })),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    403: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
};

export type AdminSendNotificationRequest = Static<typeof AdminSendNotificationSchema.body>;