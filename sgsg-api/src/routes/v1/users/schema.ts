import { Type } from '@sinclair/typebox'
import { UserSchema, SuccessResponseSchema, ErrorResponseSchema } from '../../../types/schemas'

// ==================== 주소 스키마 ====================
export const AddressSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  label: Type.String(),
  addressLine1: Type.String(),
  addressLine2: Type.Optional(Type.String()),
  city: Type.String(),
  state: Type.String(),
  postalCode: Type.String(),
  country: Type.String({ default: 'South Korea' }),
  isDefault: Type.Optional(Type.Boolean({ default: false })),
  latitude: Type.Optional(Type.Number()),
  longitude: Type.Optional(Type.Number()),
  metadata: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
})

export const AddressCreateSchema = Type.Object({
  label: Type.String({ minLength: 1, maxLength: 50 }),
  addressLine1: Type.String({ minLength: 5, maxLength: 200 }),
  addressLine2: Type.Optional(Type.String({ maxLength: 200 })),
  city: Type.String({ minLength: 2, maxLength: 50 }),
  state: Type.String({ minLength: 2, maxLength: 50 }),
  postalCode: Type.String({ pattern: '^[0-9]{5}$' }),
  country: Type.Optional(Type.String({ default: 'South Korea' })),
  isDefault: Type.Optional(Type.Boolean()),
  latitude: Type.Optional(Type.Number()),
  longitude: Type.Optional(Type.Number()),
  metadata: Type.Optional(Type.Any())
})

export const AddressUpdateSchema = Type.Partial(AddressCreateSchema)

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
})

// ==================== 프로필 스키마 ====================

// 고객 정보 스키마
export const CustomerSchema = Type.Object({
  totalSpent: Type.Number({ minimum: 0 }),
  totalOrders: Type.Integer({ minimum: 0 }),
  favoriteCategories: Type.Array(Type.String()),
  lastServiceDate: Type.Optional(Type.String({ format: 'date-time' })),
  preferences: Type.Optional(Type.Any())
})

// 전체 프로필 응답 스키마
export const ProfileResponseSchema = Type.Object({
  user: UserSchema,
  defaultAddress: Type.Optional(AddressSchema),
  customer: Type.Optional(CustomerSchema)
  // expert와 admin 스키마도 필요하면 추가
})

export const ProfileUpdateSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
  avatarUrl: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Any())
})

// ==================== API 스키마 ====================

// 현재 사용자 프로필 조회 스키마
export const GetProfileSchema = {
  response: {
    200: SuccessResponseSchema(ProfileResponseSchema),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 현재 사용자 프로필 수정 스키마
export const UpdateProfileSchema = {
  body: ProfileUpdateSchema,
  response: {
    200: SuccessResponseSchema(ProfileResponseSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 사용자 주소록 조회 스키마
export const GetAddressesSchema = {
  response: {
    200: SuccessResponseSchema(Type.Array(AddressSchema)),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 주소 추가 스키마
export const AddAddressSchema = {
  body: AddressCreateSchema,
  response: {
    201: SuccessResponseSchema(AddressSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 주소 수정 스키마
export const UpdateAddressSchema = {
  params: Type.Object({
    addressId: Type.String()
  }),
  body: AddressUpdateSchema,
  response: {
    200: SuccessResponseSchema(AddressSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 주소 삭제 스키마
export const DeleteAddressSchema = {
  params: Type.Object({
    addressId: Type.String()
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      success: Type.Boolean()
    })),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 알림 목록 조회 스키마
export const GetNotificationsSchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 }))
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      notifications: Type.Array(NotificationSchema),
      pagination: Type.Object({
        page: Type.Number(),
        limit: Type.Number(),
        total: Type.Number(),
        pages: Type.Number()
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 알림 읽음 표시 스키마
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
}