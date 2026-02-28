# 백엔드 API 명세 (Fastify + TypeBox)

**문서 버전**: 3.0 (Fastify + Ant Design Migration)  
**작성일**: 2026-02-28  
**우선순위**: P0 (최우선)  
**상태**: 신규 스펙  
**Base URL**: `/api/v1`  
**관련 문서**: [01_ARCHITECTURE_DESIGN.md](01_ARCHITECTURE_DESIGN.md), [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md)

---

## 📋 목차

1. [API 설계 원칙](#api-설계-원칙)
2. [인증 및 권한](#인증-및-권한)
3. [공통 응답 형식](#공통-응답-형식)
4. [TypeBox 스키마 정의](#typebox-스키마-정의)
5. [API 엔드포인트](#api-엔드포인트)
6. [에러 처리](#에러-처리)
7. [테스트 전략](#테스트-전략)
8. [성능 고려사항](#성능-고려사항)

---

## API 설계 원칙

### 1. RESTful 설계 (Fastify 최적화)
- **리소스 중심 URL 구조**: `/api/v1/{resource}/{id}/{sub-resource}`
- **HTTP 메서드 의미론적 사용**: GET(조회), POST(생성), PUT(전체 수정), PATCH(부분 수정), DELETE(삭제)
- **상태 코드 적절한 사용**: 200(성공), 201(Created), 204(No Content), 400(Bad Request), 401(Unauthorized), 403(Forbidden), 404(Not Found), 422(Validation Error), 500(Internal Server Error)

### 2. 버전 관리
- **URL 기반 버전 관리**: `/api/v1/*` (향후 v2 확장 가능)
- **하위 호환성 유지**: 필드 추가는 허용, 필드 제거나 타입 변경은 금지

### 3. 타입 안정성 (TypeBox + Prisma)
- **엔드투엔드 타입 안정성**: TypeBox로 요청/응답 스키마 정의 → Prisma 클라이언트 타입과 일치
- **자동 문서화**: Fastify 스웨거 자동 생성 (Fastify/Swagger 통합)
- **컴파일 타임 검증**: TypeScript로 모든 API 인터페이스 검증

### 4. 보안
- **HTTPS 필수**: Production 환경에서만 적용
- **JWT 토큰 기반 인증**: `Authorization: Bearer <token>`
- **Rate Limiting**: `@fastify/rate-limit` 플러그인 적용 (IP당 분당 100회)
- **Input Validation**: TypeBox 스키마로 모든 입력값 검증
- **CORS**: `@fastify/cors`로 허용된 도메인만 접근 가능

### 5. 성능
- **Fastify 최적화**: 기본적으로 Express 대비 2배 이상 빠른 성능
- **캐싱 전략**: Redis 캐시 적용 (자주 조회되는 데이터)
- **DB 쿼리 최적화**: Prisma 쿼리 빌더로 N+1 문제 방지
- **압축**: `@fastify/compress`로 응답 압축 (gzip, brotli)

### 6. 확장성
- **플러그인 아키텍처**: Fastify 플러그인으로 기능 모듈화
- **수평 확장**: Stateless 설계로 여러 인스턴스 배포 가능
- **메시지 큐**: 비동기 작업은 BullMQ로 처리

---

## 인증 및 권한

### 인증 방식
```
Authorization: Bearer <JWT_TOKEN>
```

### JWT 토큰 구조 (TypeBox 스키마)
```typescript
import { Type } from '@sinclair/typebox'

const JwtPayloadSchema = Type.Object({
  userId: Type.String({ format: 'cuid' }),
  email: Type.String({ format: 'email' }),
  role: Type.Union([
    Type.Literal('customer'),
    Type.Literal('expert'),
    Type.Literal('admin')
  ]),
  iat: Type.Number(),
  exp: Type.Number(),
  // 마스터/서브 계정 정보
  masterAccountId: Type.Optional(Type.String()),
  isSubAccount: Type.Optional(Type.Boolean())
})
```

### 토큰 관리
- **액세스 토큰**: 1시간 유효기간, JWT HS256 알고리즘
- **리프레시 토큰**: 7일 유효기간, 데이터베이스 저장 (Redis 권장)
- **토큰 갱신 엔드포인트**: `POST /api/v1/auth/refresh`

### 권한 레벨
| 권한 | 설명 | 접근 가능 API |
|------|------|---------------|
| **Public** | 인증 불필요 | 회원가입, 로그인, 서비스 카탈로그 조회 |
| **Authenticated** | 로그인 필요 | 사용자 프로필, 주문 생성, 리뷰 작성 |
| **Expert** | 전문가 권한 필요 | 전문가 대시보드, 스케줄 관리, 정산 내역 |
| **Admin** | 관리자 권한 필요 | 모든 관리자 API, 사용자 관리, 통계 |

### 마스터/서브 계정 권한 위임
- **마스터 계정**: 모든 권한 보유, 서브 계정 생성/관리 가능
- **서브 계정**: 마스터가 위임한 권한만 사용 가능 (제한된 주문 접근, 일부 설정 변경)
- **권한 위임 시스템**: RBAC 기반 세분화 권한 관리

---

## 공통 응답 형식

### 성공 응답 (TypeBox 스키마)
```typescript
const SuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
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
```

**예시**:
```json
{
  "success": true,
  "data": {
    "id": "clt2a3b4c5d6e",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 에러 응답 (TypeBox 스키마)
```typescript
const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String({ pattern: '^[A-Z_]+_[0-9]{3}$' }),
    message: Type.String(),
    details: Type.Optional(Type.Any())
  })
})
```

**에러 코드 체계**:
- `AUTH_001`: 인증 토큰이 유효하지 않습니다.
- `AUTH_002`: 접근 권한이 없습니다.
- `VALID_001`: 필수 필드가 누락되었습니다.
- `DB_001`: 데이터베이스 오류가 발생했습니다.
- `NOT_FOUND_001`: 요청한 리소스를 찾을 수 없습니다.

---

## TypeBox 스키마 정의

### 공통 스키마
```typescript
// 공통 필드
const CommonFields = {
  id: Type.String({ format: 'cuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}

// 열거형(Enums)
const UnitType = Type.Union([
  Type.Literal('EA'),
  Type.Literal('AREA'),
  Type.Literal('TIME'),
  Type.Literal('METER'),
  Type.Literal('SET')
])
const FeeType = Type.Union([
  Type.Literal('FIXED'),
  Type.Literal('UNIT_BASED')
])
const ServiceCategoryType = Type.Union([
  Type.Literal('SUBCATEGORY'),
  Type.Literal('ITEM')
])
const MappingLevel = Type.Union([
  Type.Literal('LEVEL2'),
  Type.Literal('LEVEL3')
])
const FieldType = Type.Union([
  Type.Literal('TEXT'),
  Type.Literal('NUMBER'),
  Type.Literal('DATE'),
  Type.Literal('SELECT'),
  Type.Literal('CHECKBOX'),
  Type.Literal('RADIO')
])
const DisplayLocation = Type.Union([
  Type.Literal('ORDER_BACKOFFICE_ONLY'),
  Type.Literal('EXPERT_APP_ONLY'),
  Type.Literal('BOTH')
])
const CommissionType = Type.Union([
  Type.Literal('RATE'),
  Type.Literal('FIXED')
])
const VatBasis = Type.Union([
  Type.Literal('INCLUDED'),
  Type.Literal('EXCLUDED')
])

// 채널 관리 열거형
const ChannelType = Type.Union([
  Type.Literal('INTERNAL'),
  Type.Literal('PARTNER')
])
const ChannelStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('INACTIVE')
])

// 전문가 관리 확장 열거형
const AccountType = Type.Union([
  Type.Literal('MASTER'),
  Type.Literal('SUB')
])
const ExpertApprovalStatus = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('APPROVED'),
  Type.Literal('REJECTED')
])
const ExpertActiveStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('INACTIVE')
])
const PenaltyType = Type.Union([
  Type.Literal('SOFT_LIMIT'),
  Type.Literal('HARD_BLOCK'),
  Type.Literal('CATEGORY_LIMIT'),
  Type.Literal('REGION_LIMIT'),
  Type.Literal('MEMBERSHIP_SUSPEND')
])
const PenaltyStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('EXPIRED')
])
const AssignmentType = Type.Union([
  Type.Literal('AUTO_ASSIGN'),
  Type.Literal('MANUAL_ASSIGN'),
  Type.Literal('REASSIGN')
])
const AssignmentResultStatus = Type.Union([
  Type.Literal('ACCEPTED'),
  Type.Literal('REJECTED'),
  Type.Literal('TIMEOUT'),
  Type.Literal('HOLD'),
  Type.Literal('SENT')
])
const PenaltyReasonCode = Type.Union([
  Type.Literal('HIGH_REJECTION'),
  Type.Literal('HIGH_TIMEOUT'),
  Type.Literal('CUSTOMER_COMPLAINT'),
  Type.Literal('POLICY_VIOLATION'),
  Type.Literal('MANUAL')
])
const MembershipStatus = Type.Union([
  Type.Literal('ACTIVE'),
  Type.Literal('SUSPENDED'),
  Type.Literal('INACTIVE'),
  Type.Literal('EXPIRED')
])

// 페이지네이션 쿼리
const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  sortBy: Type.Optional(Type.String()),
  sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]))
})

// 검색 쿼리
const SearchQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  filters: Type.Optional(Type.Record(Type.String(), Type.Any()))
})
```

### 주요 리소스 스키마
```typescript
// 사용자
const UserSchema = Type.Object({
  ...CommonFields,
  email: Type.String({ format: 'email' }),
  phone: Type.String({ pattern: '^01[0-9]{8,9}$' }),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  role: Type.Union([
    Type.Literal('customer'),
    Type.Literal('expert'),
    Type.Literal('admin')
  ]),
  status: Type.Union([
    Type.Literal('active'),
    Type.Literal('inactive'),
    Type.Literal('pending'),
    Type.Literal('suspended')
  ])
})

// 전문가
const ExpertSchema = Type.Object({
  ...CommonFields,
  businessName: Type.String({ minLength: 1, maxLength: 100 }),
  businessNumber: Type.String({ pattern: '^[0-9]{10}$' }),
  rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
  expertStatus: Type.Union([
    Type.Literal('active'),
    Type.Literal('inactive'),
    Type.Literal('busy'),
    Type.Literal('vacation')
  ]),
  // 전문가 관리 확장 필드
  accountType: AccountType,
  approvalStatus: ExpertApprovalStatus,
  activeStatus: ExpertActiveStatus,
  serviceCategoryMidAvailableList: Type.Array(Type.String()), // 서비스 가능 중분류 ID 목록
  serviceRegionList: Type.Array(Type.String()), // 서비스 가능 지역코드 목록
  regionGroups: Type.Array(Type.String()), // 권역 그룹 목록 (자동 매핑)
  membershipEnabled: Type.Boolean(),
  membershipSlotCount: Type.Integer({ minimum: 0 }),
  membershipStatus: MembershipStatus,
  // 관계 정보
  masterAccountId: Type.Optional(Type.String()), // 서브 계정인 경우 소속 마스터 계정 ID
  subAccountIds: Type.Optional(Type.Array(Type.String())), // 마스터 계정인 경우 서브 계정 ID 목록
  // 메타데이터
  contractStartDate: Type.Optional(Type.String({ format: 'date-time' })),
  contractEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  internalMemo: Type.Optional(Type.String({ maxLength: 1000 }))
})

// 전문가 관리 확장 스키마
// 서브 계정
const SubAccountSchema = Type.Object({
  ...CommonFields,
  masterAccountId: Type.String(),
  userId: Type.String(),
  accountType: Type.Literal('SUB'),
  approvalStatus: ExpertApprovalStatus,
  activeStatus: ExpertActiveStatus,
  assignedWorkerId: Type.Optional(Type.String())
})

// 마스터 계정 멤버십
const MasterMembershipSchema = Type.Object({
  ...CommonFields,
  masterAccountId: Type.String(),
  membershipEnabled: Type.Boolean(),
  membershipStatus: MembershipStatus,
  membershipSlotCount: Type.Integer({ minimum: 1 }),
  membershipMidList: Type.Array(Type.String()),
  membershipRegionGroups: Type.Array(Type.String()),
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.Optional(Type.String({ format: 'date-time' }))
})

// 패널티 이력
const PenaltyHistorySchema = Type.Object({
  ...CommonFields,
  masterAccountId: Type.String(),
  penaltyType: PenaltyType,
  penaltyStatus: PenaltyStatus,
  reasonCode: PenaltyReasonCode,
  reasonDetail: Type.Optional(Type.String()),
  appliedByAdminId: Type.String(),
  targetMidList: Type.Array(Type.String()),
  targetRegionGroups: Type.Array(Type.String()),
  startDate: Type.String({ format: 'date-time' }),
  endDate: Type.Optional(Type.String({ format: 'date-time' }))
})

// 배정 이력
const AssignmentHistorySchema = Type.Object({
  ...CommonFields,
  orderId: Type.String(),
  assignedMasterId: Type.String(),
  assignedWorkerId: Type.Optional(Type.String()),
  assignmentType: AssignmentType,
  assignmentResultStatus: AssignmentResultStatus,
  isMembershipAssignment: Type.Boolean(),
  membershipSlotCountAtTime: Type.Integer({ minimum: 0 }),
  weightAtTime: Type.Number({ minimum: 0 }),
  serviceMidAtTime: Type.String(),
  regionGroupAtTime: Type.String(),
  assignedAt: Type.String({ format: 'date-time' }),
  respondedAt: Type.Optional(Type.String({ format: 'date-time' }))
})

// 마스터 계정 배정 정책
const MasterAssignmentPolicySchema = Type.Object({
  ...CommonFields,
  masterAccountId: Type.String(),
  dailyAssignmentLimit: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean(),
  effectiveFrom: Type.String({ format: 'date-time' }),
  effectiveTo: Type.Optional(Type.String({ format: 'date-time' }))
})

// 지역 그룹 매핑
const RegionGroupSchema = Type.Object({
  ...CommonFields,
  regionCode: Type.String(),
  regionGroup: Type.String(),
  isActive: Type.Boolean()
})

// 서비스 대분류 (Level 1)
const ServiceCategorySchema = Type.Object({
  ...CommonFields,
  code: Type.String({ pattern: '^[0-9]{2}$' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String()),
  displayOrder: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean()
})

// 서비스 중분류 (Level 2)
const ServiceSubcategorySchema = Type.Object({
  ...CommonFields,
  categoryId: Type.String(),
  code: Type.String({ pattern: '^[0-9]{4}$' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String()),
  membershipAvailable: Type.Boolean(),
  displayOrder: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean()
})

// 서비스 소분류 (Level 3)
const ServiceItemSchema = Type.Object({
  ...CommonFields,
  subcategoryId: Type.String(),
  code: Type.String({ pattern: '^[0-9]{6}$' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String()),
  displayOrder: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean()
})

// 서비스 기본비용 관리
const ServiceItemPriceSchema = Type.Object({
  ...CommonFields,
  serviceItemId: Type.String(),
  basePrice: Type.Number({ minimum: 0 }),
  unitType: UnitType,
  minPrice: Type.Optional(Type.Number({ minimum: 0 })),
  vatIncluded: Type.Boolean(),
  effectiveStartDate: Type.String({ format: 'date-time' }),
  effectiveEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  priceVersion: Type.Integer({ minimum: 1 }),
  isActive: Type.Boolean(),
  createdBy: Type.String()
})

// 현장비용 카테고리 마스터
const OnSiteFeeCategorySchema = Type.Object({
  ...CommonFields,
  code: Type.String(),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  description: Type.Optional(Type.String()),
  feeType: FeeType,
  baseAmount: Type.Number({ minimum: 0 }),
  vatIncluded: Type.Boolean(),
  settlementIncluded: Type.Boolean(),
  isActive: Type.Boolean()
})

// 서비스-현장비용 매핑
const ServiceFeeMappingSchema = Type.Object({
  ...CommonFields,
  serviceCategoryId: Type.String(),
  serviceCategoryType: ServiceCategoryType,
  onSiteFeeCategoryId: Type.String(),
  mappingLevel: MappingLevel,
  isRequired: Type.Boolean(),
  maxQuantity: Type.Optional(Type.Integer({ minimum: 1 })),
  effectiveStartDate: Type.String({ format: 'date-time' }),
  effectiveEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  mappingVersion: Type.Integer({ minimum: 1 }),
  isActive: Type.Boolean(),
  createdBy: Type.String()
})

// 서비스 추가입력항목
const ServiceExtraFieldSchema = Type.Object({
  ...CommonFields,
  serviceCategoryId: Type.String(),
  serviceCategoryType: ServiceCategoryType,
  fieldKey: Type.String({ pattern: '^[a-zA-Z0-9_]+$' }),
  label: Type.String({ minLength: 1, maxLength: 100 }),
  fieldType: FieldType,
  options: Type.Optional(Type.Any()),
  isRequired: Type.Boolean(),
  displayLocation: DisplayLocation,
  sortOrder: Type.Integer({ minimum: 0 }),
  isActive: Type.Boolean()
})

// 채널 마스터
const ChannelSchema = Type.Object({
  ...CommonFields,
  channelCode: Type.String({ pattern: '^[a-zA-Z0-9_-]+$' }),
  channelName: Type.String({ minLength: 1, maxLength: 100 }),
  channelType: ChannelType,
  channelStatus: ChannelStatus,
  partnerCompanyName: Type.Optional(Type.String({ maxLength: 200 })),
  partnerContactName: Type.Optional(Type.String({ maxLength: 50 })),
  partnerContactEmail: Type.Optional(Type.String({ format: 'email' })),
  partnerContactPhone: Type.Optional(Type.String({ pattern: '^01[0-9]{8,9}$' })),
  note: Type.Optional(Type.String({ maxLength: 1000 })),
  sortOrder: Type.Integer({ minimum: 0 })
})

// 채널별 수수료 설정
const ChannelCommissionSchema = Type.Object({
  ...CommonFields,
  serviceItemId: Type.String(),
  channelCode: Type.String(),
  commissionType: CommissionType,
  commissionValue: Type.Number({ minimum: 0 }),
  vatBasis: VatBasis,
  effectiveStartDate: Type.String({ format: 'date-time' }),
  effectiveEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  commissionVersion: Type.Integer({ minimum: 1 }),
  isActive: Type.Boolean(),
  createdBy: Type.String()
})

// 전문가-서비스 매핑
const ExpertServiceMappingSchema = Type.Object({
  ...CommonFields,
  expertId: Type.String(),
  serviceItemId: Type.String(),
  customPrice: Type.Optional(Type.Number({ minimum: 0 })),
  isAvailable: Type.Boolean()
})

// 주문
const OrderSchema = Type.Object({
  ...CommonFields,
  orderNumber: Type.String({ pattern: '^ORD-[0-9]{10}$' }),
  status: Type.Union([
    Type.Literal('new'),
    Type.Literal('consult_required'),
    Type.Literal('schedule_pending'),
    Type.Literal('schedule_confirmed'),
    Type.Literal('in_progress'),
    Type.Literal('payment_pending'),
    Type.Literal('paid'),
    Type.Literal('as_requested'),
    Type.Literal('cancelled')
  ]),
  totalAmount: Type.Number({ minimum: 0 })
})
```

---

## API 엔드포인트

### 1. 인증 API (`/api/v1/auth`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/auth/register` | 회원가입 (사용자 생성) | Public |
| POST | `/auth/login` | 이메일/비밀번호 로그인 | Public |
| POST | `/auth/logout` | 로그아웃 (토큰 무효화) | Authenticated |
| POST | `/auth/refresh` | 토큰 갱신 | Public (리프레시 토큰 필요) |
| POST | `/auth/verify-email` | 이메일 인증 | Public |
| POST | `/auth/verify-phone` | 휴대폰 인증 | Public |
| POST | `/auth/forgot-password` | 비밀번호 재설정 요청 | Public |
| POST | `/auth/reset-password` | 비밀번호 재설정 | Public |

### 2. 사용자 관리 API (`/api/v1/users`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/users/me` | 현재 사용자 프로필 조회 | Authenticated |
| PUT | `/users/me` | 현재 사용자 프로필 수정 | Authenticated |
| GET | `/users/me/addresses` | 사용자 주소록 조회 | Authenticated |
| POST | `/users/me/addresses` | 주소 추가 | Authenticated |
| PUT | `/users/me/addresses/:addressId` | 주소 수정 | Authenticated |
| DELETE | `/users/me/addresses/:addressId` | 주소 삭제 | Authenticated |
| GET | `/users/me/notifications` | 알림 목록 조회 | Authenticated |
| PUT | `/users/me/notifications/:notificationId/read` | 알림 읽음 표시 | Authenticated |

### 3. 전문가 관리 API (`/api/v1/experts`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/experts/me` | 전문가 프로필 조회 | Expert |
| PUT | `/experts/me` | 전문가 프로필 수정 | Expert |
| GET | `/experts/me/services` | 전문가 서비스 매핑 조회 | Expert |
| POST | `/experts/me/services` | 서비스 매핑 추가 | Expert |
| PUT | `/experts/me/services/:mappingId` | 서비스 매핑 수정 | Expert |
| DELETE | `/experts/me/services/:mappingId` | 서비스 매핑 삭제 | Expert |
| GET | `/experts/me/schedule` | 스케줄 조회 | Expert |
| POST | `/experts/me/schedule` | 스케줄 추가 | Expert |
| PUT | `/experts/me/schedule/:scheduleId` | 스케줄 수정 | Expert |
| DELETE | `/experts/me/schedule/:scheduleId` | 스케줄 삭제 | Expert |
| GET | `/experts/me/orders` | 전문가 주문 목록 | Expert |
| GET | `/experts/me/settlements` | 정산 내역 조회 | Expert |
| POST | `/experts/me/sub-accounts` | 서브 계정 생성 | Expert (마스터만) |
| GET | `/experts/me/sub-accounts` | 서브 계정 목록 조회 | Expert (마스터만) |
| PUT | `/experts/me/sub-accounts/:subAccountId` | 서브 계정 수정 | Expert (마스터만) |
| GET | `/experts/me/membership` | 멤버십 정보 조회 | Expert |
| GET | `/experts/me/assignment-history` | 배정 이력 조회 | Expert |
| GET | `/experts/me/penalties` | 패널티 상태 조회 | Expert |
| GET | `/experts/me/daily-assignment-limit` | 일일 배정 상한 조회 | Expert |
| GET | `/experts/me/statistics` | 통계 요약 조회 | Expert |
| GET | `/experts/me/audit-logs` | 변경 이력 조회 | Expert |

### 4. 서비스 카탈로그 API (`/api/v1/services`)
**3계층 서비스 구조**: 대분류(Level 1) → 중분류(Level 2) → 소분류(Level 3) 계층적 서비스 카탈로그

#### 4.1 대분류 (Service Categories - Level 1)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/services/categories` | 대분류 목록 조회 (트리 구조 포함) | Public |
| GET | `/services/categories/:categoryId` | 대분류 상세 정보 | Public |
| GET | `/services/categories/:categoryId/subcategories` | 해당 대분류의 중분류 목록 | Public |

#### 4.2 중분류 (Service Subcategories - Level 2)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/services/subcategories` | 중분류 목록 조회 (필터링 가능) | Public |
| GET | `/services/subcategories/:subcategoryId` | 중분류 상세 정보 | Public |
| GET | `/services/subcategories/:subcategoryId/items` | 해당 중분류의 소분류 목록 | Public |
| GET | `/services/subcategories/:subcategoryId/membership-info` | 멤버십 적용 정보 조회 | Public |

#### 4.3 소분류 (Service Items - Level 3)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/services/items` | 소분류 목록 조회 (필터링 가능) | Public |
| GET | `/services/items/:itemId` | 소분류 상세 정보 | Public |
| GET | `/services/items/:itemId/prices` | 소분류 가격 정보 조회 | Public |
| GET | `/services/items/:itemId/on-site-fees` | 소분류 현장비용 항목 조회 | Public |
| GET | `/services/items/:itemId/extra-fields` | 소분류 추가입력항목 조회 | Public |
| GET | `/services/items/:itemId/experts` | 해당 서비스 제공 전문가 목록 | Public |
| GET | `/services/items/:itemId/channel-commissions` | 채널별 수수료 정보 조회 | Admin |

### 5. 주문 관리 API (`/api/v1/orders`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/orders` | 주문 생성 | Authenticated |
| GET | `/orders` | 주문 목록 조회 (필터링) | Authenticated |
| GET | `/orders/:orderId` | 주문 상세 정보 | Authenticated (본인 주문만) |
| PUT | `/orders/:orderId` | 주문 정보 수정 | Authenticated (본인 주문만) |
| POST | `/orders/:orderId/cancel` | 주문 취소 요청 | Authenticated (본인 주문만) |
| POST | `/orders/:orderId/notes` | 주문 메모 추가 | Authenticated (관련 전문가/관리자) |
| GET | `/orders/:orderId/notes` | 주문 메모 목록 조회 | Authenticated (관련 전문가/관리자) |
| POST | `/orders/:orderId/attachments` | 첨부파일 업로드 | Authenticated (관련 전문가/관리자) |
| GET | `/orders/:orderId/attachments` | 첨부파일 목록 조회 | Authenticated (관련 전문가/관리자) |

### 6. 결제 API (`/api/v1/payments`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/payments/initialize` | 결제 초기화 (PG 연동) | Authenticated |
| POST | `/payments/complete` | 결제 완료 처리 (PG 콜백) | Public (PG 서버만) |
| GET | `/payments/:paymentId` | 결제 정보 조회 | Authenticated |
| POST | `/payments/:paymentId/refund` | 결제 환불 요청 | Authenticated (관리자만) |

### 7. 리뷰 API (`/api/v1/reviews`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/reviews` | 리뷰 작성 (주문 완료 후) | Authenticated (고객만) |
| GET | `/reviews` | 리뷰 목록 조회 (필터링) | Public |
| GET | `/reviews/:reviewId` | 리뷰 상세 정보 | Public |
| PUT | `/reviews/:reviewId` | 리뷰 수정 | Authenticated (작성자만) |
| DELETE | `/reviews/:reviewId` | 리뷰 삭제 | Authenticated (작성자만) |
| POST | `/reviews/:reviewId/helpful` | 도움됨 표시 | Authenticated |

### 8. 관리자 API (`/api/v1/admin`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/users` | 사용자 관리 목록 | Admin |
| PUT | `/admin/users/:userId/status` | 사용자 상태 변경 | Admin |
| GET | `/admin/orders` | 모든 주문 목록 | Admin |
| PUT | `/admin/orders/:orderId/status` | 주문 상태 강제 변경 | Admin |
| GET | `/admin/experts` | 전문가 관리 목록 | Admin |
| POST | `/admin/experts/:expertId/verify` | 전문가 검증 승인 | Admin |
| GET | `/admin/settlements` | 정산 관리 목록 | Admin |
| POST | `/admin/settlements/:settlementId/approve` | 정산 승인 | Admin |
| POST | `/admin/settlements/:settlementId/pay` | 정산 지급 완료 처리 | Admin |
| GET | `/admin/dashboard/stats` | 대시보드 통계 | Admin |
| GET | `/admin/audit-logs` | 감사 로그 조회 | Admin |

### 9. 실시간 알림 API (`/api/v1/notifications`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/notifications` | 알림 목록 조회 | Authenticated |
| PUT | `/notifications/:notificationId/read` | 알림 읽음 표시 | Authenticated |
| DELETE | `/notifications/:notificationId` | 알림 삭제 | Authenticated |
| POST | `/notifications/send` | 알림 발송 (관리자) | Admin |

### 10. 파일 업로드 API (`/api/v1/upload`)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/upload` | 파일 업로드 (이미지, 문서) | Authenticated |
| DELETE | `/upload/:fileId` | 파일 삭제 | Authenticated (업로더만) |

### 11. 서비스 관리 API (관리자) (`/api/v1/admin/services`)
**백오피스 메뉴 03 서비스관리 기능을 위한 관리자 전용 API**

#### 11.1 서비스 카테고리 관리 (대분류/중분류/소분류)
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/admin/services/categories` | 대분류 생성 | Admin |
| PUT | `/admin/services/categories/:categoryId` | 대분류 수정 | Admin |
| DELETE | `/admin/services/categories/:categoryId` | 대분류 비활성화 | Admin |
| POST | `/admin/services/categories/:categoryId/subcategories` | 중분류 생성 | Admin |
| PUT | `/admin/services/subcategories/:subcategoryId` | 중분류 수정 | Admin |
| DELETE | `/admin/services/subcategories/:subcategoryId` | 중분류 비활성화 | Admin |
| POST | `/admin/services/subcategories/:subcategoryId/items` | 소분류 생성 | Admin |
| PUT | `/admin/services/items/:itemId` | 소분류 수정 | Admin |
| DELETE | `/admin/services/items/:itemId` | 소분류 비활성화 | Admin |
| GET | `/admin/services/tree` | 전체 서비스 트리 구조 조회 | Admin |
| PUT | `/admin/services/subcategories/:subcategoryId/membership-available` | 중분류 멤버십 적용 가능 여부 설정 | Admin |

#### 11.2 서비스 기본비용 관리
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/items/:itemId/prices` | 소분류 가격 이력 조회 | Admin |
| POST | `/admin/services/items/:itemId/prices` | 소분류 기본비용 등록 | Admin |
| PUT | `/admin/services/items/:itemId/prices/:priceId` | 가격 수정 (신규 버전 생성) | Admin |
| DELETE | `/admin/services/items/:itemId/prices/:priceId` | 가격 비활성화 | Admin |
| GET | `/admin/services/items/:itemId/active-price` | 현재 활성 가격 조회 | Admin |

#### 11.3 현장비용 카테고리 관리
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/on-site-fee-categories` | 현장비용 카테고리 목록 | Admin |
| POST | `/admin/services/on-site-fee-categories` | 현장비용 카테고리 생성 | Admin |
| PUT | `/admin/services/on-site-fee-categories/:feeCategoryId` | 현장비용 카테고리 수정 | Admin |
| DELETE | `/admin/services/on-site-fee-categories/:feeCategoryId` | 현장비용 카테고리 비활성화 | Admin |
| GET | `/admin/services/on-site-fee-categories/:feeCategoryId/mappings` | 해당 현장비용의 서비스 매핑 조회 | Admin |

#### 11.4 서비스-현장비용 매핑 관리
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/mappings/on-site-fees` | 서비스-현장비용 매핑 목록 | Admin |
| POST | `/admin/services/mappings/on-site-fees` | 서비스-현장비용 매핑 생성 | Admin |
| PUT | `/admin/services/mappings/on-site-fees/:mappingId` | 매핑 수정 (신규 버전 생성) | Admin |
| DELETE | `/admin/services/mappings/on-site-fees/:mappingId` | 매핑 비활성화 | Admin |
| GET | `/admin/services/subcategories/:subcategoryId/on-site-fee-mappings` | 중분류 기준 현장비용 매핑 조회 | Admin |
| GET | `/admin/services/items/:itemId/on-site-fee-mappings` | 소분류 기준 현장비용 매핑 조회 | Admin |

#### 11.5 채널별 수수료 관리
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/items/:itemId/channel-commissions` | 소분류 채널별 수수료 이력 조회 | Admin |
| POST | `/admin/services/items/:itemId/channel-commissions` | 채널별 수수료 등록 | Admin |
| PUT | `/admin/services/items/:itemId/channel-commissions/:commissionId` | 수수료 수정 (신규 버전 생성) | Admin |
| DELETE | `/admin/services/items/:itemId/channel-commissions/:commissionId` | 수수료 비활성화 | Admin |
| GET | `/admin/services/channels/:channelCode/commissions` | 특정 채널의 수수료 정책 조회 | Admin |

#### 11.6 서비스 추가입력항목 관리
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/extra-fields` | 서비스 추가입력항목 목록 | Admin |
| POST | `/admin/services/extra-fields` | 추가입력항목 생성 | Admin |
| PUT | `/admin/services/extra-fields/:fieldId` | 추가입력항목 수정 | Admin |
| DELETE | `/admin/services/extra-fields/:fieldId` | 추가입력항목 비활성화 | Admin |
| GET | `/admin/services/subcategories/:subcategoryId/extra-fields` | 중분류 기준 추가입력항목 조회 | Admin |
| GET | `/admin/services/items/:itemId/extra-fields` | 소분류 기준 추가입력항목 조회 | Admin |
| POST | `/admin/services/items/:itemId/extra-fields/inheritance-override` | 소분류에서 중분류 필드 상속 오버라이드 설정 | Admin |

#### 11.7 감사 로그 및 변경 이력
| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/services/audit-logs` | 서비스 관리 변경 이력 조회 | Admin |
| GET | `/admin/services/items/:itemId/change-history` | 특정 소분류 변경 이력 조회 | Admin |
| GET | `/admin/services/subcategories/:subcategoryId/change-history` | 특정 중분류 변경 이력 조회 | Admin |

### 12. 전문가 관리 API (관리자 확장) (`/api/v1/admin/experts`)

#### 12.1 마스터 계정 등록 및 승인

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/admin/experts/master-accounts` | 마스터 계정 등록 (시나리오 1) | Admin |
| POST | `/admin/experts/master-accounts/:masterAccountId/approve` | 마스터 계정 승인 처리 (시나리오 3) | Admin |
| POST | `/admin/experts/master-accounts/:masterAccountId/reject` | 마스터 계정 반려 처리 | Admin |
| GET | `/admin/experts/master-accounts/pending` | 승인 대기 마스터 계정 목록 조회 | Admin |
| POST | `/admin/experts/sub-accounts` | 서브 계정 등록 (시나리오 2) | Admin |

#### 12.2 전문가 상태 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| PUT | `/admin/experts/:expertId/active-status` | 전문가 활성/비활성 전환 (시나리오 5) | Admin |
| GET | `/admin/experts` | 전문가 목록 조회 (필터: 계정 유형, 승인 상태, 활성 상태) | Admin |
| GET | `/admin/experts/:expertId` | 전문가 상세 정보 조회 | Admin |
| PUT | `/admin/experts/:expertId` | 전문가 정보 수정 (시나리오 4) | Admin |

#### 12.3 서비스 가능 카테고리 및 지역 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| PUT | `/admin/experts/:expertId/service-categories` | 서비스 가능 카테고리 수정 (시나리오 6) | Admin |
| PUT | `/admin/experts/:expertId/service-regions` | 서비스 가능 권역 변경 (시나리오 7) | Admin |
| GET | `/admin/experts/:expertId/service-categories/validation` | 카테고리 변경 유효성 검증 (진행 중 주문 확인) | Admin |

#### 12.4 멤버십 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/admin/experts/:expertId/membership` | 멤버십 신규 설정 (시나리오 8) | Admin |
| PUT | `/admin/experts/:expertId/membership` | 멤버십 구좌 변경 (slot count, 적용 중분류) | Admin |
| DELETE | `/admin/experts/:expertId/membership` | 멤버십 비활성화 | Admin |
| GET | `/admin/experts/:expertId/membership/history` | 멤버십 변경 이력 조회 | Admin |

#### 12.5 배정 이력 조회

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/experts/:expertId/assignment-history` | 전문가 배정 이력 조회 (시나리오 9) | Admin |
| GET | `/admin/experts/:expertId/assignment-stats` | 배정 통계 (멤버십 배정 비율, 거절률, 타임아웃률) | Admin |

#### 12.6 패널티 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/admin/experts/:expertId/penalties` | 패널티 적용 (시나리오 10) | Admin |
| GET | `/admin/experts/:expertId/penalties` | 패널티 이력 조회 | Admin |
| PUT | `/admin/experts/:expertId/penalties/:penaltyId/expire` | 패널티 수동 만료 처리 | Admin |
| GET | `/admin/experts/:expertId/penalties/active` | 현재 적용 중인 패널티 조회 | Admin |

#### 12.7 일일 배정 상한 설정

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| PUT | `/admin/experts/:expertId/daily-assignment-limit` | 일일 배정 상한 설정 (시나리오 11) | Admin |
| GET | `/admin/experts/:expertId/daily-assignment-limit` | 현재 배정 상한 및 오늘 배정 건수 조회 | Admin |

#### 12.8 통계 요약 대시보드

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/experts/:expertId/statistics/summary` | 전문가 통계 요약 대시보드 (시나리오 12) | Admin |
| GET | `/admin/experts/:expertId/statistics/detailed` | 상세 통계 지표 (기간별, 중분류별, 권역별) | Admin |

#### 12.9 감사 로그 및 변경 이력

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/experts/:expertId/audit-logs` | 전문가 변경 이력 조회 | Admin |
| GET | `/admin/experts/:expertId/change-history` | 특정 필드 변경 이력 조회 | Admin |

### 13. 채널 관리 API (관리자) (`/api/v1/admin/channels`)
**백오피스 메뉴 09 채널관리 기능을 위한 관리자 전용 API**

#### 13.1 채널 마스터 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/admin/channels` | 채널 생성 (시나리오 1, 2) | Admin |
| GET | `/admin/channels` | 채널 목록 조회 (필터: 채널 유형, 상태) | Admin |
| GET | `/admin/channels/:channelId` | 채널 상세 정보 조회 | Admin |
| PUT | `/admin/channels/:channelId` | 채널 정보 수정 (시나리오 4) | Admin |
| PUT | `/admin/channels/:channelId/status` | 채널 상태 전환 (ACTIVE/INACTIVE) (시나리오 5) | Admin |

#### 13.2 채널 스코프 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/channels/:channelId/scopes` | 채널 스코프(서비스 매핑) 조회 | Admin |
| PUT | `/admin/channels/:channelId/scopes` | 채널 스코프 설정 (시나리오 7) | Admin |

#### 13.3 채널별 수수료 관리

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/admin/channels/:channelId/commissions` | 채널 수수료 설정 조회 | Admin |
| POST | `/admin/channels/:channelId/commissions` | 채널 수수료 설정 등록 | Admin |
| PUT | `/admin/channels/:channelId/commissions/:commissionId` | 채널 수수료 설정 수정 | Admin |

---

## 에러 처리

### Fastify 에러 핸들링
```typescript
// 커스텀 에러 클래스
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 글로벌 에러 핸들러
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    })
  } else if (error instanceof Fastify.errorCodes.FST_ERR_VALIDATION) {
    // TypeBox 검증 에러
    reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값 검증에 실패했습니다.',
        details: error.validation
      }
    })
  } else {
    // 서버 내부 에러
    fastify.log.error(error)
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다.'
      }
    })
  }
})
```

### 예외 상황 처리
1. **DB 연결 실패**: Prisma 연결 재시도 로직 적용
2. **PG 연동 실패**: 결제 실패 시 자동 환불 처리
3. **외부 API 실패**: Aligo SMS 실패 시 대체 채널 (이메일) 사용
4. **파일 업로드 실패**: AWS S3 장애 시 로컬 저장소로 대체

---

## 테스트 전략

### 테스트 피라미드
```
      E2E (10%)
     ┌─────┐
     │ API │
     │Integration│ (20%)
    ┌───────────┐
    │   Unit    │ (70%)
    └───────────┘
```

### 단위 테스트 (Jest)
- **비즈니스 로직**: 서비스 레이어 단위 테스트
- **유틸리티 함수**: 검증, 변환, 포맷팅 함수 테스트
- **스키마 검증**: TypeBox 스키마 검증 테스트

### 통합 테스트 (Supertest + Jest)
- **API 엔드포인트**: 실제 HTTP 요청으로 엔드포인트 테스트
- **데이터베이스 연동**: Prisma 클라이언트와 실제 DB 연동 테스트 (테스트 DB 사용)
- **인증/권한**: JWT 토큰 기반 인증 흐름 테스트

### E2E 테스트 (Playwright)
- **사용자 시나리오**: 실제 사용자 흐름 테스트 (회원가입 → 주문 → 결제 → 리뷰)
- **크로스 브라우저**: Chrome, Firefox, Safari 호환성 테스트
- **모바일 테스트**: 반응형 웹앱 모바일 환경 테스트

### 테스트 커버리지 목표
- **문장 커버리지**: 80% 이상
- **분기 커버리지**: 75% 이상
- **함수 커버리지**: 85% 이상

---

## 성능 고려사항

### 1. 데이터베이스 최적화
- **인덱스 전략**: 자주 조회되는 필드에 인덱스 적용 (Prisma @@index)
- **쿼리 최적화**: Prisma 쿼리 로깅으로 느린 쿼리 식별
- **연결 풀**: Prisma 연결 풀 적절히 설정

### 2. 캐싱 전략
- **Redis 캐시 계층**: 자주 조회되며 변경 빈도 낮은 데이터 캐싱
- **CDN 정적 파일**: 이미지, CSS, JS 파일 CDN 제공
- **브라우저 캐싱**: 적절한 Cache-Control 헤더 설정

### 3. 부하 분산
- **수평 확장**: Stateless 설계로 여러 Fastify 인스턴스 실행
- **로드 밸런서**: Nginx 로드 밸런서로 트래픽 분산
- **세션 무상태**: JWT 토큰으로 세션 상태 관리 필요 없음

### 4. 모니터링
- **메트릭 수집**: Prometheus + Grafana로 API 지표 수집
- **로그 중앙화**: ELK 스택으로 로그 수집 및 분석
- **에러 트래킹**: Sentry로 실시간 에러 모니터링

---

## 구현 가이드라인

### 1. Fastify 플러그인 구조
```
src/
├── plugins/           # Fastify 플러그인
│   ├── auth.ts       # 인증 플러그인
│   ├── swagger.ts    # 문서화 플러그인
│   └── prisma.ts     # Prisma 클라이언트 플러그인
├── routes/           # API 라우트
│   ├── auth/         # 인증 관련 라우트
│   ├── users/        # 사용자 관련 라우트
│   └── ...
├── schemas/          # TypeBox 스키마
├── services/         # 비즈니스 로직
├── utils/            # 유틸리티 함수
└── app.ts           # 앱 진입점
```

### 2. 라우트 정의 예시
```typescript
// src/routes/users/profile.ts
import { Type } from '@sinclair/typebox'
import { FastifyPluginAsync } from 'fastify'

const GetUserProfileSchema = {
  response: {
    200: SuccessResponseSchema(UserSchema)
  }
}

const UpdateUserProfileSchema = {
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
    avatarUrl: Type.Optional(Type.String({ format: 'uri' }))
  }),
  response: {
    200: SuccessResponseSchema(UserSchema)
  }
}

const userProfileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { schema: GetUserProfileSchema }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId }
    })
    return { success: true, data: user }
  })

  fastify.put('/me', { schema: UpdateUserProfileSchema }, async (request, reply) => {
    const updatedUser = await fastify.prisma.user.update({
      where: { id: request.user.userId },
      data: request.body
    })
    return { success: true, data: updatedUser }
  })
}

export default userProfileRoutes
```

### 3. 미들웨어 체인
```typescript
// 인증 미들웨어
fastify.decorateRequest('user', null)
fastify.addHook('onRequest', async (request, reply) => {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('AUTH_001', '인증 토큰이 필요합니다.', 401)
  }
  
  const token = authHeader.substring(7)
  try {
    const payload = await verifyJwt(token)
    request.user = payload
  } catch (error) {
    throw new AppError('AUTH_001', '인증 토큰이 유효하지 않습니다.', 401)
  }
})

// 권한 체크 미들웨어
const requireRole = (role: UserRole) => async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.user.role !== role) {
    throw new AppError('AUTH_002', '접근 권한이 없습니다.', 403)
  }
}
```

---

**다음 단계**: 이 스펙을 바탕으로 Phase 1 백엔드 API 구현 시작 (4-5주 예상)