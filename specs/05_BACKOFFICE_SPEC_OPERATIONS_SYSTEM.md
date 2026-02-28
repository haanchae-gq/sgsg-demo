**이 문서는 [백오피스 스펙 개요](./05_BACKOFFICE_SPEC_OVERVIEW.md)의 분할 문서입니다.**

← [서비스 관리 파트4](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART4.md) | [개요](./05_BACKOFFICE_SPEC_OVERVIEW.md) →

---

## 정산 관리

### 정산 주기 및 프로세스
- **주간 정산**: 매주 월요일 00:00~23:59 동안 완료된 주문 대상
- **자동 정산 생성**: 매주 월요일 오전 2시 배치 작업 실행
- **정산 상태**: 대기(pending) → 승인(approved) → 지급완료(paid)
- **지급 방식**: 계좌이체 (전문가 등록 통장으로 자동 이체)

### 정산 목록 페이지 (Ant Design Table + 통계)
- **필터**: 상태(대기/승인/지급완료), 기간, 전문가명
- **통계 요약**: 총 정산액, 총 수수료, 총 순수익, 평균 정산액
- **일괄 작업**: 선택 정산 승인, 명세서 다운로드

### 정산 상세 페이지
1. **기본 정보**: 정산번호, 전문가, 정산 기간, 주문 수, 총 매출
2. **수익 계산**:
   - 총 매출: `₩1,500,000`
   - 플랫폼 수수료 (25.8%): `₩387,000`
   - VAT (10%): `₩150,000`
   - 순수익: `₩1,113,750`
3. **주문 내역**: 해당 정산에 포함된 주문 목록 (주문별 수익 상세)
4. **정산 명세서**: PDF 생성 및 다운로드 (React PDF 라이브러리)

### 정산 승인 프로세스
1. **재무 관리자 검토**: 정산 내역 확인, 이상 거래 검토
2. **승인 시**: 전문가에게 정산 명세서 알림 전송, 지급 준비 상태로 변경
3. **거절 시**: 거절 사유 입력, 전문가에게 알림, 정산 재계산 필요 시 주문 제외
4. **지급 완료**: 실제 계좌이체 후 상태 업데이트, 이체 증빙 파일 업로드

---

## 통계 및 리포트

### 대시보드 통계 (Recharts 기반)
1. **매출 추이 차트**: 선 그래프 (일별/주별/월별 매출)
2. **주문 상태 비율**: 도넛 차트 (신규, 진행중, 완료, 취소, 환불 비율)
3. **인기 서비스 TOP 5**: 막대 그래프 (서비스별 주문 수)
4. **사용자 가입 추이**: 영역 그래프 (일별 신규 사용자)

### 고급 분석 페이지 (Ant Design Pro 분석 템플릿)
- **기간 선택**: Ant Design DatePicker.RangePicker
- **비교 기능**: 전월/전년 동기 대비 성장률 계산
- **다차원 분석**: 지역별, 서비스별, 전문가 등급별 분석
- **실시간 데이터**: WebSocket으로 실시간 데이터 업데이트 (선택 사항)

### 리포트 다운로드
- **Excel 리포트**: `xlsx` 라이브러리로 사용자 정의 포맷 생성
- **PDF 리포트**: React PDF로 전문적인 리포트 생성 (차트 포함)
- **일정 리포트**: 매일/매주/매월 자동 리포트 이메일 발송 (Node.js 크론잡)

### 주요 리포트 유형
1. **매출 리포트**: 일별/주별/월별 매출, 수수료, 순이익
2. **주문 리포트**: 주문 수, 완료율, 취소율, 평균 결제 금액
3. **사용자 리포트**: 신규 가입, 활성 사용자, 이탈률
4. **전문가 리포트**: 정산 내역, 수익률, 서비스 품질 평가
5. **서비스 리포트**: 인기 서비스, 수익성 분석, 지역별 수요

---

## 시스템 설정

### 관리자 계정 관리 (Ant Design Pro 사용자 관리 템플릿)
- **관리자 목록**: 모든 관리자 계정 조회, 검색, 필터
- **계정 생성**: 이메일, 이름, 역할 할당, 초기 비밀번호 설정
- **계정 수정**: 역할 변경, 활성화/비활성화, 비밀번호 재설정
- **계정 삭제**: 소프트 삭제 (데이터 보존)

### 권한 관리 인터페이스
- **역할 CRUD**: 새로운 역할 생성, 권한 설정
- **권한 그룹**: 미리 정의된 권한 그룹 (운영, CS, 재무) 적용
- **사용자별 권한**: 특정 관리자에게 개별 권한 추가/제거

### 시스템 설정 페이지
- **기본 설정**: 플랫폼 이름, 로고, 파비콘, 메타데이터
- **정산 설정**: 수수료율 (25.8%), VAT율 (10%), 정산 주기, 지급일
- **알림 설정**: 이메일/SMS 알림 템플릿, 자동 알림 규칙
- **외부 서비스 설정**: Hecto, Aligo, AWS S3 인증 정보 (암호화 저장)
- **캐시 설정**: Redis TTL, 캐시 전략

### 활동 로그 시스템 (Ant Design Table + 필터)
- **로그 유형**: 로그인, 주문 변경, 정산 승인, 설정 변경, 오류
- **필터링**: 사용자, 유형, 기간, IP 주소, 심각도
- **상세 보기**: 로그 상세 정보 (요청 데이터, 응답 데이터)
- **로그 보존**: 90일 보존 후 자동 아카이빙

---

## Ant Design Pro 컴포넌트 매핑

### 레이아웃 컴포넌트
- **ProLayout**: 메인 레이아웃 (사이드바 + 헤더 + 푸터)
- **PageContainer**: 페이지 컨테이너 (브레드크럼 + 타이틀 + 액션 버튼)
- **Grid**: 반응형 그리드 시스템 (Ant Design Row/Col)

### 데이터 표시 컴포넌트
- **ProTable**: 고급 테이블 (필터, 검색, 정렬, 페이징, 일괄 작업)
- **ProDescriptions**: 상세 정보 표시 (키-값 쌍)
- **ProCard**: 카드 컴포넌트 (탭, 분할, 그리드 지원)
- **Statistic**: 통계 숫자 표시 (증감율, 아이콘)

### 폼 및 입력 컴포넌트
- **ProForm**: 고급 폼 (다단계 폼, 동적 필드, 조건부 렌더링)
- **ModalForm**: 모달 내 폼 (생성/수정용)
- **DrawerForm**: 서랍 내 폼 (상세 수정용)
- **QueryFilter**: 쿼리 필터 (테이블 필터링용)

### 차트 및 시각화
- **Recharts**: 모든 차트 컴포넌트 (Ant Design Charts 대체)
- **G2Plot**: 복잡한 시각화 필요 시 (AntV 라이브러리)

### 기타 유용한 컴포넌트
- **Tag**: 상태 표시 (주문 상태, 사용자 상태)
- **Timeline**: 시간 순서 이력 표시
- **Steps**: 다단계 프로세스 표시
- **Alert**: 알림 및 경고 메시지
- **Notification**: 실시간 알림 토스트

---

## API 연동

### 인증 및 권한
- **로그인**: `POST /api/v1/auth/login/admin` (이메일/비밀번호 → JWT)
- **토큰 갱신**: `POST /api/v1/auth/refresh` (Refresh Token 사용)
- **권한 검증**: 모든 API 요청에 `Authorization: Bearer <token>` 헤더
- **역할 검증**: 백엔드에서 `role` 클레임 기반 접근 제어

### 대시보드 API
- `GET /api/v1/admin/dashboard/summary` - 주요 지표 요약
- `GET /api/v1/admin/dashboard/realtime-orders` - 실시간 주문 현황
- `GET /api/v1/admin/dashboard/recent-orders` - 최근 주문 목록
- `GET /api/v1/admin/dashboard/pending-approvals` - 승인 대기 항목
- `GET /api/v1/admin/dashboard/system-status` - 시스템 상태

### 사용자 관리 API
- `GET /api/v1/admin/users` - 사용자 목록 (필터, 검색, 페이징)
- `GET /api/v1/admin/users/:id` - 사용자 상세 정보
- `PUT /api/v1/admin/users/:id/status` - 사용자 상태 변경
- `POST /api/v1/admin/experts/:id/approve` - 전문가 승인
- `POST /api/v1/admin/experts/:id/reject` - 전문가 거절
- `GET /api/v1/admin/master-accounts/:id/team` - 마스터 계정 팀원 목록

### 주문 관리 API
- `GET /api/v1/admin/orders` - 주문 목록 (고급 필터)
- `GET /api/v1/admin/orders/:id` - 주문 상세 정보
- `PUT /api/v1/admin/orders/:id/status` - 주문 상태 변경
- `POST /api/v1/admin/orders/:id/reassign` - 전문가 재배정
- `POST /api/v1/admin/orders/:id/refund` - 환불 처리
- `GET /api/v1/admin/orders/:id/timeline` - 주문 타임라인
- `GET /api/v1/admin/orders/:id/chat-logs` - 채팅 내역

### 서비스 관리 API
- `GET /api/v1/admin/categories` - 카테고리 목록 (트리 구조)
- `POST /api/v1/admin/categories` - 카테고리 생성
- `PUT /api/v1/admin/categories/:id` - 카테고리 수정
- `DELETE /api/v1/admin/categories/:id` - 카테고리 삭제 (소프트)
- `GET /api/v1/admin/service-items` - 서비스 항목 목록
- `PUT /api/v1/admin/service-items/:id/price` - 서비스 가격 변경

### 정산 관리 API
- `GET /api/v1/admin/settlements` - 정산 목록
- `GET /api/v1/admin/settlements/:id` - 정산 상세
- `POST /api/v1/admin/settlements/:id/approve` - 정산 승인
- `POST /api/v1/admin/settlements/:id/reject` - 정산 거절
- `POST /api/v1/admin/settlements/:id/mark-paid` - 지급 완료 표시
- `GET /api/v1/admin/settlements/:id/statement` - 정산 명세서 PDF

### 통계 API
- `GET /api/v1/admin/statistics/sales` - 매출 통계 (기간별)
- `GET /api/v1/admin/statistics/orders` - 주문 통계
- `GET /api/v1/admin/statistics/users` - 사용자 통계
- `GET /api/v1/admin/statistics/top-services` - 인기 서비스 TOP 5
- `GET /api/v1/admin/statistics/export` - 리포트 데이터 내보내기

### 시스템 설정 API
- `GET /api/v1/admin/settings` - 시스템 설정 조회
- `PUT /api/v1/admin/settings` - 시스템 설정 업데이트
- `GET /api/v1/admin/admins` - 관리자 목록
- `POST /api/v1/admin/admins` - 관리자 생성
- `PUT /api/v1/admin/admins/:id` - 관리자 수정
- `GET /api/v1/admin/logs` - 활동 로그 조회

---

## 보안 및 권한

### 프론트엔드 보안
1. **JWT 저장**: `httpOnly` 쿠키에 저장 (XSS 방지)
2. **토큰 갱신**: 30분 만료, 자동 갱신 메커니즘
3. **CSRF 보호**: `X-CSRF-Token` 헤더 사용
4. **CSP 헤더**: Content Security Policy 적용
5. **XSS 방지**: 모든 사용자 입력 sanitization

### 백엔드 보안
1. **역할 검증**: 모든 관리자 API 엔드포인트에서 `role` 검증
2. **입력 검증**: TypeBox 스키마로 모든 입력값 검증
3. **SQL 인젝션 방지**: Prisma 사용으로 자동 방지
4. **Rate Limiting**: 관리자 API도 적절한 Rate Limit 적용
5. **감사 로그**: 모든 관리자 작업 로깅

### 데이터 접근 제어
1. **수직 권한**: 역할별 데이터 접근 범위 제한
2. **수평 권한**: 자신의 데이터만 접근 가능 (CS 관리자는 자신이 처리한 주문만)
3. **민감 데이터 마스킹**: 주민등록번호, 계좌번호 등 부분 마스킹
4. **데이터 내보내기 제한**: 대량 데이터 내보내기 권한 별도 관리

---

## 테스트 전략

### 단위 테스트 (Vitest + React Testing Library)
- **컴포넌트 테스트**: 모든 주요 컴포넌트의 렌더링 및 상호작용
- **훅 테스트**: 커스텀 훅 (usePermission, useDashboardData 등)
- **유틸리티 테스트**: 형식 변환, 권한 검증, 데이터 처리 함수

### 통합 테스트
- **API 연동 테스트**: Axios 모킹으로 API 호출 테스트
- **상태 관리 테스트**: Zustand 스토어의 상태 변경 테스트
- **라우팅 테스트**: 권한별 라우팅 동작 테스트

### E2E 테스트 (Playwright)
- **사용자 시나리오 테스트**: 전문가 승인, 주문 모니터링, 정산 처리 전체 흐름
- **크로스 브라우저 테스트**: Chrome, Firefox, Safari
- **모바일 반응형 테스트**: 다양한 화면 크기에서 레이아웃 테스트

### 테스트 커버리지 목표
- **컴포넌트**: 80% 이상
- **비즈니스 로직**: 90% 이상  
- **API 연동**: 85% 이상
- **E2E 시나리오**: 모든 주요 사용자 시나리오

---

## 배포 전략

### 개발 환경
- **로컬 개발**: `npm run dev` (Vite 개발 서버)
- **API Mocking**: MSW(Mock Service Worker)로 백엔드 API 모킹
- **환경 변수**: `.env.development` 파일로 로컬 설정

### 스테이징 환경
- **Docker 컨테이너**: Nginx + React 앱 빌드 파일
- **지속적 통합**: GitHub Actions로 자동 빌드 및 테스트
- **프리뷰 배포**: Pull Request별 프리뷰 배포 (Vercel/Netlify)

### 프로덕션 환경
- **정적 호스팅**: AWS S3 + CloudFront (CDN)
- **무중단 배포**: Blue-Green 배포 전략
- **롤백 계획**: 이전 버전으로 빠른 롤백 가능
- **모니터링**: Sentry로 프론트엔드 에러 추적, CloudWatch 로그

### 성능 최적화
- **코드 스플리팅**: React.lazy + Suspense로 라우트 기반 코드 분할
- **이미지 최적화**: WebP 형식, Lazy Loading, Responsive Images
- **번들 최적화**: Vite의 기본 최적화 + manualChunks 설정
- **캐싱 전략**: CDN 캐시, 브라우저 캐시 (Cache-Control 헤더)

---

## 개발 일정 및 마일스톤

### Phase 2: 백오피스 개발 (3-4주)
- **주 1**: 프로젝트 설정, 기본 레이아웃, 인증 시스템
- **주 2**: 대시보드, 사용자 관리 모듈
- **주 3**: 주문 관리, 서비스 관리 모듈
- **주 4**: 정산 관리, 통계 모듈, 시스템 설정

### 통합 및 테스트 (1주)
- **API 연동 테스트**: 모든 모듈 백엔드 API와 연동
- **E2E 테스트**: 주요 사용자 시나리오 테스트
- **성능 테스트**: 로딩 속도, 메모리 사용량, 렌더링 성능
- **보안 검토**: 권한 시스템, 데이터 보호 검토

### 배포 및 운영 (지속적)
- **스테이징 배포**: 내부 테스트 및 피드백 수집
- **프로덕션 롤아웃**: 단계적 롤아웃 (10% → 50% → 100%)
- **모니터링 설정**: 에러 추적, 성능 모니터링, 사용자 행동 분석
- **지속적 개선**: 사용자 피드백 반영, 성능 최적화

---

**작성일**: 2026-02-28  
**버전**: 3.0  
**상태**: 스펙 작성 완료  
