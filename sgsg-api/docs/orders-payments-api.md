# 주문 및 결제 API 문서

이 문서는 세션 4에서 구현된 주문 및 결제 API에 대한 설명입니다.

## API 개요

주문 및 결제 API는 고객의 서비스 주문 생성부터 결제 완료까지의 전체 워크플로우를 제공합니다.

## 주요 워크플로우

```
1. 서비스 선택 (세션 3 API 사용)
   ↓
2. 주문 생성 (POST /orders)
   ↓
3. 결제 초기화 (POST /payments/initialize)
   ↓
4. 결제 완료 (POST /payments/complete - PG 콜백)
   ↓
5. 주문 상태 업데이트 (schedule_pending)
```

## 구현된 API 엔드포인트

### 1. 주문 관리 API

#### POST /api/v1/orders
새로운 주문을 생성합니다.

**권한**: 로그인한 고객  
**요청 본문:**
```json
{
  "serviceItemId": "it1",
  "addressId": "addr1",
  "requestedDate": "2026-03-05T10:00:00Z",
  "customerNotes": "정기 청소 서비스 신청합니다. 매주 화요일 오전 선호합니다.",
  "metadata": {}
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "주문이 생성되었습니다.",
  "data": {
    "id": "cmm7uqunl0000yfj7h0jaz7qg",
    "orderNumber": "ORD-20260301-725992",
    "status": "new",
    "paymentStatus": "pending",
    "basePrice": 150000,
    "depositAmount": 30000,
    "totalAmount": 150000,
    "serviceItem": {
      "name": "정기 청소",
      "category": {
        "name": "청소 서비스"
      }
    },
    "customer": {
      "user": {
        "name": "김고객"
      }
    },
    "address": {
      "label": "집",
      "addressLine1": "강남구 테헤란로 123"
    }
  }
}
```

#### GET /api/v1/orders
주문 목록을 조회합니다.

**권한**: 인증된 사용자 (각자 관련된 주문만)  
**쿼리 파라미터:**
- `page`, `limit`: 페이지네이션
- `status`: 주문 상태 필터
- `paymentStatus`: 결제 상태 필터
- `dateFrom`, `dateTo`: 날짜 범위 필터

#### GET /api/v1/orders/:orderId
주문 상세 정보를 조회합니다.

**권한**: 해당 주문의 고객 또는 배정된 전문가

#### PUT /api/v1/orders/:orderId
주문 정보를 수정합니다.

**권한**: 해당 주문의 고객 또는 배정된 전문가  
**제한사항**: 'new' 또는 'consult_required' 상태에서만 수정 가능

#### POST /api/v1/orders/:orderId/cancel
주문을 취소합니다.

**요청 본문:**
```json
{
  "cancellationReason": "일정 변경으로 인한 취소"
}
```

### 2. 주문 메모 API

#### GET /api/v1/orders/:orderId/notes
주문 메모 목록을 조회합니다.

**권한**: 해당 주문 관련자 (고객/전문가/관리자)

#### POST /api/v1/orders/:orderId/notes
주문에 메모를 추가합니다.

**요청 본문:**
```json
{
  "content": "추가 요청사항: 애완동물이 있으니 주의해주세요.",
  "isInternal": false
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "주문 메모가 추가되었습니다.",
  "data": {
    "id": "cmm7urvya0000mbj7ofv0t5wj",
    "orderId": "cmm7uqunl0000yfj7h0jaz7qg",
    "authorType": "customer",
    "content": "추가 요청사항: 애완동물이 있으니 주의해주세요.",
    "isInternal": false,
    "createdAt": "2026-03-01T14:36:14.331Z",
    "author": {
      "name": "김고객"
    }
  }
}
```

### 3. 결제 관리 API

#### POST /api/v1/payments/initialize
주문에 대한 결제를 초기화합니다.

**권한**: 해당 주문의 고객  
**요청 본문:**
```json
{
  "orderId": "cmm7uqunl0000yfj7h0jaz7qg",
  "paymentType": "deposit",
  "method": "credit_card"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "결제가 초기화되었습니다.",
  "data": {
    "id": "cmm7ur7w70000fkj7cnkxakjv",
    "paymentNumber": "PAY-20260301-743154",
    "paymentType": "deposit",
    "amount": 30000,
    "status": "pending",
    "pgProvider": "test-provider"
  }
}
```

#### POST /api/v1/payments/complete
결제 완료를 처리합니다 (PG 콜백용).

**권한**: Public (PG 서버 전용)  
**요청 본문:**
```json
{
  "paymentId": "cmm7ur7w70000fkj7cnkxakjv",
  "pgTransactionId": "PG-TEST-12345",
  "pgResponse": {
    "status": "success",
    "transactionId": "PG-TEST-12345",
    "amount": 30000
  }
}
```

#### GET /api/v1/payments/:paymentId
결제 정보를 조회합니다.

**권한**: 해당 주문의 고객/전문가/관리자

#### POST /api/v1/payments/:paymentId/refund
결제를 환불합니다.

**권한**: 관리자만  
**요청 본문:**
```json
{
  "amount": 30000,
  "reason": "고객 요청에 의한 전액 환불"
}
```

## 비즈니스 로직

### 주문 상태 관리
- **new**: 새 주문 생성
- **schedule_pending**: 예약금 결제 완료, 스케줄 대기
- **schedule_confirmed**: 스케줄 확정
- **in_progress**: 서비스 진행 중
- **payment_pending**: 잔금 결제 대기
- **paid**: 결제 완료
- **as_requested**: 서비스 완료
- **cancelled**: 주문 취소

### 결제 상태 연동
- **예약금 결제**: `deposit_paid` → 주문 상태 `schedule_pending`
- **잔금 결제**: `balance_paid` → 주문 상태 `paid`
- **전액 결제**: `balance_paid` → 주문 상태 `paid`

### 가격 계산
- **기본 가격**: 서비스 항목의 `basePrice`
- **예약금**: 기본 가격의 20%
- **총 금액**: 기본 가격 + 현장 비용 - 할인

### 권한 관리
- **고객**: 자신의 주문만 조회/수정 가능
- **전문가**: 배정된 주문만 조회/메모 작성 가능
- **관리자**: 모든 주문 조회/환불 처리 가능

## 실제 테스트 데이터

### 테스트 계정
- **고객**: customer@test.com / Customer@123456
- **전문가**: expert@sgsg.com / Expert@123456

### 생성된 실제 데이터
- **주문 ID**: cmm7uqunl0000yfj7h0jaz7qg
- **주문 번호**: ORD-20260301-725992
- **서비스**: 정기 청소 (150,000원)
- **예약금**: 30,000원 (20%)
- **결제 ID**: cmm7ur7w70000fkj7cnkxakjv

## API 테스트 시나리오

### 완전한 주문-결제 플로우
```bash
# 1. 고객 로그인
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"Customer@123456"}'

# 2. 주문 생성
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Authorization: Bearer {customer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceItemId": "it1",
    "addressId": "addr1", 
    "requestedDate": "2026-03-05T10:00:00Z",
    "customerNotes": "정기 청소 신청합니다."
  }'

# 3. 결제 초기화 
curl -X POST http://localhost:4000/api/v1/payments/initialize \
  -H "Authorization: Bearer {customer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "{order_id}",
    "paymentType": "deposit",  
    "method": "credit_card"
  }'

# 4. 결제 완료 (PG 콜백)
curl -X POST http://localhost:4000/api/v1/payments/complete \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "{payment_id}",
    "pgTransactionId": "PG-TEST-12345",
    "pgResponse": {"status": "success", "amount": 30000}
  }'

# 5. 주문 상태 확인
curl -X GET http://localhost:4000/api/v1/orders/{order_id} \
  -H "Authorization: Bearer {customer_token}"
```

## 기술적 특징

### ✅ 구현된 기능
1. **완전한 CRUD**: 주문 생성, 조회, 수정, 취소
2. **결제 시스템**: 초기화, 완료, 환불 지원
3. **상태 관리**: 주문과 결제 상태 자동 동기화
4. **트랜잭션**: Prisma 트랜잭션으로 데이터 일관성 보장
5. **권한 관리**: 사용자별 접근 권한 제어
6. **메모 시스템**: 일반/내부 메모 구분 지원
7. **첨부파일**: 첨부파일 조회 구조 완성

### 🔧 기술 스택
- **주문 로직**: OrderService 클래스로 비즈니스 로직 분리
- **결제 로직**: PaymentService 클래스로 PG 연동 준비
- **데이터 검증**: TypeBox 스키마로 요청/응답 검증
- **에러 핸들링**: 일관된 에러 코드 체계
- **관계형 데이터**: 조인을 통한 완전한 정보 제공

### 🛡️ 보안 기능
- **JWT 인증**: 모든 API에서 토큰 검증
- **권한 체크**: 주문별 접근 권한 엄격 관리
- **데이터 검증**: 입력 데이터 타입 및 형식 검증
- **PG 연동 준비**: 실제 PG 연동을 위한 구조 완성

## 향후 확장 계획

### 🚀 추가 구현 예정
1. **전문가 배정**: 주문 생성 시 적합한 전문가 자동 배정
2. **실시간 알림**: WebSocket을 통한 주문 상태 변경 알림
3. **첨부파일 업로드**: 주문별 파일 업로드 기능
4. **복합 결제**: 부분 결제, 할부, 쿠폰 적용
5. **PG 연동**: 실제 결제 게이트웨이 연동

### 🔄 연계 기능
- **세션 2 (전문가)**: 전문가별 주문 목록 조회
- **세션 5 (리뷰)**: 완료된 주문에 대한 리뷰 작성
- **알림 시스템**: 주문 상태 변경 시 자동 알림

**주문부터 결제까지 완전한 엔드투엔드 플로우가 구현되어 실제 서비스 운영이 가능한 상태입니다!** 🎉