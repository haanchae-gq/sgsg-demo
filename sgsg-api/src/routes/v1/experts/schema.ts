import { Type } from '@sinclair/typebox'
import {
  ExpertSchema,
  SubAccountSchema,
  MasterMembershipSchema,
  PenaltyHistorySchema,
  AssignmentHistorySchema,
  ExpertProfileUpdateRequestSchema,
  SubAccountCreateRequestSchema,
  SubAccountUpdateRequestSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationQuerySchema
} from '../../../types/schemas'

// 전문가 프로필 조회 응답 스키마
const ExpertProfileResponseSchema = SuccessResponseSchema(ExpertSchema)

// 서브 계정 목록 조회 응답 스키마
const SubAccountsResponseSchema = SuccessResponseSchema(Type.Array(SubAccountSchema))

// 멤버십 정보 조회 응답 스키마
const MembershipInfoResponseSchema = SuccessResponseSchema(
  Type.Object({
    membershipEnabled: Type.Boolean(),
    membershipSlotCount: Type.Integer({ minimum: 0 }),
    serviceCategoryMidAvailableList: Type.Array(Type.String()),
    usedSlots: Type.Integer({ minimum: 0 }),
    availableSlots: Type.Integer({ minimum: 0 }),
    masterMemberships: Type.Array(MasterMembershipSchema)
  })
)

// 배정 이력 조회 응답 스키마 (페이지네이션 포함)
const AssignmentHistoryResponseSchema = SuccessResponseSchema(
  Type.Object({
    histories: Type.Array(AssignmentHistorySchema),
    pagination: Type.Object({
      page: Type.Integer({ minimum: 1 }),
      limit: Type.Integer({ minimum: 1, maximum: 100 }),
      total: Type.Integer({ minimum: 0 }),
      totalPages: Type.Integer({ minimum: 0 })
    })
  })
)

// 패널티 이력 조회 응답 스키마
const PenaltyHistoryResponseSchema = SuccessResponseSchema(Type.Array(PenaltyHistorySchema))

// 전문가 프로필 조회 스키마
export const GetExpertProfileSchema = {
  response: {
    200: ExpertProfileResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 전문가 프로필 업데이트 스키마
export const UpdateExpertProfileSchema = {
  body: ExpertProfileUpdateRequestSchema,
  response: {
    200: ExpertProfileResponseSchema,
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 목록 조회 스키마
export const GetSubAccountsSchema = {
  response: {
    200: SubAccountsResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 생성 스키마
export const CreateSubAccountSchema = {
  body: SubAccountCreateRequestSchema,
  response: {
    201: SuccessResponseSchema(SubAccountSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 업데이트 스키마
export const UpdateSubAccountSchema = {
  params: Type.Object({
    subAccountId: Type.String()
  }),
  body: SubAccountUpdateRequestSchema,
  response: {
    200: SuccessResponseSchema(SubAccountSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    403: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 멤버십 정보 조회 스키마
export const GetMembershipInfoSchema = {
  response: {
    200: MembershipInfoResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 배정 이력 조회 스키마
export const GetAssignmentHistorySchema = {
  querystring: PaginationQuerySchema,
  response: {
    200: AssignmentHistoryResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 패널티 이력 조회 스키마
export const GetPenaltyHistorySchema = {
  response: {
    200: PenaltyHistoryResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}