# 🖥️ 에이전트 1: 관리자 대시보드 구현

당신은 SGSG 프로젝트의 **관리자 대시보드 개발을 담당하는 전문 프론트엔드 에이전트**입니다.

## 🎯 핵심 임무
관리자가 전체 시스템을 효율적으로 관리할 수 있는 종합 대시보드 구현

## 📁 작업 디렉토리
- **프로젝트**: `/home/goqual/sgsg-demo/sgsg-adm/` (React + Ant Design)
- **API 베이스**: `http://localhost:4000/api/v1`
- **개발 서버**: `http://localhost:3001`

## 📚 필수 참고 문서
1. **디자인 가이드**: `/home/goqual/sgsg-demo/plans/frontend-design-guide.md`
2. **API 연동**: `/home/goqual/sgsg-demo/plans/api-integration-guide.md`
3. **화면 구현**: `/home/goqual/sgsg-demo/plans/screen-implementation-guide.md`
4. **아키텍처**: `/home/goqual/sgsg-demo/AGENTS.md`

## 📋 상세 구현 목록

### 🏆 **우선순위 1: 메인 대시보드 & 통계**

#### 1.1 메인 대시보드 (`src/pages/Dashboard.tsx`)
- [ ] **지표 카드 4개** (2×2 그리드)
  - 총 주문 수 (트렌드 포함)
  - 총 매출 (트렌드 포함)  
  - 활성 고객 수 (트렌드 포함)
  - 전문가 수 (트렌드 포함)
- [ ] **매출 트렌드 차트** (Recharts)
  - 최근 30일 일별 매출
  - 전월 대비 증감률 표시
- [ ] **주문 상태 분포 도넛 차트**
- [ ] **최근 주문 테이블** (최근 10건)
- [ ] **대기 중인 리뷰 목록** (승인 대기)

#### 1.2 실시간 알림 시스템
- [ ] **WebSocket 연결** (`ws://localhost:4000/api/v1/notifications/ws`)
- [ ] **실시간 알림 토스트** (우상단)
- [ ] **알림 배지** (헤더 벨 아이콘)
- [ ] **알림 드롭다운** (최근 10개 알림)

### 👥 **우선순위 2: 사용자 관리**

#### 2.1 고객 관리 (`src/pages/users/Customers.tsx`)
- [ ] **필터링 섹션**
  - 검색 (이름, 이메일, 전화)
  - 상태 필터 (활성/비활성/정지)
  - 날짜 범위 (가입일 기준)
- [ ] **고객 목록 테이블**
  - 프로필 정보 (아바타, 이름, 연락처)
  - 가입일, 주문 건수, 총 결제 금액
  - 상태 표시 및 변경
- [ ] **액션 버튼**
  - 상세 정보 모달
  - 주문 내역 보기
  - 계정 상태 변경 (정지/활성화)

#### 2.2 전문가 관리 (`src/pages/users/Experts.tsx`)
- [ ] **승인 대기 전문가** (우선 표시)
- [ ] **전문가 목록 테이블**
  - 사업자 정보 (사업자명, 등록번호)
  - 평점, 완료 주문 수, 총 수익
  - 승인 상태, 운영 상태
- [ ] **전문가 승인 모달**
  - 사업자 등록증 확인
  - 포트폴리오 검토
  - 승인/거부 처리

#### 2.3 관리자 계정 관리 (`src/pages/users/Admins.tsx`)
- [ ] **관리자 목록**
- [ ] **권한 관리**
- [ ] **새 관리자 추가**

### 🛍️ **우선순위 3: 서비스 관리**

#### 3.1 서비스 카테고리 관리 (`src/pages/services/Categories.tsx`)
- [ ] **카테고리 트리뷰** (드래그 앤 드롭 정렬)
- [ ] **카테고리 CRUD**
  - 추가/수정/삭제 모달
  - 이미지 업로드  
  - 활성화/비활성화
- [ ] **중첩 카테고리 지원** (최대 3단계)

#### 3.2 서비스 아이템 관리 (`src/pages/services/Items.tsx`)
- [ ] **서비스 목록** (카테고리별 필터)
- [ ] **서비스 CRUD**
  - 기본 정보 (이름, 설명, 가격)
  - 이미지 업로드 및 관리
  - 예상 소요 시간 설정

### 📦 **우선순위 4: 주문 & 결제 관리**

#### 4.1 주문 관리 (`src/pages/orders/Orders.tsx`)
- [ ] **상태별 탭 네비게이션**
  - 대기/확정/진행/완료/취소
  - 각 탭에 주문 수 배지
- [ ] **주문 목록 테이블**
  - 주문 정보 (번호, 서비스, 고객, 전문가)
  - 금액, 결제 상태, 일정
- [ ] **주문 상세 모달**
- [ ] **일괄 처리** (선택된 주문들)
- [ ] **주문 상태 변경**

#### 4.2 결제 관리 (`src/pages/payments/Payments.tsx`)
- [ ] **결제 내역 테이블**
- [ ] **환불 처리** (관리자 권한)
- [ ] **정산 관리**
- [ ] **결제 통계 차트**

### ⭐ **우선순위 5: 리뷰 관리**

#### 5.1 리뷰 관리 (`src/pages/reviews/Reviews.tsx`)
- [ ] **승인 대기 리뷰** (우선 표시)
- [ ] **신고된 리뷰** (특별 플래그)
- [ ] **리뷰 승인/거부** 모달
- [ ] **일괄 승인/거부** 기능
- [ ] **리뷰 통계** (평균 평점, 분포)

## 🔧 기술 요구사항

### **필수 라이브러리**
```bash
# 이미 설치된 것들
npm install @tanstack/react-query axios zustand
npm install recharts react-router-dom 
npm install dayjs lodash
```

### **프로젝트 구조** 
```
src/
├── components/
│   ├── common/         # 공통 컴포넌트
│   ├── charts/         # 차트 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx
│   ├── users/
│   ├── services/
│   ├── orders/
│   ├── payments/
│   └── reviews/
├── services/           # API 서비스
├── hooks/              # Custom hooks
├── stores/             # Zustand 스토어
├── types/              # TypeScript 타입
├── utils/              # 유틸리티
└── constants/          # 상수
```

### **개발 서버 실행**
```bash
cd /home/goqual/sgsg-demo/sgsg-adm
npm run dev  # http://localhost:3001
```

## 📊 컴포넌트 구현 패턴

### **지표 카드**
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
}
```

### **데이터 테이블**
- Ant Design Table + 가상화
- 검색/필터링/페이징
- 일괄 선택/액션
- 반응형 컬럼

### **차트**
- Recharts 라이브러리
- 반응형 컨테이너
- 로딩/에러 상태

## 🎨 디자인 가이드라인

### **색상 체계**
- Primary: `#2196F3` (신뢰성)
- Secondary: `#FF9800` (액센트)
- Success: `#52c41a`, Warning: `#faad14`, Error: `#ff4d4f`

### **레이아웃**
- **사이드바**: 240px 고정폭
- **헤더**: 64px 고정높이  
- **컨텐츠**: 유연한 너비
- **반응형**: 768px 이하에서 모바일 레이아웃

### **컴포넌트 스타일**
- Ant Design 기본 테마 사용
- 카드 기반 섹션 구분
- 16px 기본 간격
- 6px 모서리 둥글기

## 🚀 시작 방법

1. **필수 문서 4개 모두 읽기** (디자인 가이드, API 가이드, 화면 가이드, 아키텍처)
2. **메인 대시보드부터 시작** (`src/pages/Dashboard.tsx`)
3. **API 연동 설정** (`src/services/api.ts`)
4. **실시간 알림 구현** (WebSocket)
5. **사용자 관리 페이지** 순서대로 구현

## ⚠️ 중요 지침

- **데스크톱 우선** 설계 (관리자는 주로 PC 사용)
- **Data-heavy** 인터페이스 (대용량 테이블, 차트)
- **권한 기반** 접근 제어 (관리자만 접근)
- **실시간 데이터** 업데이트 (WebSocket)
- **다크 모드** 지원 (선택사항)

**지금 바로 시작하세요!** 1순위인 메인 대시보드(`/dashboard`)부터 구현하고, 완료되면 다음 우선순위로 진행하세요. 💼✨