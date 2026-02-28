# 쓱싹 홈케어 플랫폼 - 백엔드 API 명세

**문서 버전**: 2.0  
**작성일**: 2026-01-14  
**우선순위**: P0 (최우선)  
**Base URL**: `/api/v1`

---

## 📋 목차

1. [API 설계 원칙](#api-설계-원칙)
2. [인증 및 권한](#인증-및-권한)
3. [공통 응답 형식](#공통-응답-형식)
4. [API 엔드포인트](#api-엔드포인트)
5. [에러 코드](#에러-코드)

---

## API 설계 원칙

### 1. RESTful 설계
- 리소스 중심 URL 구조
- HTTP 메서드 의미론적 사용 (GET, POST, PUT, DELETE)
- 상태 코드 적절한 사용

### 2. 버전 관리
- URL 기반 버전 관리 (`/api/v1`)
- 하위 호환성 유지

### 3. 일관성
- 통일된 응답 형식
- 일관된 네이밍 컨벤션 (snake_case)
- 표준화된 에러 처리

### 4. 보안
- HTTPS 필수
- JWT 토큰 기반 인증
- Rate Limiting 적용
- Input Validation

---

## 인증 및 권한

### 인증 방식
```
Authorization: Bearer <JWT_TOKEN>
```

### JWT 토큰 구조
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "expert",
  "iat": 1705200000,
  "exp": 1705804800
}
```

### 권한 레벨
- **Public**: 인증 불필요
- **Authenticated**: 로그인 필요
- **Expert**: 전문가 권한 필요
- **Admin**: 관리자 권한 필요

---

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "인증 토큰이 유효하지 않습니다.",
    "details": { ... }
  }
}
```

---

## API 엔드포인트

### 1. 인증 (Authentication)

#### 1.1 회원가입
```http
POST /api/v1/auth/signup
```

**Request Body**:
```json
{
  "email": "expert@example.com",
  "phone": "01012345678",
  "password": "SecurePass123!",
  "name": "홍길동",
  "role": "expert",
  "expert_data": {
    "business_name": "홍길동 설비",
    "business_number": "123-45-67890",
    "business_type": "individual",
    "service_regions": ["서울시 강남구", "서울시 서초구"]
  }
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "expert@example.com",
      "name": "홍길동",
      "role": "expert",
      "status": "pending"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 1.2 로그인
```http
POST /api/v1/auth/login
```

**Request Body**:
```json
{
  "email_or_phone": "expert@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "expert@example.com",
      "name": "홍길동",
      "role": "expert",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 1.3 휴대폰 인증 요청
```http
POST /api/v1/auth/verify-phone/request
```

**Request Body**:
```json
{
  "phone": "01012345678"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "인증번호가 전송되었습니다.",
    "expires_in": 180
  }
}
```

---

#### 1.4 휴대폰 인증 확인
```http
POST /api/v1/auth/verify-phone/confirm
```

**Request Body**:
```json
{
  "phone": "01012345678",
  "code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

---

### 2. 전문가 API (Expert)

#### 2.1 전문가 프로필 조회
```http
GET /api/v1/experts/me
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "expert@example.com",
    "name": "홍길동",
    "phone": "01012345678",
    "business_name": "홍길동 설비",
    "business_number": "123-45-67890",
    "service_regions": ["서울시 강남구", "서울시 서초구"],
    "rating": 4.8,
    "total_completed_orders": 150,
    "total_earnings": 15000000,
    "expert_status": "active"
  }
}
```

---

#### 2.2 전문가 프로필 수정
```http
PUT /api/v1/experts/me
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "홍길동",
  "phone": "01012345678",
  "service_regions": ["서울시 강남구", "서울시 서초구", "서울시 송파구"],
  "introduction": "10년 경력의 전문 설비 기술자입니다.",
  "bank_name": "국민은행",
  "account_number": "123-456-789012",
  "account_holder": "홍길동"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "홍길동",
    "phone": "01012345678",
    "service_regions": ["서울시 강남구", "서울시 서초구", "서울시 송파구"],
    "introduction": "10년 경력의 전문 설비 기술자입니다."
  }
}
```

---

### 3. 주문 API (Orders)

#### 3.1 주문 목록 조회 (전문가용)
```http
GET /api/v1/experts/orders?status=new&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters**:
- `status`: 주문 상태 필터 (new, in_progress, completed 등)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD-20260114-0001",
        "customer": {
          "name": "김고객",
          "phone": "010-9876-5432"
        },
        "service_item": {
          "name": "에어컨 설치",
          "category": "설치/시공"
        },
        "address": {
          "address_line1": "서울시 강남구 테헤란로 123",
          "address_line2": "456호"
        },
        "requested_date": "2026-01-15T10:00:00Z",
        "status": "new",
        "total_amount": 150000,
        "created_at": "2026-01-14T09:00:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

#### 3.2 주문 상세 조회
```http
GET /api/v1/orders/:orderId
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-20260114-0001",
    "customer": {
      "id": "uuid",
      "name": "김고객",
      "phone": "010-9876-5432"
    },
    "expert": {
      "id": "uuid",
      "name": "홍길동",
      "phone": "010-1234-5678"
    },
    "service_item": {
      "id": "uuid",
      "name": "에어컨 설치",
      "category": "설치/시공",
      "base_price": 150000
    },
    "address": {
      "address_line1": "서울시 강남구 테헤란로 123",
      "address_line2": "456호",
      "city": "서울시",
      "state": "강남구"
    },
    "status": "new",
    "payment_status": "deposit_paid",
    "requested_date": "2026-01-15T10:00:00Z",
    "confirmed_date": null,
    "base_price": 150000,
    "onsite_costs": [],
    "discount_amount": 0,
    "deposit_amount": 30000,
    "total_amount": 150000,
    "paid_amount": 30000,
    "customer_notes": "오전 10시에 방문 부탁드립니다.",
    "created_at": "2026-01-14T09:00:00Z"
  }
}
```

---

#### 3.3 주문 수락
```http
POST /api/v1/experts/orders/:orderId/accept
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "scheduled_date": "2026-01-15",
  "start_time": "10:00",
  "end_time": "12:00",
  "notes": "정확한 시간에 방문하겠습니다."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "schedule_confirmed",
    "schedule": {
      "scheduled_date": "2026-01-15",
      "start_time": "10:00",
      "end_time": "12:00"
    }
  }
}
```

---

#### 3.4 주문 거절
```http
POST /api/v1/experts/orders/:orderId/reject
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "reason": "일정이 맞지 않습니다."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "new",
    "message": "주문이 거절되었습니다. 다른 전문가에게 재배정됩니다."
  }
}
```

---

#### 3.5 서비스 시작
```http
POST /api/v1/experts/orders/:orderId/start
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "in_progress",
    "started_at": "2026-01-15T10:05:00Z"
  }
}
```

---

#### 3.6 서비스 완료
```http
POST /api/v1/experts/orders/:orderId/complete
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "onsite_costs": [
    {
      "name": "배관 연장",
      "description": "3m 추가 배관 작업",
      "unit_price": 30000,
      "quantity": 1,
      "total": 30000
    }
  ],
  "completion_notes": "작업이 완료되었습니다. 추가 배관 작업이 필요했습니다.",
  "after_images": [
    "https://storage.example.com/images/after1.jpg",
    "https://storage.example.com/images/after2.jpg"
  ]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "status": "payment_pending",
    "completed_at": "2026-01-15T12:00:00Z",
    "total_amount": 180000,
    "balance_due": 150000
  }
}
```

---

### 4. 서비스 API (Services)

#### 4.1 서비스 카테고리 목록
```http
GET /api/v1/services/categories
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "설치/시공",
        "slug": "installation",
        "description": "각종 설치 및 시공 서비스",
        "icon_url": "https://cdn.example.com/icons/installation.svg",
        "display_order": 1
      },
      {
        "id": "uuid",
        "name": "클리닝",
        "slug": "cleaning",
        "description": "전문 클리닝 서비스",
        "icon_url": "https://cdn.example.com/icons/cleaning.svg",
        "display_order": 2
      }
    ]
  }
}
```

---

#### 4.2 서비스 항목 목록
```http
GET /api/v1/services/items?category_id=uuid&page=1&limit=20
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "category_id": "uuid",
        "name": "에어컨 설치",
        "description": "벽걸이/스탠드 에어컨 설치",
        "base_price": 150000,
        "estimated_time": 120,
        "images": [
          "https://cdn.example.com/services/aircon1.jpg"
        ]
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

#### 4.3 전문가 서비스 매핑 조회
```http
GET /api/v1/experts/me/services
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "service_item_id": "uuid",
        "name": "에어컨 설치",
        "category": "설치/시공",
        "base_price": 150000,
        "custom_price": 140000,
        "is_available": true
      }
    ]
  }
}
```

---

#### 4.4 전문가 서비스 매핑 수정
```http
PUT /api/v1/experts/me/services
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "services": [
    {
      "service_item_id": "uuid",
      "custom_price": 140000,
      "is_available": true
    },
    {
      "service_item_id": "uuid2",
      "custom_price": null,
      "is_available": false
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "updated_count": 2
  }
}
```

---

### 5. 정산 API (Settlements)

#### 5.1 정산 내역 조회
```http
GET /api/v1/experts/settlements?page=1&limit=20
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "settlements": [
      {
        "id": "uuid",
        "settlement_number": "STL-202601-001",
        "period_start": "2026-01-01",
        "period_end": "2026-01-07",
        "total_orders": 10,
        "total_revenue": 1500000,
        "platform_fee": 225000,
        "payment_fee": 37500,
        "tax_amount": 123750,
        "net_amount": 1113750,
        "status": "paid",
        "paid_at": "2026-01-10T10:00:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

#### 5.2 정산 상세 조회
```http
GET /api/v1/experts/settlements/:settlementId
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "settlement_number": "STL-202601-001",
    "period_start": "2026-01-01",
    "period_end": "2026-01-07",
    "total_orders": 10,
    "total_revenue": 1500000,
    "platform_fee": 225000,
    "payment_fee": 37500,
    "tax_amount": 123750,
    "net_amount": 1113750,
    "status": "paid",
    "paid_at": "2026-01-10T10:00:00Z",
    "details": [
      {
        "order_number": "ORD-20260102-0001",
        "order_amount": 150000,
        "platform_fee": 22500,
        "payment_fee": 3750,
        "net_amount": 123750
      }
    ]
  }
}
```

---

### 6. 관리자 API (Admin)

#### 6.1 사용자 목록 조회
```http
GET /api/v1/admin/users?role=expert&status=pending&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "expert@example.com",
        "name": "홍길동",
        "phone": "010-1234-5678",
        "role": "expert",
        "status": "pending",
        "created_at": "2026-01-14T09:00:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

---

#### 6.2 전문가 승인
```http
POST /api/v1/admin/experts/:expertId/approve
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "expert_id": "uuid",
    "status": "active",
    "approved_at": "2026-01-14T10:00:00Z"
  }
}
```

---

#### 6.3 주문 통계
```http
GET /api/v1/admin/statistics/orders?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_orders": 500,
    "completed_orders": 450,
    "cancelled_orders": 30,
    "in_progress_orders": 20,
    "total_revenue": 75000000,
    "average_order_value": 150000
  }
}
```

---

## 에러 코드

### 인증 에러 (AUTH_xxx)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|----------|
| AUTH_001 | 인증 토큰이 유효하지 않습니다. | 401 |
| AUTH_002 | 인증 토큰이 만료되었습니다. | 401 |
| AUTH_003 | 권한이 없습니다. | 403 |
| AUTH_004 | 이미 존재하는 이메일입니다. | 409 |
| AUTH_005 | 이미 존재하는 휴대폰 번호입니다. | 409 |
| AUTH_006 | 잘못된 인증번호입니다. | 400 |
| AUTH_007 | 인증번호가 만료되었습니다. | 400 |

### 주문 에러 (ORDER_xxx)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|----------|
| ORDER_001 | 주문을 찾을 수 없습니다. | 404 |
| ORDER_002 | 이미 처리된 주문입니다. | 400 |
| ORDER_003 | 주문 상태를 변경할 수 없습니다. | 400 |
| ORDER_004 | 취소 가능한 기간이 지났습니다. | 400 |

### 결제 에러 (PAYMENT_xxx)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|----------|
| PAYMENT_001 | 결제 처리 중 오류가 발생했습니다. | 500 |
| PAYMENT_002 | 이미 결제된 주문입니다. | 400 |
| PAYMENT_003 | 환불 처리 중 오류가 발생했습니다. | 500 |

### 시스템 에러 (SYS_xxx)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|----------|
| SYS_001 | 서버 내부 오류가 발생했습니다. | 500 |
| SYS_002 | 데이터베이스 연결 오류입니다. | 500 |
| SYS_003 | 요청 횟수 제한을 초과했습니다. | 429 |

---

## 다음 단계

1. **API 구현** - Express.js 라우터 및 컨트롤러 작성
2. **미들웨어 구현** - 인증, 권한, 에러 처리
3. **테스트 작성** - 단위 테스트 및 통합 테스트
4. **API 문서화** - Swagger/OpenAPI 스펙 작성

---

**작성일**: 2026-01-14  
**버전**: 2.0  
**상태**: 스펙 작성 완료
