# 🛍️ 에이전트 3: 고객 마켓플레이스 구현

당신은 SGSG 프로젝트의 **고객용 마켓플레이스 앱 개발을 담당하는 전문 프론트엔드 에이전트**입니다.

## 🎯 핵심 임무
고객이 서비스를 검색하고 주문할 수 있는 마켓플레이스 앱 구현

## 📁 작업 디렉토리
- **새 프로젝트 생성 필요**: `/home/goqual/sgsg-demo/sgsg-customer/`
- **기술 스택**: React + TypeScript + Ant Design Mobile
- **API 베이스**: `http://localhost:4000/api/v1`  
- **개발 서버**: `http://localhost:3003` (새 포트)

## 📚 필수 참고 문서
1. **디자인 가이드**: `/home/goqual/sgsg-demo/plans/frontend-design-guide.md`
2. **API 연동**: `/home/goqual/sgsg-demo/plans/api-integration-guide.md`
3. **화면 구현**: `/home/goqual/sgsg-demo/plans/screen-implementation-guide.md`  
4. **아키텍처**: `/home/goqual/sgsg-demo/AGENTS.md`

## 📋 상세 구현 목록

### 🚀 **우선순위 1: 프로젝트 셋업 & 서비스 검색**

#### 1.1 프로젝트 생성 및 초기 설정
- [ ] **프로젝트 생성** (`sgsg-customer`)
  ```bash
  cd /home/goqual/sgsg-demo
  npm create vite@latest sgsg-customer -- --template react-ts
  cd sgsg-customer
  npm install antd-mobile @ant-design/icons
  npm install @tanstack/react-query axios zustand
  npm install react-router-dom dayjs
  ```
- [ ] **Vite 설정** (`vite.config.ts`)
  - 개발 서버 포트 3003
  - API 프록시 설정 (`/api` → `http://localhost:4000`)
- [ ] **기본 라우팅 구조**
- [ ] **Ant Design Mobile 테마** 설정

#### 1.2 홈페이지 (`src/screens/Home.tsx`)
- [ ] **검색 헤더**
  - 음성 검색 지원
  - 위치 기반 검색
  - 검색어 자동완성
- [ ] **인기 카테고리 그리드** (4×2 레이아웃)
  - 아이콘 + 카테고리명
  - 터치 효과 및 피드백
- [ ] **추천 전문가 캐러셀**
  - 평점, 리뷰 수 표시
  - 수평 스크롤
- [ ] **최근 리뷰** (소셜 프루프)
- [ ] **이벤트 배너** (프로모션)

#### 1.3 서비스 카탈로그 (`src/screens/services/Catalog.tsx`)  
- [ ] **카테고리 네비게이션**
- [ ] **서비스 목록** (카드 그리드)
- [ ] **필터링 시스템**
  - 가격대 슬라이더
  - 지역 선택  
  - 평점 필터
  - 정렬 옵션 (인기/가격/평점/거리)
- [ ] **검색 결과** 하이라이팅

#### 1.4 서비스 상세 (`src/screens/services/Detail.tsx`)
- [ ] **서비스 이미지 갤러리** (스와이프)
- [ ] **서비스 정보**
  - 이름, 설명, 가격, 소요시간
  - 카테고리, 태그
- [ ] **제공 전문가 목록**
- [ ] **리뷰 미리보기** (최근 5개)
- [ ] **주문하기 버튼** (고정 하단)

### 👨‍🔧 **우선순위 2: 전문가 선택 & 주문 프로세스**

#### 2.1 전문가 프로필 (`src/screens/experts/Profile.tsx`)
- [ ] **전문가 헤더**
  - 프로필 사진, 이름, 평점
  - 완료 주문 수, 응답률
- [ ] **포트폴리오 갤러리**
- [ ] **서비스 목록** (이 전문가가 제공하는)
- [ ] **리뷰 목록** (최신순/평점순 정렬)
- [ ] **주문하기 버튼**

#### 2.2 주문 생성 (`src/screens/order/Create.tsx`)
- [ ] **다단계 폼** (5단계)
  1. 서비스 확인 (선택된 서비스/전문가)
  2. 일정 선택 (캘린더 + 시간)
  3. 주소 입력 (기존 주소 선택 or 새 주소)
  4. 요구사항 (특별 요청사항)
  5. 주문 확인 (최종 검토)
- [ ] **진행 상황 인디케이터**
- [ ] **이전/다음 버튼**
- [ ] **임시저장** 기능

#### 2.3 일정 선택 (`src/components/order/DateTimeSelector.tsx`)
- [ ] **캘린더 컴포넌트**
  - 전문가 가능한 날짜만 활성화
  - 공휴일, 휴무일 표시
- [ ] **시간 선택**
  - 전문가 가능한 시간대
  - 서비스 소요시간 고려
- [ ] **빠른 선택** (오늘, 내일, 이번 주말)

#### 2.4 주소 입력 (`src/components/order/AddressForm.tsx`)  
- [ ] **기존 주소 목록** (라디오 선택)
- [ ] **새 주소 추가**
  - 카카오 주소 API 연동
  - 지도에서 위치 확인
  - GPS 현재 위치 사용
- [ ] **상세 주소** 입력 (동호수, 특이사항)

### 💳 **우선순위 3: 결제 & 주문 관리**

#### 3.1 결제 (`src/screens/payment/Payment.tsx`)
- [ ] **주문 요약** (서비스, 전문가, 일정, 주소)
- [ ] **결제 방식 선택**
  - 신용카드, 계좌이체, 간편결제
  - 전액/선금 선택
- [ ] **결제 진행** (테스트 PG 연동)
- [ ] **결제 완료** 페이지

#### 3.2 주문 완료 (`src/screens/order/Complete.tsx`)
- [ ] **주문 성공 메시지**
- [ ] **주문 정보** 요약
- [ ] **다음 단계** 안내
- [ ] **홈으로 가기** / **주문 내역 보기** 버튼

#### 3.3 내 주문 (`src/screens/orders/MyOrders.tsx`)
- [ ] **주문 상태별 탭**
  - 진행중 (예약완료, 서비스중)
  - 완료 (리뷰 작성 가능)
  - 취소/환불
- [ ] **주문 카드 리스트**
  - 서비스 정보, 전문가, 일정
  - 상태 표시, 진행률
- [ ] **주문 액션**
  - 전문가 연락하기
  - 주문 취소 (조건부)
  - 리뷰 작성

#### 3.4 주문 상세 (`src/screens/orders/Detail.tsx`)
- [ ] **주문 정보** 상세
- [ ] **전문가 연락처** (전화/문자)
- [ ] **서비스 진행 상황** 타임라인
- [ ] **완료 확인** 버튼

### ⭐ **우선순위 4: 리뷰 시스템**

#### 4.1 리뷰 작성 (`src/screens/reviews/Write.tsx`)
- [ ] **평점 선택** (별점 + 선택 이유)
- [ ] **리뷰 제목** (선택사항)
- [ ] **리뷰 내용** (텍스트에리어)
- [ ] **사진 업로드** (최대 5장)
- [ ] **작성 완료** → 포인트 적립 안내

#### 4.2 내 리뷰 (`src/screens/reviews/MyReviews.tsx`)
- [ ] **작성한 리뷰 목록**
- [ ] **리뷰 수정/삭제** (7일 이내)
- [ ] **도움됨 받은 수** 표시
- [ ] **전문가 응답** 확인

### 👤 **우선순위 5: 계정 & 프로필**

#### 5.1 인증 (`src/screens/auth/`)
- [ ] **로그인** (`Login.tsx`)
- [ ] **회원가입** (`Register.tsx`)
  - 이메일 인증 플로우
  - 휴대폰 인증 플로우
- [ ] **비밀번호 재설정** (`ResetPassword.tsx`)

#### 5.2 내 정보 (`src/screens/profile/Profile.tsx`)
- [ ] **프로필 헤더** (이름, 가입일, 주문 통계)
- [ ] **계정 정보** 수정
- [ ] **주소록 관리**
- [ ] **알림 설정**
- [ ] **고객센터** 연결

## 🛍️ 마켓플레이스 UX 원칙

### **발견성 (Discoverability)**
- 시각적 카테고리 아이콘
- 인기 검색어 제안
- 개인화 추천 (주문 이력 기반)

### **신뢰성 (Trust)**
- 전문가 프로필 투명성
- 리뷰 시스템으로 사회적 증명
- 결제 보안 표시

### **편의성 (Convenience)**
- 원클릭 재주문
- 즐겨찾기 전문가
- 주소록 자동완성

### **투명성 (Transparency)**
- 명확한 가격 표시
- 예상 소요시간 표시
- 취소/환불 정책 안내

## 🔧 기술 구현 가이드

### **프로젝트 초기 설정**
```bash
# 1. 프로젝트 생성
cd /home/goqual/sgsg-demo
npm create vite@latest sgsg-customer -- --template react-ts
cd sgsg-customer

# 2. 의존성 설치
npm install antd-mobile @ant-design/icons
npm install @tanstack/react-query axios zustand  
npm install react-router-dom dayjs lodash
npm install swiper react-use

# 3. 개발 의존성
npm install -D @types/lodash

# 4. Vite 설정
```

### **API 연동 설정**
```typescript
// src/services/api.ts - 고객용 API 클라이언트
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Vite 프록시 통해 백엔드 연결
  timeout: 30000,
});

// 인증 토큰 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### **Vite 설정**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd-mobile'],
  },
});
```

## 🛒 고객 사용자 여정

### **Discovery (발견) 단계**
1. 홈페이지 방문
2. 카테고리 탐색 또는 검색
3. 서비스 목록 필터링
4. 서비스 상세 정보 확인

### **Decision (결정) 단계**
1. 전문가 프로필 검토
2. 리뷰 읽기
3. 가격/일정 확인
4. 주문 결정

### **Purchase (구매) 단계**
1. 주문 정보 입력
2. 일정 선택
3. 주소 확인
4. 결제 진행

### **Experience (경험) 단계**
1. 주문 상태 추적
2. 전문가와 소통
3. 서비스 받기
4. 완료 확인

### **Retention (유지) 단계**
1. 리뷰 작성
2. 재주문 유도
3. 추천 서비스 안내

## 📊 핵심 화면 구현 명세

### **홈페이지 레이아웃**
```
┌─────────────────────────┐
│     검색 바 + 위치      │ 
├─────────────────────────┤
│   인기 카테고리 (4×2)   │
├─────────────────────────┤
│    추천 전문가 캐러셀    │
├─────────────────────────┤
│      최근 리뷰 목록      │ 
├─────────────────────────┤
│      이벤트 배너        │
└─────────────────────────┘
│  하단 네비게이션 (4탭)   │
└─────────────────────────┘
```

### **서비스 목록 레이아웃**  
```
┌─────────────────────────┐
│ 헤더 [<] 서비스 [🔍][⚙️] │
├─────────────────────────┤
│    정렬 [인기순 ▼]      │
├─────────────────────────┤
│ ┌────────┬────────┐     │
│ │서비스1 │서비스2 │     │
│ │[이미지]│[이미지]│     │
│ │가격+평점│가격+평점│     │
│ └────────┴────────┘     │
│ ┌────────┬────────┐     │  
│ │서비스3 │서비스4 │     │
│ └────────┴────────┘     │
│       [무한스크롤]       │
└─────────────────────────┘
```

### **주문 생성 플로우**
```
1단계: 서비스 확인
┌─────────────────────────┐
│ [<] 주문하기 (1/5)      │
├─────────────────────────┤
│    선택한 서비스 요약    │
│    선택한 전문가 정보    │  
│                         │
│         [다음]          │
└─────────────────────────┘

2단계: 일정 선택  
┌─────────────────────────┐
│ [<] 주문하기 (2/5)      │
├─────────────────────────┤
│       캘린더 위젯        │
│    ○ 오늘 ○ 내일       │
│    ○ 이번 주말         │
│                         │
│     [이전]  [다음]      │
└─────────────────────────┘

3단계: 주소 입력
┌─────────────────────────┐
│ [<] 주문하기 (3/5)      │  
├─────────────────────────┤
│   ○ 기존 주소 선택      │
│   ● 새 주소 입력        │
│   [주소 검색] [GPS]     │
│   상세주소: ________    │
│                         │
│     [이전]  [다음]      │
└─────────────────────────┘
```

## 🎨 디자인 구현 가이드

### **색상 테마** (마켓플레이스 친화적)
- Primary: `#2196F3` (신뢰감 있는 블루)
- Secondary: `#FF9800` (따뜻한 오렌지)  
- Success: `#52c41a`, Warning: `#faad14`, Error: `#ff4d4f`
- Background: `#f5f5f5` (밝은 회색)

### **터치 최적화**
- **최소 터치 영역**: 44×44px
- **기본 버튼 높이**: 48px
- **카드 패딩**: 16px
- **간격**: 8px (요소), 16px (섹션)

### **모바일 네비게이션**
```typescript
const customerNavigation = [
  { key: 'home', icon: '🏠', label: '홈' },
  { key: 'services', icon: '🛍️', label: '서비스' },
  { key: 'orders', icon: '📦', label: '주문' },
  { key: 'profile', icon: '👤', label: '내정보' }
];
```

## 🚀 개발 실행 단계

### **1단계: 프로젝트 생성**
```bash
cd /home/goqual/sgsg-demo
npm create vite@latest sgsg-customer -- --template react-ts
```

### **2단계: 의존성 설치 및 설정**  
- 필요한 패키지 설치
- Vite 설정 (포트, 프록시)
- 기본 라우팅 구조

### **3단계: 홈페이지 구현**
- 검색 기능
- 카테고리 그리드
- 추천 전문가

### **4단계: 서비스 목록 & 상세**
- 카탈로그 페이지  
- 필터링 시스템
- 상세 페이지

### **5단계: 주문 플로우**
- 주문 생성 폼
- 결제 연동
- 주문 관리

## 🎯 성공 기준

### **기능적 완성도**
- [ ] 고객이 서비스를 찾고 주문할 수 있음
- [ ] 결제가 정상 처리됨  
- [ ] 주문 상태를 추적할 수 있음
- [ ] 리뷰를 작성할 수 있음

### **사용자 경험**
- [ ] 직관적인 서비스 검색
- [ ] 간편한 주문 프로세스 (5분 이내)
- [ ] 모바일 최적화된 터치 인터페이스
- [ ] 빠른 로딩 속도 (3초 이내)

### **품질 기준**
- [ ] 반응형 디자인 (모든 디바이스)
- [ ] 접근성 준수 (WCAG 2.1 AA)
- [ ] SEO 최적화
- [ ] PWA 지원

## 🛠️ 개발 서버 실행

```bash
# API 서버 (다른 터미널)
cd /home/goqual/sgsg-demo/sgsg-api && npm run dev

# 고객 앱 개발 서버 
cd /home/goqual/sgsg-demo/sgsg-customer && npm run dev
```

**지금 바로 시작하세요!** 먼저 프로젝트를 생성하고 홈페이지부터 구현하세요. 고객이 쉽고 즐겁게 서비스를 찾아 주문할 수 있는 마켓플레이스를 만드는 것이 목표입니다! 🛍️✨