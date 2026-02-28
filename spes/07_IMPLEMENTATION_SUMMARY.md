# 쓱싹 홈케어 플랫폼 - 구현 요약 및 우선순위

**문서 버전**: 2.1  
**작성일**: 2026-01-14  
**상태**: 최종 스펙

---

## 📋 전체 요구사항 요약

### 기존 요구사항 (초기)
- 백엔드: PostgreSQL + Node.js (Express)
- 우선순위: 전문가 웹앱 → 백오피스 → 사용자 웹

### 추가 요구사항 (PDF 반영)
- **마스터/서브 계정 구조** (전문가 팀 관리)
- **채팅 기능** (전문가 ↔ 고객 실시간 상담)
- **상세 서비스 카테고리** (3단계 구조, 24+ 서비스)
- **가격 스냅샷 시스템** (과거 거래 보호)
- **백오피스 상세 기능** (팀 관리, 가격 관리, 리포트)
- **소비자 웹 상세 스펙** (페이지 구조, 신청 폼 로직)

---

## 🎯 개발 우선순위 (업데이트)

### Phase 1: 백엔드 기초 (1-2주)
**목표**: 데이터베이스 및 기본 API 구축

**작업 항목**:
- [ ] PostgreSQL 스키마 생성 (30+ 테이블)
  - 사용자 관리 (users, customers, experts, admins, addresses)
  - 전문가 팀 (expert_teams)
  - 서비스 카탈로그 (3단계 구조)
  - 주문 관리 (orders, order_notes, service_schedule)
  - 결제/정산 (payments, settlements)
  - 채팅 (chat_rooms, chat_messages)
  - 가격 관리 (price_snapshots, onsite_cost_templates)
  
- [ ] Node.js + Express 프로젝트 설정
- [ ] Prisma ORM 설정
- [ ] JWT 인증 시스템
- [ ] 기본 API 엔드포인트 (인증, 사용자)
- [ ] Redis 캐싱 설정
- [ ] Socket.io 실시간 통신 설정

---

### Phase 2: 전문가 웹앱 (2-3주)
**목표**: 전문가가 주문을 관리할 수 있는 웹 애플리케이션

**작업 항목**:
- [ ] React + Vite 프로젝트 설정
- [ ] 로그인/회원가입
  - 마스터/서브 계정 선택
  - SMS 인증
  
- [ ] 대시보드 (홈)
  - 주문 통계 (마스터: 전체, 서브: 배정된 것만)
  - 오늘/내일 일정
  - 팀원 실적 (마스터만)
  
- [ ] 예약관리
  - 8개 상태 탭 (신규, 상담필요, 예약미정, 예약확정, 잔금결제, 구매확정, A/S, 취소)
  - 주문 목록 (필터링, 정렬)
  - 주문 상세
  - 수락/거절 (마스터만)
  - 내부 배정 (마스터만)
  - 상담하기 (통화/채팅)
  - 일정 등록
  - 서비스 시작/완료
  - 현장 비용 입력
  - 사진 업로드
  - 결제 요청
  
- [ ] 캘린더
  - 월간 뷰
  - 일자별 주문 목록
  - 팀원 필터 (마스터만)
  
- [ ] 채팅
  - 채팅방 목록
  - 1:1 채팅
  - 이미지/파일 첨부
  - 읽음/안읽음 표시
  - 실시간 알림
  
- [ ] 내정보
  - 프로필 관리
  - 팀원 관리 (마스터만)
  - 평점 및 리뷰
  - 활성/비활성 상태
  - 단가표
  - 공지사항

---

### Phase 3: 백오피스 (2-3주)
**목표**: 운영팀이 플랫폼을 관리할 수 있는 관리자 시스템

**작업 항목**:
- [ ] React + Vite 프로젝트 설정
- [ ] 로그인 (관리자 전용)
  
- [ ] 대시보드
  - 실시간 통계 (주문, 사용자, 매출)
  - 최근 주문
  - 승인 대기 알림
  
- [ ] 사용자 관리
  - 고객 목록/상세
  - 전문가 목록/상세
  - 전문가 승인/거절
  - 전문가 팀 관리
  - 전문가 역할/지역 관리
  - 사용자 활성화/비활성화
  
- [ ] 주문 관리
  - 전체 주문 목록
  - 주문 상세
  - 주문 상태 변경
  - 전문가 재배정
  - 환불 처리
  
- [ ] 서비스 관리
  - 대분류 관리 (CRUD)
  - 중분류 관리 (CRUD)
  - 상세분류 관리 (CRUD)
  - 서비스 옵션 관리
  - 가격 관리 (스냅샷)
  - 현장 비용 템플릿 관리
  
- [ ] 정산 관리
  - 정산 목록
  - 정산 상세
  - 정산 승인/거절
  - 정산 처리 (지급)
  - 정산 명세서 생성
  
- [ ] 통계 및 리포트
  - 주문 리포트 (Excel/PDF)
  - 정산 리포트 (Excel/PDF)
  - 매출 통계
  - 사용자 통계
  - 전문가 통계

---

### Phase 4: 소비자 웹 (3-4주)
**목표**: 고객이 서비스를 검색하고 주문할 수 있는 웹 애플리케이션

**작업 항목**:
- [ ] React + Vite 프로젝트 설정
- [ ] 홈 (메인)
  - Hero Banner
  - 서비스 대분류 카테고리
  - 인기 서비스
  - 안심 보장 서비스
  - 리뷰
  - 전문가 인터뷰 (유튜브)
  
- [ ] 서비스 목록
  - 카테고리 네비게이션
  - 서비스 카드 리스트
  - 검색/필터링
  
- [ ] 서비스 상세
  - 서비스 소개
  - 가격 정보
  - 후기/사진
  - 신청 폼
  
- [ ] 서비스 신청 폼
  - 다단계 폼 (서비스별 상이)
  - 옵션 선택
  - 주소 입력
  - 결제 (예약금)
  
- [ ] 전문가 지원
  - 전문가 모집 페이지
  - 지원 폼
  
- [ ] 마이페이지
  - 내 주문 목록
  - 주문 상세
  - 프로필 관리
  - 주소 관리
  
- [ ] 외부 서비스 연동
  - GA4, Meta Pixel, Naver Pixel
  - 채널톡
  - Toss Payments

---

## 📊 데이터베이스 테이블 최종 목록 (35개)

### 사용자 관리 (5개)
1. users - 사용자 기본 정보
2. customers - 고객 상세
3. experts - 전문가 상세
4. admins - 관리자 상세
5. addresses - 주소 정보

### 전문가 팀 (1개)
6. expert_teams - 마스터/서브 관계

### 서비스 카탈로그 (5개)
7. service_categories - 대분류
8. service_sub_categories - 중분류
9. service_items - 상세분류
10. service_item_options - 서비스 옵션
11. expert_service_mapping - 전문가-서비스 매핑

### 주문 관리 (4개)
12. orders - 주문
13. order_notes - 주문 메모
14. order_attachments - 첨부파일
15. service_schedule - 서비스 일정

### 결제 및 정산 (3개)
16. payments - 결제
17. settlements - 정산
18. settlement_details - 정산 상세

### 가격 관리 (2개)
19. price_snapshots - 가격 스냅샷
20. onsite_cost_templates - 현장 비용 템플릿

### 채팅 (2개)
21. chat_rooms - 채팅방
22. chat_messages - 채팅 메시지

### 리뷰 및 평가 (1개)
23. reviews - 리뷰

### 시스템 관리 (2개)
24. notifications - 알림
25. audit_logs - 감사 로그

### 쇼핑몰 (향후, 10개)
26. products - 상품
27. product_categories - 상품 카테고리
28. cart - 장바구니
29. cart_items - 장바구니 항목
30. product_orders - 상품 주문
31. product_order_items - 상품 주문 항목
32. coupons - 쿠폰
33. coupon_redemptions - 쿠폰 사용
34. shipping_addresses - 배송 주소
35. product_reviews - 상품 리뷰

---

## 🔧 기술 스택 최종 확정

### 백엔드
```yaml
언어: Node.js 18+ (TypeScript)
프레임워크: Express.js
데이터베이스: PostgreSQL 14+
ORM: Prisma
캐시: Redis 7+
실시간: Socket.io
인증: JWT (jsonwebtoken)
파일 업로드: Multer + AWS S3
SMS: Aligo
이메일: SendGrid
결제: Toss Payments
```

### 프론트엔드
```yaml
라이브러리: React 18
언어: TypeScript
번들러: Vite
상태관리: Zustand
라우팅: React Router v6
UI 프레임워크: Tailwind CSS
HTTP 클라이언트: Axios
실시간: Socket.io Client
폼 관리: React Hook Form
차트: Recharts
테이블: TanStack Table
날짜: date-fns
아이콘: React Icons
```

### DevOps
```yaml
컨테이너: Docker
오케스트레이션: Docker Compose
웹서버: Nginx
CI/CD: GitHub Actions
프로세스 관리: PM2
로깅: Winston
모니터링: CloudWatch (AWS)
에러 추적: Sentry
```

### 외부 서비스
```yaml
결제: Toss Payments
SMS: Aligo
이메일: SendGrid
파일 저장: AWS S3
상담: 채널톡
분석: GA4, Meta Pixel, Naver Pixel
```

---

## 📈 예상 개발 일정

### Week 1-2: 백엔드 기초
- PostgreSQL 스키마 설계 및 마이그레이션
- Node.js + Express 프로젝트 설정
- Prisma ORM 설정
- JWT 인증 시스템
- 기본 API 엔드포인트
- Redis + Socket.io 설정

### Week 3-5: 전문가 웹앱
- React 프로젝트 설정
- 로그인/회원가입 (마스터/서브)
- 대시보드
- 예약관리 (8개 상태 탭)
- 캘린더
- 채팅
- 내정보 (팀원 관리 포함)

### Week 6-8: 백오피스
- React 프로젝트 설정
- 로그인
- 대시보드
- 사용자 관리 (팀 관리 포함)
- 주문 관리
- 서비스 관리 (3단계 카테고리)
- 정산 관리
- 통계 및 리포트

### Week 9-12: 소비자 웹
- React 프로젝트 설정
- 홈 (메인)
- 서비스 목록/상세
- 서비스 신청 폼 (다단계)
- 전문가 지원
- 마이페이지
- 외부 서비스 연동 (GA4, 채널톡 등)

### Week 13-14: 통합 및 배포
- 통합 테스트
- 성능 최적화
- 보안 강화
- Docker 컨테이너화
- 클라우드 배포 (스테이징)
- 프로덕션 배포

---

## 🗂️ 스펙 문서 목록

### 기본 스펙 (6개)
1. [`00_PROJECT_OVERVIEW.md`](00_PROJECT_OVERVIEW.md) - 프로젝트 개요
2. [`01_DATABASE_SCHEMA.md`](01_DATABASE_SCHEMA.md) - 데이터베이스 스키마
3. [`02_BACKEND_API_SPEC.md`](02_BACKEND_API_SPEC.md) - 백엔드 API 명세
4. [`03_EXPERT_WEBAPP_SPEC.md`](03_EXPERT_WEBAPP_SPEC.md) - 전문가 웹앱
5. [`04_BACKOFFICE_SPEC.md`](04_BACKOFFICE_SPEC.md) - 백오피스
6. [`05_DEPLOYMENT_STRATEGY.md`](05_DEPLOYMENT_STRATEGY.md) - 배포 전략

### 추가 스펙 (2개)
7. [`06_ADDITIONAL_REQUIREMENTS.md`](06_ADDITIONAL_REQUIREMENTS.md) - 추가 요구사항 (PDF 반영)
8. [`07_IMPLEMENTATION_SUMMARY.md`](07_IMPLEMENTATION_SUMMARY.md) - 구현 요약 (본 문서)

---

## ✅ 핵심 변경사항 체크리스트

### 데이터베이스
- [x] 기본 테이블 설계 (20개)
- [x] 전문가 팀 구조 추가 (expert_teams)
- [x] 채팅 테이블 추가 (chat_rooms, chat_messages)
- [x] 3단계 카테고리 구조 (service_sub_categories)
- [x] 가격 스냅샷 (price_snapshots, onsite_cost_templates)
- [x] 서비스 옵션 (service_item_options)

### 백엔드 API
- [x] 인증 API (회원가입, 로그인, SMS 인증)
- [x] 전문가 API (프로필, 주문, 정산)
- [x] 팀 관리 API (팀원 추가/삭제, 내부 배정)
- [x] 채팅 API (채팅방, 메시지, 실시간)
- [x] 서비스 API (3단계 카테고리, 가격)
- [x] 주문 API (생성, 조회, 상태 변경)
- [x] 결제 API (Toss Payments 연동)
- [x] 정산 API (생성, 승인, 지급)
- [x] 관리자 API (사용자, 서비스, 정산 관리)

### 전문가 웹앱
- [x] 마스터/서브 계정 로그인
- [x] 대시보드 (계정별 권한)
- [x] 예약관리 (8개 상태 탭)
- [x] 내부 배정 기능
- [x] 채팅 기능
- [x] 캘린더 (팀원 필터)
- [x] 팀원 관리 (마스터만)

### 백오피스
- [x] 전문가 팀 관리
- [x] 3단계 카테고리 관리
- [x] 가격 스냅샷 관리
- [x] 정산 상태 관리
- [x] 상세 대시보드
- [x] 리포트 (주문, 정산)

### 소비자 웹
- [x] 페이지 구조 설계
- [x] 서비스 신청 폼 로직
- [x] 외부 서비스 연동 계획

---

## 🚀 즉시 실행 가능한 작업

### 1주차
1. **프로젝트 초기화**
   ```bash
   # 백엔드
   mkdir backend && cd backend
   npm init -y
   npm install express prisma @prisma/client jsonwebtoken bcrypt
   npm install socket.io redis ioredis multer aws-sdk
   npm install -D typescript @types/node @types/express ts-node-dev
   
   # 전문가 웹앱
   npm create vite@latest frontend-expert -- --template react-ts
   cd frontend-expert
   npm install zustand react-router-dom axios socket.io-client
   npm install react-hook-form tailwindcss
   
   # 백오피스
   npm create vite@latest frontend-backoffice -- --template react-ts
   cd frontend-backoffice
   npm install zustand react-router-dom axios
   npm install react-hook-form tailwindcss antd recharts
   ```

2. **데이터베이스 설정**
   ```bash
   # PostgreSQL 설치 및 실행
   # Redis 설치 및 실행
   
   # Prisma 초기화
   cd backend
   npx prisma init
   
   # 스키마 작성 (schema.prisma)
   # 마이그레이션 실행
   npx prisma migrate dev --name init
   ```

3. **환경 변수 설정**
   ```env
   # backend/.env
   DATABASE_URL=postgresql://user:password@localhost:5432/sgsg_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

---

## 📞 다음 단계

1. **팀 검토 및 피드백**
   - 모든 스펙 문서 검토
   - 추가 요구사항 확인
   - 기술 스택 최종 확정

2. **개발 환경 구축**
   - 로컬 환경 설정
   - Git 저장소 생성
   - 프로젝트 구조 초기화

3. **개발 시작**
   - Phase 1: 백엔드 기초 (1-2주)
   - Phase 2: 전문가 웹앱 (2-3주)
   - Phase 3: 백오피스 (2-3주)
   - Phase 4: 소비자 웹 (3-4주)

---

**작성일**: 2026-01-14  
**버전**: 2.1  
**상태**: 최종 스펙 완료
