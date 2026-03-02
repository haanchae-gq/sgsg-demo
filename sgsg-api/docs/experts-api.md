# 전문가 관리 API 문서

이 문서는 세션 2에서 구현된 전문가 관리 API에 대한 설명입니다.

## API 개요

전문가 관리 API는 전문가(Expert) 역할의 사용자가 자신의 프로필 및 서비스를 관리할 수 있는 기능을 제공합니다.

## 인증

모든 전문가 API는 JWT 토큰이 필요하며, `Authorization: Bearer {token}` 헤더로 인증합니다.

## 구현된 엔드포인트

### 1. 전문가 서비스 매핑 관련 API

#### GET /api/v1/experts/me/services
전문가가 제공하는 서비스 목록을 조회합니다.

**권한**: 로그인한 전문가  
**쿼리 파라미터:**
- `page` (선택, 기본값: 1): 페이지 번호
- `limit` (선택, 기본값: 20): 페이지 크기

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "cmm7ucna400002lj7hvnt55vy",
        "expertId": "expert1",
        "serviceItemId": "it1",
        "customPrice": 140000,
        "isAvailable": true,
        "createdAt": "2026-03-01T14:24:23.258Z",
        "updatedAt": "2026-03-01T14:24:23.258Z",
        "serviceItem": {
          "id": "it1",
          "name": "정기 청소",
          "description": "주 1-2회 정기적인 가정 청소",
          "basePrice": 150000,
          "category": {
            "id": "cl1",
            "name": "청소 서비스",
            "slug": "cleaning"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### POST /api/v1/experts/me/services
전문가가 새로운 서비스를 등록합니다.

**권한**: 로그인한 전문가  
**요청 본문:**
```json
{
  "serviceItemId": "it1",
  "customPrice": 140000,
  "isAvailable": true
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "cmm7ucna400002lj7hvnt55vy",
    "expertId": "expert1",
    "serviceItemId": "it1",
    "customPrice": 140000,
    "isAvailable": true,
    "serviceItem": {
      "id": "it1",
      "name": "정기 청소",
      "description": "주 1-2회 정기적인 가정 청소",
      "basePrice": 150000,
      "category": {
        "id": "cl1",
        "name": "청소 서비스",
        "slug": "cleaning"
      }
    }
  }
}
```

### 2. 전문가 통계 API (부분 구현)

#### GET /api/v1/experts/me/statistics
전문가의 통계 정보를 조회합니다.

**권한**: 로그인한 전문가

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "completedOrders": 150,
    "totalEarnings": 15000000,
    "averageRating": 4.8,
    "totalReviews": 120,
    "thisMonthOrders": 25,
    "thisMonthEarnings": 850000,
    "pendingOrders": 5
  }
}
```

## 추가 API 엔드포인트 (계획됨)

### 📋 전문가 기본 정보
- `GET /api/v1/experts/me` - 전문가 프로필 조회
- `PUT /api/v1/experts/me` - 전문가 프로필 수정

### 📅 스케줄 관리
- `GET /api/v1/experts/me/schedule` - 스케줄 조회
- `POST /api/v1/experts/me/schedule` - 스케줄 등록
- `PUT /api/v1/experts/me/schedule/:scheduleId` - 스케줄 수정
- `DELETE /api/v1/experts/me/schedule/:scheduleId` - 스케줄 삭제

### 📦 주문 관리
- `GET /api/v1/experts/me/orders` - 전문가 주문 목록 조회

### 💰 정산 관리
- `GET /api/v1/experts/me/settlements` - 정산 내역 조회

### 👥 서브 계정 관리 (마스터 전문가 전용)
- `GET /api/v1/experts/me/sub-accounts` - 서브 계정 목록 조회
- `POST /api/v1/experts/me/sub-accounts` - 서브 계정 생성
- `PUT /api/v1/experts/me/sub-accounts/:subAccountId` - 서브 계정 수정

### 📊 기타 조회 API
- `GET /api/v1/experts/me/membership` - 멤버십 정보 조회
- `GET /api/v1/experts/me/assignment-history` - 배정 이력 조회
- `GET /api/v1/experts/me/penalty-history` - 패널티 이력 조회

## 현재 구현 상태

### ✅ 구현 완료
1. **서비스 매핑 관리**: 전문가가 제공하는 서비스 등록/조회
2. **JWT 인증**: 전문가 역할 검증 및 접근 제어
3. **페이지네이션**: 서비스 매핑 목록 페이지네이션
4. **에러 처리**: 일관된 에러 응답 형식
5. **관계형 데이터**: 서비스 항목과 카테고리 정보 포함

### 🚧 부분 구현
1. **전문가 통계 API**: 기본 구조는 있으나 일부 기능 미구현
2. **기타 핸들러들**: 스케줄/주문/정산 등 임시 구현 (501 응답)

### ⚠️ 주의사항
- 현재 Prisma 스키마와 실제 데이터베이스 스키마가 일부 불일치
- `approval_status`, `active_status` 등의 새로운 컬럼이 아직 DB에 없음
- 복잡한 쿼리는 실제 컬럼 구조에 맞춰 추가 조정 필요

## 데이터베이스 구조

### 주요 테이블
- `experts`: 전문가 기본 정보
- `expert_service_mapping`: 전문가-서비스 매핑 (✅ 작동)
- `orders`: 주문 정보 (전문가와 연관)
- `service_schedule`: 서비스 스케줄
- `settlements`: 정산 정보
- `reviews`: 리뷰 (평점 계산용)

### 샘플 데이터
- **전문가**: 김전문가 (expert@sgsg.com)
- **서비스 매핑**: 정기 청소 (140,000원), 대청소 (280,000원)
- **기본 통계**: 150건 완료, 4.8점 평점, 15,000,000원 총 수익

## 테스트 방법

### 1. 전문가 로그인
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "expert@sgsg.com", "password": "Expert@123456"}'
```

### 2. 서비스 매핑 조회
```bash
curl -X GET http://localhost:4000/api/v1/experts/me/services \
  -H "Authorization: Bearer {token}"
```

### 3. 서비스 매핑 생성
```bash
curl -X POST http://localhost:4000/api/v1/experts/me/services \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"serviceItemId": "it3", "customPrice": 75000, "isAvailable": true}'
```

## 향후 확장 계획

### 🔄 다음 단계
1. **실제 통계 API 완성**: 이번 달 수익 계산, 세부 통계
2. **스케줄 관리 기능**: 전문가 일정 등록/수정/조회
3. **주문 관리 연계**: 전문가별 주문 목록 및 상태 관리
4. **정산 시스템 연계**: 월별/주별 정산 내역 조회
5. **서브 계정 기능**: 마스터-서브 계정 관계 관리

### 🏗️ 기술적 개선사항
1. **스키마 동기화**: Prisma 스키마와 DB 스키마 일치
2. **응답 스키마 개선**: TypeBox 스키마 검증 최적화
3. **캐싱 적용**: 자주 조회되는 통계 데이터 Redis 캐싱
4. **성능 최적화**: N+1 쿼리 방지 및 인덱스 최적화

## 기술 스택

- **백엔드**: Fastify + TypeScript
- **ORM**: Prisma 7 with PostgreSQL adapter
- **인증**: JWT with @fastify/jwt
- **검증**: TypeBox (JSON Schema 기반)
- **데이터베이스**: PostgreSQL

전문가 서비스 매핑의 기본적인 CRUD 기능이 완료되어 전문가가 제공할 서비스를 등록하고 관리할 수 있습니다!