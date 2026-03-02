# SGSG API 연동 가이드

**문서 버전**: 1.0  
**작성일**: 2024-03-01  
**대상**: 프론트엔드 구현 에이전트  
**목적**: 백엔드 API와의 일관된 연동 패턴 제공

---

## 📋 목차

1. [Authentication API](#authentication-api)
2. [User Management API](#user-management-api)
3. [Expert Management API](#expert-management-api)
4. [Service Catalog API](#service-catalog-api)
5. [Order Management API](#order-management-api)
6. [Payment API](#payment-api)
7. [Review API](#review-api)
8. [File Upload API](#file-upload-api)
9. [Notification API](#notification-api)
10. [Admin API](#admin-api)
11. [TypeScript 타입 정의](#typescript-타입-정의)
12. [Error Handling Patterns](#error-handling-patterns)

---

## Authentication API

### 🔐 Base URL
```
http://localhost:4000/api/v1/auth
```

### 엔드포인트

#### 회원가입
```typescript
POST /auth/register
Content-Type: application/json

Request:
{
  email: string;           // 이메일 (필수)
  phone: string;          // 휴대폰 번호 (필수)
  password: string;       // 비밀번호 (필수, 8자 이상)
  name: string;          // 이름 (필수)
  role: 'customer' | 'expert' | 'admin';  // 역할 (필수)
  marketingConsent?: boolean;  // 마케팅 동의 (선택)
  privacyConsent: boolean;     // 개인정보처리방침 동의 (필수)
}

Response:
{
  success: true;
  data: {
    user: UserProfile;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }
  }
}
```

#### 로그인
```typescript
POST /auth/login
Content-Type: application/json

Request:
{
  email: string;         // 이메일 또는 휴대폰 번호
  password: string;      // 비밀번호
}

Response:
{
  success: true;
  data: {
    user: UserProfile;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }
  }
}
```

#### 토큰 갱신
```typescript
POST /auth/refresh
Content-Type: application/json

Request:
{
  refreshToken: string;
}

Response:
{
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}
```

#### 이메일 인증
```typescript
POST /auth/verify-email
Content-Type: application/json

Request:
{
  token: string;  // JWT 인증 토큰
}

Response:
{
  success: true;
  data: {
    message: string;
  }
}
```

#### 휴대폰 인증
```typescript
POST /auth/verify-phone
Content-Type: application/json

Request:
{
  phone: string;  // 휴대폰 번호
  code: string;   // 인증 코드 (개발환경: "123456")
}

Response:
{
  success: true;
  data: {
    message: string;
  }
}
```

---

## User Management API

### 👤 Base URL
```
http://localhost:4000/api/v1/users
```

### 엔드포인트

#### 프로필 조회
```typescript
GET /users/me
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: 'customer' | 'expert' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    avatarUrl: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    // 역할별 확장 정보
    customer?: CustomerProfile;
    expert?: ExpertProfile;
    admin?: AdminProfile;
    addresses?: Address[];
  }
}
```

#### 프로필 수정
```typescript
PUT /users/me
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  name?: string;
  phone?: string;
  avatarUrl?: string;
  marketingConsent?: boolean;
}

Response:
{
  success: true;
  data: UserProfile;
  message: string;
}
```

#### 주소록 관리
```typescript
// 주소 목록 조회
GET /users/me/addresses
Headers: Authorization: Bearer {accessToken}

// 주소 추가
POST /users/me/addresses
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  label: string;           // 주소 라벨 (집, 회사 등)
  addressLine1: string;    // 기본 주소
  addressLine2?: string;   // 상세 주소
  city: string;           // 시/군/구
  state: string;          // 시/도
  postalCode: string;     // 우편번호
  country: string;        // 국가 (기본: "South Korea")
  isDefault?: boolean;    // 기본 주소 여부
}

// 주소 수정
PUT /users/me/addresses/:addressId

// 주소 삭제
DELETE /users/me/addresses/:addressId
```

---

## Expert Management API

### 👨‍🔧 Base URL
```
http://localhost:4000/api/v1/experts
```

### 엔드포인트

#### 전문가 프로필 조회
```typescript
GET /experts/me
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: {
    id: string;
    userId: string;
    businessName: string;
    businessNumber: string;
    businessType: 'individual' | 'company';
    serviceRegions: string[];
    rating: number;
    totalCompletedOrders: number;
    totalEarnings: number;
    operationalStatus: 'active' | 'inactive';
    // 추가 정보들...
  }
}
```

#### 서브 계정 관리
```typescript
// 서브 계정 목록
GET /experts/me/sub-accounts
Headers: Authorization: Bearer {accessToken}

// 서브 계정 생성
POST /experts/me/sub-accounts
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  email: string;
  phone: string;
  name: string;
  permissions: string[];   // ['order:view', 'order:accept', 'schedule:manage']
}
```

#### 서비스 매핑 관리
```typescript
// 제공 서비스 목록
GET /experts/me/services
Headers: Authorization: Bearer {accessToken}

// 서비스 매핑 추가
POST /experts/me/services
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  serviceItemId: string;
  isActive: boolean;
  customPrice?: number;  // 커스텀 가격 (선택)
}
```

---

## Service Catalog API

### 🛍️ Base URL
```
http://localhost:4000/api/v1/services
```

### 엔드포인트

#### 카테고리 조회
```typescript
// 전체 카테고리 목록
GET /services/categories?page=1&limit=20&includeItems=true

// 카테고리 트리 구조
GET /services/categories/tree

// 특정 카테고리 상세
GET /services/categories/:categoryId

Response:
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
    parentId: string | null;
    children?: ServiceCategory[];
    items?: ServiceItem[];
  }
}
```

#### 서비스 아이템 조회
```typescript
// 서비스 목록 (필터링/검색)
GET /services/items?page=1&limit=20&categoryId={id}&search={query}&priceRange.min=0&priceRange.max=100000

// 서비스 상세
GET /services/items/:itemId

Response:
{
  success: true;
  data: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    imageUrl: string;
    isActive: boolean;
    category: ServiceCategory;
    // 추가 정보들...
  }
}
```

#### 전문가별 서비스
```typescript
// 특정 서비스를 제공하는 전문가 목록
GET /services/items/:itemId/experts?page=1&limit=20

Response:
{
  success: true;
  data: ExpertProfile[];
  pagination: PaginationInfo;
}
```

---

## Order Management API

### 📦 Base URL
```
http://localhost:4000/api/v1/orders
```

### 엔드포인트

#### 주문 생성
```typescript
POST /orders
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  serviceItemId: string;
  expertId?: string;        // 전문가 미지정 시 자동 배정
  addressId: string;        // 서비스 주소
  scheduledAt: string;      // 희망 일시 (ISO 8601)
  requirements?: string;    // 특별 요구사항
  urgency: 'normal' | 'urgent';  // 긴급도
}

Response:
{
  success: true;
  data: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    depositAmount: number;
    // 추가 정보들...
  }
}
```

#### 주문 목록 조회
```typescript
GET /orders?page=1&limit=20&status=pending&startDate=2024-01-01&endDate=2024-12-31
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: Order[];
  pagination: PaginationInfo;
}
```

#### 주문 상태 변경
```typescript
POST /orders/:orderId/status
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  status: 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string;  // 취소/거부 시 사유
}
```

---

## Payment API

### 💳 Base URL
```
http://localhost:4000/api/v1/payments
```

### 엔드포인트

#### 결제 초기화
```typescript
POST /payments/initialize
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  orderId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  method?: 'credit_card' | 'virtual_account' | 'simple_payment';
}

Response:
{
  success: true;
  data: {
    id: string;
    paymentNumber: string;
    amount: number;
    status: 'pending';
    pgProvider: string;
    // PG 연동 정보...
  }
}
```

#### 결제 완료 처리
```typescript
POST /payments/complete
Content-Type: application/json

Request:
{
  paymentId: string;
  pgTransactionId: string;
  pgResponse: any;
  paidAt?: string;
}

Response:
{
  success: true;
  data: PaymentInfo;
}
```

#### 결제 환불
```typescript
POST /payments/:paymentId/refund
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  amount: number;   // 환불 금액
  reason: string;   // 환불 사유
}
```

---

## Review API

### ⭐ Base URL
```
http://localhost:4000/api/v1/reviews
```

### 엔드포인트

#### 리뷰 작성
```typescript
POST /reviews
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  orderId: string;
  rating: number;     // 1-5 점수
  title?: string;     // 리뷰 제목
  content: string;    // 리뷰 내용
  images?: string[];  // 이미지 URL 배열
}

Response:
{
  success: true;
  data: ReviewInfo;
  message: string;
}
```

#### 리뷰 목록 조회
```typescript
GET /reviews?page=1&limit=20&expertId={id}&rating=5&sortBy=createdAt&sortOrder=desc

Response:
{
  success: true;
  data: Review[];
  pagination: PaginationInfo;
  statistics?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
}
```

#### 도움됨 표시
```typescript
POST /reviews/:reviewId/helpful
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: {
    reviewId: string;
    helpfulCount: number;
    isHelpful: boolean;
  }
}
```

---

## File Upload API

### 📁 Base URL
```
http://localhost:4000/api/v1/upload
```

### 엔드포인트

#### 파일 업로드
```typescript
POST /upload/upload
Headers: 
  Authorization: Bearer {accessToken}
  Content-Type: multipart/form-data

Form Data:
  file: File  // 업로드할 파일

Response:
{
  success: true;
  data: {
    id: string;
    originalName: string;
    storagePath: string;
    publicUrl: string;
    mimeType: string;
    size: number;
  }
}
```

#### 리뷰 이미지 업로드
```typescript
POST /upload/review-image
Headers: 
  Authorization: Bearer {accessToken}
  Content-Type: multipart/form-data

Form Data:
  image: File  // 이미지 파일 (JPEG, PNG, GIF, WebP)

Response:
{
  success: true;
  data: {
    id: string;
    url: string;
    thumbnailUrl: string;
  }
}
```

---

## Notification API

### 🔔 Base URL  
```
http://localhost:4000/api/v1/notifications
```

### 엔드포인트

#### 알림 목록
```typescript
GET /notifications/notifications?page=1&limit=20&isRead=false
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: Notification[];
  pagination: PaginationInfo;
}
```

#### 알림 읽음 처리
```typescript
PUT /notifications/notifications/:notificationId/read
Headers: Authorization: Bearer {accessToken}

Response:
{
  success: true;
  data: Notification;
}
```

#### 실시간 알림 (WebSocket)
```typescript
WebSocket Connection:
ws://localhost:4000/api/v1/notifications/ws?token={accessToken}

Message Format:
{
  type: 'notification';
  data: {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'payment' | 'system';
    createdAt: string;
  }
}
```

---

## Admin API

### 👑 Base URL
```
http://localhost:4000/api/v1/admin
```

### 엔드포인트

#### 관리자용 리뷰 관리
```typescript
// 관리자용 리뷰 목록
GET /admin/reviews?page=1&limit=20&isApproved=false&hasReports=true
Headers: Authorization: Bearer {accessToken}

// 리뷰 승인/거부
POST /admin/reviews/:reviewId/approve-reject
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  action: 'approve' | 'reject';
  reason?: string;  // 거부 시 사유
}

// 리뷰 일괄 처리
POST /admin/reviews/bulk-action
Headers: Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  action: 'approve' | 'reject';
  reviewIds: string[];
  reason?: string;
}
```

---

## TypeScript 타입 정의

```typescript
// types/api.ts - 모든 프론트엔드에서 공유할 타입 정의

// 공통 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 사용자 관련
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'customer' | 'expert' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  customer?: CustomerProfile;
  expert?: ExpertProfile;
  admin?: AdminProfile;
  addresses?: Address[];
}

export interface CustomerProfile {
  id: string;
  userId: string;
  defaultAddressId: string | null;
  totalSpent: number;
  totalOrders: number;
  favoriteCategories: string[];
  preferences: Record<string, any>;
  lastServiceDate: string | null;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  businessName: string;
  businessNumber: string;
  businessType: 'individual' | 'company';
  businessAddressId: string | null;
  serviceRegions: string[];
  rating: number;
  totalCompletedOrders: number;
  totalEarnings: number;
  operationalStatus: 'active' | 'inactive';
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  introduction: string | null;
  certificateUrls: string[];
  portfolioImages: string[];
  metadata: Record<string, any>;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  activeStatus: 'ACTIVE' | 'INACTIVE';
  membershipEnabled: boolean;
  membershipSlotCount: number;
  serviceCategoryMidAvailableList: string[];
  regionGroups: string[];
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 서비스 관련
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  children?: ServiceCategory[];
  items?: ServiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  isActive: boolean;
  estimatedDuration: number;
  category: ServiceCategory;
  createdAt: string;
  updatedAt: string;
}

// 주문 관련
export type OrderStatus = 
  | 'pending'           // 대기 중
  | 'confirmed'         // 확정됨
  | 'expert_assigned'   // 전문가 배정됨
  | 'schedule_pending'  // 일정 대기
  | 'scheduled'         // 일정 확정
  | 'in_progress'       // 진행 중
  | 'completed'         // 완료
  | 'cancelled'         // 취소됨
  | 'as_requested';     // 요청대로 처리됨

export type PaymentStatus = 
  | 'unpaid'           // 미결제
  | 'deposit_paid'     // 선금 결제 완료
  | 'balance_paid'     // 잔금 결제 완료
  | 'refunded'         // 환불됨
  | 'partially_refunded'; // 부분 환불됨

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  expertId: string | null;
  serviceItemId: string;
  addressId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  depositAmount: number;
  paidAmount: number;
  scheduledAt: string | null;
  completedAt: string | null;
  requirements: string | null;
  urgency: 'normal' | 'urgent';
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터
  customer?: {
    user: Pick<User, 'id' | 'name' | 'phone'>;
  };
  expert?: ExpertProfile;
  serviceItem?: ServiceItem;
  address?: Address;
}

// 결제 관련
export interface Payment {
  id: string;
  orderId: string;
  paymentNumber: string;
  paymentType: 'deposit' | 'balance' | 'full';
  method: 'credit_card' | 'virtual_account' | 'simple_payment' | 'cash' | null;
  amount: number;
  refundAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  pgProvider: string | null;
  pgTransactionId: string | null;
  pgResponse: any;
  paidAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// 리뷰 관련
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  expertId: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  isVerified: boolean;
  isApproved: boolean;
  approvedAt: string | null;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터
  customer?: {
    user: Pick<User, 'name' | 'avatarUrl'>;
  };
  expert?: Pick<ExpertProfile, 'businessName' | 'rating'> & {
    user: Pick<User, 'name' | 'avatarUrl'>;
  };
  order?: Pick<Order, 'orderNumber'> & {
    serviceItem: Pick<ServiceItem, 'name'>;
  };
  isHelpfulByCurrentUser?: boolean;
}

// 알림 관련
export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'order' | 'payment' | 'review';
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// 파일 업로드
export interface UploadedFile {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Error Handling Patterns

### 🚨 에러 응답 형식

```typescript
// 표준 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // 에러 코드
    message: string;     // 사용자 메시지
    details?: any;       // 추가 상세 정보
  };
  statusCode?: number;   // HTTP 상태 코드
}

// 주요 에러 코드
export const ERROR_CODES = {
  // 인증 관련
  AUTH_001: '로그인이 필요합니다',
  AUTH_002: '권한이 없습니다',
  AUTH_003: '잘못된 인증 정보입니다',
  AUTH_004: '토큰이 만료되었습니다',
  AUTH_005: '유효하지 않은 인증 토큰입니다',
  
  // 검증 관련
  VALIDATION_001: '이미 사용 중인 이메일입니다',
  VALIDATION_002: '이미 사용 중인 휴대폰 번호입니다',
  VALIDATION_ERROR: '요청 데이터가 유효하지 않습니다',
  
  // 주문 관련
  ORDER_001: '서비스 아이템을 찾을 수 없습니다',
  ORDER_002: '이미 주문이 진행 중입니다',
  ORDER_003: '주문을 취소할 수 없는 상태입니다',
  
  // 결제 관련  
  PAYMENT_001: '주문을 찾을 수 없습니다',
  PAYMENT_002: '결제 권한이 없습니다',
  PAYMENT_003: '결제할 수 없는 주문 상태입니다',
  
  // 리뷰 관련
  REVIEW_001: '리뷰를 작성할 권한이 없습니다',
  REVIEW_002: '이미 리뷰가 작성되었습니다',
  
  // 일반 오류
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다',
  INTERNAL_ERROR: '서버 내부 오류가 발생했습니다',
  BAD_REQUEST: '잘못된 요청입니다'
} as const;
```

### 🛠️ 에러 처리 유틸리티

```typescript
// utils/errorHandler.ts
import { message, notification } from 'antd';

export const handleApiError = (error: any) => {
  if (error.response?.data?.error) {
    const { code, message: errorMessage } = error.response.data.error;
    
    // 사용자 친화적 메시지 표시
    switch (code) {
      case 'AUTH_001':
        message.warning('로그인이 필요합니다');
        // 로그인 페이지로 리다이렉트
        window.location.href = '/auth/login';
        break;
        
      case 'AUTH_002':
        message.error('접근 권한이 없습니다');
        break;
        
      case 'VALIDATION_ERROR':
        message.error('입력 정보를 확인해주세요');
        break;
        
      default:
        message.error(errorMessage || '오류가 발생했습니다');
    }
  } else if (error.message) {
    message.error(error.message);
  } else {
    message.error('알 수 없는 오류가 발생했습니다');
  }
};

export const showNetworkError = () => {
  notification.error({
    message: '네트워크 오류',
    description: '인터넷 연결을 확인하고 다시 시도해주세요',
    duration: 0, // 자동으로 닫히지 않음
  });
};
```

이 가이드를 활용하여 모든 프론트엔드 에이전트들이 일관된 방식으로 백엔드 API와 연동할 수 있습니다. 🚀