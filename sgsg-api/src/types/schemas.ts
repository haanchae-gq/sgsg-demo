import { Type, type TSchema } from '@sinclair/typebox'

// ==================== 공통 필드 ====================
export const CommonFields = {
  id: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}

// ==================== 열거형(Enums) ====================
export const UserRole = Type.Union([
  Type.Literal('customer'),
  Type.Literal('expert'),
  Type.Literal('admin')
])

export const UserStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('pending'),
  Type.Literal('suspended')
])

export const AccountType = Type.Union([
  Type.Literal('MASTER'),
  Type.Literal('SUB')
])

// 전문가 관련 열거형
export const BusinessType = Type.Union([
  Type.Literal('individual'),
  Type.Literal('corporate')
])

export const ExpertStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('inactive'),
  Type.Literal('busy'),
  Type.Literal('vacation')
])

export const ExpertApprovalStatus = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('APPROVED'),
  Type.Literal('REJECTED')
])

export const ExpertActiveStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('INACTIVE')
])

export const PenaltyType = Type.Union([
  Type.Literal('SOFT_LIMIT'),
  Type.Literal('HARD_BLOCK'),
  Type.Literal('CATEGORY_LIMIT'),
  Type.Literal('REGION_LIMIT'),
  Type.Literal('MEMBERSHIP_SUSPEND')
])

export const PenaltyStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('EXPIRED')
])

export const AssignmentType = Type.Union([
  Type.Literal('AUTO_ASSIGN'),
  Type.Literal('MANUAL_ASSIGN'),
  Type.Literal('REASSIGN')
])

export const AssignmentResultStatus = Type.Union([
  Type.Literal('ACCEPTED'),
  Type.Literal('REJECTED'),
  Type.Literal('TIMEOUT'),
  Type.Literal('HOLD'),
  Type.Literal('SENT')
])

export const MembershipStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('SUSPENDED'),
  Type.Literal('INACTIVE'),
  Type.Literal('EXPIRED')
])

// ==================== 사용자 스키마 ====================
export const UserSchema = Type.Object({
  ...CommonFields,
  email: Type.String({ format: 'email' }),
  phone: Type.String({ pattern: '^01[0-9]{8,9}$' }),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  role: UserRole,
  status: UserStatus,
  avatarUrl: Type.Optional(Type.String()),
  emailVerified: Type.Optional(Type.Boolean()),
  phoneVerified: Type.Optional(Type.Boolean()),
  lastLoginAt: Type.Optional(Type.String({ format: 'date-time' }))
})

// ==================== 인증 스키마 ====================
// JWT 페이로드
export const JwtPayloadSchema = Type.Object({
  userId: Type.String(),
  email: Type.String({ format: 'email' }),
  role: UserRole,
  iat: Type.Number(),
  exp: Type.Number(),
  masterAccountId: Type.Optional(Type.String()),
  isSubAccount: Type.Optional(Type.Boolean()),
  type: Type.Optional(Type.String()), // 'access', 'refresh', 'reset'
  jti: Type.Optional(Type.String()) // JWT ID for refresh token uniqueness
})

// 회원가입 요청
export const RegisterRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  phone: Type.String({ pattern: '^01[0-9]{8,9}$' }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  role: UserRole
})

// 로그인 요청
export const LoginRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String()
})

// 인증 응답 (로그인/회원가입 성공 시)
export const AuthResponseSchema = Type.Object({
  user: UserSchema,
  accessToken: Type.String(),
  refreshToken: Type.String()
})

// 토큰 갱신 요청
export const RefreshTokenRequestSchema = Type.Object({
  refreshToken: Type.String()
})

// 비밀번호 재설정 요청
export const ForgotPasswordRequestSchema = Type.Object({
  email: Type.String({ format: 'email' })
})

// 비밀번호 재설정 확인
export const ResetPasswordRequestSchema = Type.Object({
  token: Type.String(),
  newPassword: Type.String({ minLength: 8, maxLength: 100 })
})

// ==================== 공통 응답 형식 ====================
// 성공 응답 생성자
export const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    data: dataSchema,
    meta: Type.Optional(
      Type.Object({
        page: Type.Integer({ minimum: 1 }),
        limit: Type.Integer({ minimum: 1, maximum: 100 }),
        total: Type.Integer({ minimum: 0 }),
        totalPages: Type.Integer({ minimum: 0 })
      })
    )
  })

// 에러 응답
export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String({ pattern: '^[A-Z_]+_[0-9]{3}$' }),
    message: Type.String(),
    details: Type.Optional(Type.Any())
  })
})

// ==================== 페이지네이션 쿼리 ====================
export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  sortBy: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]))
})

// ==================== 검색 쿼리 ====================
export const SearchQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  filters: Type.Optional(Type.Record(Type.String(), Type.Any()))
})

// ==================== 전문가 스키마 ====================
// 전문가 기본 정보
export const ExpertSchema = Type.Object({
  ...CommonFields,
  userId: Type.String(),
  businessName: Type.String({ minLength: 1, maxLength: 100 }),
  businessNumber: Type.String({ pattern: '^[0-9]{3}-[0-9]{2}-[0-9]{5}$' }),
  businessType: BusinessType,
  businessAddressId: Type.Optional(Type.String()),
  serviceRegions: Type.Array(Type.String()),
  rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
  totalCompletedOrders: Type.Integer({ minimum: 0 }),
  totalEarnings: Type.Number({ minimum: 0 }),
  operationalStatus: ExpertStatus,
  bankName: Type.Optional(Type.String()),
  accountNumber: Type.Optional(Type.String()),
  accountHolder: Type.Optional(Type.String()),
  introduction: Type.Optional(Type.String({ maxLength: 1000 })),
  certificateUrls: Type.Array(Type.String()),
  portfolioImages: Type.Array(Type.String()),
  approvalStatus: ExpertApprovalStatus,
  activeStatus: ExpertActiveStatus,
  membershipEnabled: Type.Boolean(),
  membershipSlotCount: Type.Integer({ minimum: 0 }),
  serviceCategoryMidAvailableList: Type.Array(Type.String()),
  regionGroups: Type.Array(Type.String()),
  user: Type.Optional(UserSchema) // 관계 확장 시 사용
})

// 서브 계정 스키마
export const SubAccountSchema = Type.Object({
  ...CommonFields,
  userId: Type.String(),
  masterAccountId: Type.String(),
  accountType: AccountType,
  approvalStatus: ExpertApprovalStatus,
  activeStatus: ExpertActiveStatus,
  isActive: Type.Boolean(),
  permissions: Type.Array(Type.String()),
  assignedWorkerId: Type.Optional(Type.String()),
  user: Type.Optional(UserSchema)
})

// 마스터 멤버십 스키마
export const MasterMembershipSchema = Type.Object({
  ...CommonFields,
  masterExpertId: Type.String(),
  subAccountId: Type.String(),
  membershipStatus: MembershipStatus,
  assignedMidList: Type.Array(Type.String()),
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
  notes: Type.Optional(Type.String())
})

// 패널티 이력 스키마
export const PenaltyHistorySchema = Type.Object({
  ...CommonFields,
  expertId: Type.String(),
  penaltyType: PenaltyType,
  penaltyStatus: PenaltyStatus,
  reasonCode: Type.String(),
  reasonText: Type.Optional(Type.String()),
  adminId: Type.Optional(Type.String()),
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.Optional(Type.String({ format: 'date-time' })),
  metadata: Type.Optional(Type.Any())
})

// 배정 이력 스키마
export const AssignmentHistorySchema = Type.Object({
  ...CommonFields,
  orderId: Type.String(),
  expertId: Type.String(),
  assignmentType: AssignmentType,
  resultStatus: AssignmentResultStatus,
  assignedBy: Type.Optional(Type.String()),
  assignedAt: Type.String({ format: 'date-time' }),
  respondedAt: Type.Optional(Type.String({ format: 'date-time' })),
  responseNotes: Type.Optional(Type.String())
})

// 전문가 프로필 업데이트 요청
export const ExpertProfileUpdateRequestSchema = Type.Object({
  businessName: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  businessType: Type.Optional(BusinessType),
  introduction: Type.Optional(Type.String({ maxLength: 1000 })),
  certificateUrls: Type.Optional(Type.Array(Type.String())),
  portfolioImages: Type.Optional(Type.Array(Type.String())),
  bankName: Type.Optional(Type.String()),
  accountNumber: Type.Optional(Type.String()),
  accountHolder: Type.Optional(Type.String())
})

// 서브 계정 생성 요청
export const SubAccountCreateRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  phone: Type.String({ pattern: '^01[0-9]{8,9}$' }),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
  permissions: Type.Array(Type.String())
})

// 서브 계정 업데이트 요청
export const SubAccountUpdateRequestSchema = Type.Object({
  permissions: Type.Optional(Type.Array(Type.String())),
  isActive: Type.Optional(Type.Boolean())
})

// ==================== TypeScript 타입 추출 ====================
import type { Static } from '@sinclair/typebox'

export type User = Static<typeof UserSchema>
export type JwtPayload = Static<typeof JwtPayloadSchema>
export type RegisterRequest = Static<typeof RegisterRequestSchema>
export type LoginRequest = Static<typeof LoginRequestSchema>
export type AuthResponse = Static<typeof AuthResponseSchema>
export type RefreshTokenRequest = Static<typeof RefreshTokenRequestSchema>
export type ForgotPasswordRequest = Static<typeof ForgotPasswordRequestSchema>
export type ResetPasswordRequest = Static<typeof ResetPasswordRequestSchema>
export type PaginationQuery = Static<typeof PaginationQuerySchema>
export type SearchQuery = Static<typeof SearchQuerySchema>

// 전문가 관련 타입
export type Expert = Static<typeof ExpertSchema>
export type SubAccount = Static<typeof SubAccountSchema>
export type MasterMembership = Static<typeof MasterMembershipSchema>
export type PenaltyHistory = Static<typeof PenaltyHistorySchema>
export type AssignmentHistory = Static<typeof AssignmentHistorySchema>
export type ExpertProfileUpdateRequest = Static<typeof ExpertProfileUpdateRequestSchema>
export type SubAccountCreateRequest = Static<typeof SubAccountCreateRequestSchema>
export type SubAccountUpdateRequest = Static<typeof SubAccountUpdateRequestSchema>