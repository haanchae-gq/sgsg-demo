# 전문가 웹앱 스펙 (React + Ant Design Mobile)

**문서 버전**: 3.0 (Fastify + Ant Design Migration)  
**작성일**: 2026-02-28  
**우선순위**: P0 (최우선)  
**상태**: 신규 스펙  
**대상 사용자**: 서비스 제공 전문가 (마스터/서브 계정 포함)  
**관련 문서**: [01_ARCHITECTURE_DESIGN.md](01_ARCHITECTURE_DESIGN.md), [03_BACKEND_API_SPEC.md](03_BACKEND_API_SPEC.md)

---

## 📋 목차

1. [개요](#개요)
2. [모바일 퍼스트 디자인 원칙](#모바일-퍼스트-디자인-원칙)
3. [사용자 시나리오](#사용자-시나리오)
4. [화면 구성 및 컴포넌트](#화면-구성-및-컴포넌트)
5. [기능 명세](#기능-명세)
6. [Ant Design 컴포넌트 매핑](#ant-design-컴포넌트-매핑)
7. [상태 관리](#상태-관리)
8. [API 연동](#api-연동)
9. [성능 최적화](#성능-최적화)
10. [테스트 전략](#테스트-전략)

---

## 개요

### 목적
전문가가 현장에서 스마트폰으로 주문을 효율적으로 관리하고 서비스를 제공할 수 있는 모바일 우선 웹 애플리케이션입니다.

### 핵심 가치
- **모바일 퍼스트**: 현장 전문가의 작업 환경에 최적화된 모바일 UI/UX
- **실시간성**: 실시간 주문 알림 및 상태 업데이트
- **간편함**: 복잡한 설정 없이 직관적인 조작
- **신뢰성**: 안정적인 정산 정보와 투명한 수익 구조

### 주요 기능
1. **주문 관리**: 신규 주문 수락/거절, 진행 중 주문 관리, 완료 처리
2. **일정 관리**: 캘린더/리스트 뷰로 스케줄 확인 및 조정
3. **정산 관리**: 주간/월간 정산 내역, 명세서 확인 및 다운로드
4. **프로필 관리**: 전문가 정보, 서비스 항목, 계좌 정보 관리
5. **마스터/서브 계정**: 팀 운영을 위한 계정 계층 구조 관리
6. **알림 시스템**: 실시간 주문 알림, 일정 알림, 정산 알림

### 기술 스택 (v3.0)
| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **프론트엔드** | React | 18.2+ | 함수형 컴포넌트 + Hooks |
| **UI 라이브러리** | Ant Design Mobile | 5.0+ | 모바일 최적화 컴포넌트 |
| **라우팅** | React Router DOM | 6.0+ | 중첩 라우팅 지원 |
| **상태 관리** | Zustand | 4.0+ | 간단한 전역 상태 관리 |
| **HTTP 클라이언트** | Axios | 1.0+ | 인터셉터로 인증 처리 |
| **빌드 도구** | Vite | 4.0+ | 빠른 개발 서버 및 빌드 |
| **폼 관리** | React Hook Form | 7.0+ | 성능 최적화 폼 |
| **차트** | Recharts | 2.0+ | 정산 통계 시각화 |
| **지도** | React Naver Maps | 3.0+ | 주소 지도 표시 |

---

## 모바일 퍼스트 디자인 원칙

### 1. 반응형 브레이크포인트
```css
/* Mobile First Breakpoints */
const breakpoints = {
  xs: 320,   // 모바일 (세로)
  sm: 375,   // 모바일 (가로)
  md: 768,   // 태블릿
  lg: 1024,  // 태블릿 가로/작은 데스크톱
  xl: 1280   // 데스크톱
}
```

### 2. 터치 최적화
- **최소 터치 영역**: 44×44px (Apple HIG 기준)
- **버튼 크기**: 주요 액션 버튼 높이 48px, 보조 버튼 40px
- **간격**: 요소 간 최소 8px 간격 유지
- **스와이프 제스처**: 리스트 항목 스와이프 액션 지원

### 3. 네비게이션 패턴
- **하단 탭 바**: 주요 섹션 전환 (주문, 일정, 정산, 내 정보)
- **햄버거 메뉴**: 보조 기능 접근 (설정, 고객센터, 로그아웃)
- **뒤로가기 버튼**: 상단 좌측에 일관된 위치
- **글로벌 액션 버튼**: 주요 작업 (주문 수락, 서비스 시작 등)

### 4. Ant Design Mobile 컴포넌트 활용
- **네비게이션**: `TabBar`, `NavBar`, `SideBar`
- **폼**: `Form`, `Input`, `Picker`, `DatePicker`
- **피드백**: `Toast`, `Dialog`, `ActionSheet`, `Loading`
- **데이터 표시**: `List`, `Card`, `Grid`, `Collapse`
- **기타**: `PullToRefresh`, `InfiniteScroll`, `SwipeAction`

---

## 사용자 시나리오

### 시나리오 1: 신규 주문 수락 (마스터 계정)
```
1. 전문가 로그인 (마스터 계정)
   ↓
2. 대시보드에서 '새 주문 3건' 알림 확인
   ↓
3. 주문 목록에서 주문 선택
   ↓
4. 주문 상세 정보 확인:
   - 고객 정보 (이름, 연락처)
   - 서비스 내용 (대분류, 중분류, 소분류, 설명)
   - 주소 (지도 표시, 네비게이션 연결)
   - 일정 (요청 일시, 예상 소요시간)
   - 금액 (기본 금액, 추가 비용 가능성)
   ↓
5. '수락' 또는 '거절' 버튼 클릭
   ↓
6. 수락 시:
   - 일정 확정 및 고객에게 알림 전송
   - 서브 계정에 할당 가능 (옵션)
   ↓
7. 주문이 '예약 확정' 상태로 변경
```

### 시나리오 2: 서브 계정 작업 진행
```
1. 서브 계정 로그인
   ↓
2. '할당된 주문' 탭에서 오늘의 작업 확인
   ↓
3. 출발 전 '출발하기' 버튼 클릭
   ↓
4. 현장 도착 후 '도착 완료' 버튼 클릭
   ↓
5. 서비스 진행 중 추가 비용 발생 시:
   - '추가 비용 입력' 버튼 클릭
   - 서비스 카테고리에 매핑된 현장비용 항목 중 선택 (service_category_on_site_fee_mappings 기준)
   - 금액 입력 (고정 금액 또는 단가×수량)
   - 고객 동의 받기 (서명 또는 확인)
   ↓
6. 서비스 완료 후:
   - '완료 사진 업로드' (최대 5장)
   - 서비스 메모 작성
   - '서비스 완료' 버튼 클릭
   ↓
7. 시스템이 고객에게 잔금 결제 요청 알림 전송
```

### 시나리오 3: 정산 조회 및 명세서 다운로드
```
1. '정산' 탭 선택
   ↓
2. 주간/월간 전환으로 기간 선택
   ↓
3. 정산 요약 카드 확인:
   - 총 수익, 플랫폼 수수료, 순수익
   - 진행 중/완료/대기 중 정산 상태
   ↓
4. 정산 상세 리스트 조회 (주문별 상세)
   - 주문번호, 서비스명, 수익금, 수수료, 순수익
   - '상세 보기' 버튼으로 확장
   ↓
5. '명세서 다운로드' 버튼 클릭
   ↓
6. PDF 파일 생성 및 다운로드
```

### 시나리오 4: 마스터 계정 팀 관리
```
1. 마스터 계정 로그인
   ↓
2. '팀 관리' 메뉴 선택
   ↓
3. 서브 계정 목록 확인:
   - 활성/비활성 상태
   - 최근 활동 일시
   - 담당 주문 수
   ↓
4. 새 서브 계정 추가:
   - 이메일, 이름, 전화번호 입력
   - 권한 설정 (주문 접근 범위, 정산 조회 권한 등)
   - 초대 메일 발송
   ↓
5. 기존 서브 계정 권한 수정
   ↓
6. 팀 성과 대시보드 확인:
   - 팀 전체 수익
   - 개인별 성과 지표
   - 주문 처리 효율성
```

---

## 화면 구성 및 컴포넌트

### 1. 로그인/회원가입
#### 1.1 로그인 화면
- **컴포넌트**: `Form`, `Input`, `Button`, `Checkbox`, `Toast`
- **필드**: 이메일/전화번호, 비밀번호, '자동 로그인' 체크박스
- **액션**: 로그인, 비밀번호 찾기, 회원가입 링크
- **유효성 검사**: 이메일 형식, 비밀번호 8자 이상

#### 1.2 회원가입 화면 (전문가 전용)
- **단계적 폼** (Step Form):
  1. 기본 정보: 이메일, 비밀번호, 이름, 전화번호
  2. 사업자 정보: 사업자 등록번호, 상호명, 사업자 유형(개인/법인)
  3. 서비스 정보: 서비스 지역(시/구), 제공 서비스 카테고리
  4. 정산 정보: 은행명, 계좌번호, 예금주명
- **실시간 검증**: 사업자등록번호 유효성 검사, 은행 계좌 확인

### 2. 메인 대시보드
#### 2.1 요약 카드 영역
- **신규 주문 카드**: 건수, 최근 주문 시간, 바로가기
- **오늘의 일정 카드**: 예약 건수, 다음 일정 시간
- **정산 예정 카드**: 이번 달 예상 수익, 정산 예정일
- **알림 카드**: 미확인 알림 건수, 중요 알림 미리보기

#### 2.2 실시간 알림 섹션
- **풀다운 새로고침**: `PullToRefresh` 컴포넌트
- **알림 리스트**: `List` 컴포넌트, 스와이프로 읽음/삭제
- **알림 유형별 아이콘**: 주문, 정산, 시스템, 마케팅

#### 2.3 빠른 액션 버튼
- **주문 수락/거절 바로가기**
- **서비스 시작/완료**
- **정산 명세서 다운로드**

### 3. 주문 관리
#### 3.1 주문 목록 (`OrderList`)
- **필터 탭**: 전체, 신규, 진행중, 완료, 취소
- **검색**: 고객명, 주문번호, 서비스명으로 검색
- **정렬**: 최신순, 금액순, 일정순
- **주문 카드**: `Card` 컴포넌트, 상태별 색상 태그

#### 3.2 주문 상세 (`OrderDetail`)
- **상단 헤더**: 주문번호, 상태 배지, 액션 버튼
- **정보 섹션** (아코디언):
  - 고객 정보
  - 서비스 정보 (대분류, 중분류, 소분류 계층 및 추가 입력 필드 값 포함)
  - 일정 정보 (캘린터 연동)
  - 주소 정보 (지도 표시)
  - 결제 정보
- **액션 버튼**: 상태에 따라 동적 변경 (수락, 거절, 시작, 완료, 취소)

#### 3.3 주문 생성 (고객 전용 향후 개발)
- **서비스 선택**: 카테고리 → 항목 → 옵션 계층 선택
- **일정 선택**: 캘린더 + 시간 슬롯 선택
- **주소 입력**: 주소 검색 + 지도 핀 지정
- **결제 정보**: 예약금/잔금 분할 결제 선택

### 4. 일정 관리
#### 4.1 캘린더 뷰 (`CalendarView`)
- **Ant Design Mobile Calendar**: 월별/주별/일별 전환
- **일정 표시**: 주문별 색상 코딩, 시간 블록
- **터치 인터랙션**: 일정 탭하여 상세 보기, 드래그로 이동

#### 4.2 리스트 뷰 (`ScheduleList`)
- **그룹화**: 오늘, 내일, 이번 주, 다음 주
- **시간순 정렬**: 가장 가까운 일정부터 표시
- **상태 필터**: 예약, 확정, 진행중, 완료

#### 4.3 일정 생성/수정
- **서비스 선택**: 전문가가 제공하는 서비스 목록에서 선택
- **시간 선택**: 30분 단위 슬롯, 중복 예약 방지
- **반복 일정**: 주간/월간 반복 옵션
- **알림 설정**: 사전 알림 시간 설정 (30분, 1시간, 2시간 전)

### 5. 정산 관리
#### 5.1 정산 대시보드 (`SettlementDashboard`)
- **기간 선택**: 주간/월간/분기별/연간
- **요약 지표**:
  - 총 수익 (막대 그래프)
  - 플랫폼 수수료 (원 그래프)
  - 순수익 (증감률)
- **트렌드 차트**: `Recharts`로 수익 추이 라인 차트

#### 5.2 정산 상세 리스트 (`SettlementList`)
- **주문 단위 상세**: 주문별 수익, 수수료, 순수익
- **필터링**: 서비스 카테고리별, 결제 방법별
- **다운로드**: CSV, PDF 내보내기
- **인쇄 최적화**: 명세서 인쇄용 뷰

#### 5.3 정산 문의 (`SettlementInquiry`)
- **문의 작성**: 특정 정산 건에 대한 문의
- **첨부 파일**: 증빙 자료 업로드
- **문의 내역**: 과거 문의 및 답변 확인

### 6. 프로필 관리
#### 6.1 개인 정보 (`ProfileInfo`)
- **기본 정보**: 이름, 이메일, 전화번호 (인증 상태 표시)
- **프로필 사진**: 업로드, 크롭, 미리보기
- **비밀번호 변경**: 현재 비밀번호 확인 후 변경

#### 6.2 사업자 정보 (`BusinessInfo`)
- **사업자 등록증**: 이미지 업로드, OCR 인식 (선택)
- **서비스 지역**: 시/구 다중 선택 (지도 기반)
- **제공 서비스**: 3단계 서비스 계층 선택 (대분류→중분류→소분류) 및 멤버십 적용 가능 여부 표시
- **포트폴리오**: 작업 사진 업로드 및 관리

#### 6.3 정산 정보 (`SettlementInfo`)
- **계좌 정보**: 은행 선택, 계좌번호, 예금주명
- **세금 계산서**: 필요 시 발행 정보
- **정산 주기**: 주간/월간 선택

### 7. 팀 관리 (마스터 계정 전용)
#### 7.1 서브 계정 목록 (`SubAccountList`)
- **계정 상태**: 활성/정지/대기 중
- **권한 수준**: 주문 접근 범위, 정산 조회 권한
- **활동 로그**: 최근 로그인, 주문 처리 건수

#### 7.2 서브 계정 생성/수정
- **초대 메일**: 이메일 초대 발송
- **권한 설정**:
  - 주문 접근: 전체/지정 카테고리만/자기 할당만
  - 정산 조회: 전체/자기 정산만
  - 설정 변경: 제한/일부/전체
- **할당 일정**: 서브 계정별 근무 시간 설정

#### 7.3 팀 성과 분석 (`TeamAnalytics`)
- **개인별 지표**: 주문 처리 수, 평균 평점, 수익 기여도
- **팀 비교**: 기간별 팀 성장률, 효율성 지표
- **인센티브 계산**: 성과 기반 추가 수익 분배

### 8. 설정 (`Settings`)
#### 8.1 알림 설정
- **푸시 알림**: 주문, 정산, 시스템 알림 각각 설정
- **알림 채널**: SMS, 카카오톡, 앱 푸시 선택
- **방해 금지 시간**: 야간 시간대 알림 금지

#### 8.2 앱 설정
- **테마**: 라이트/다크 모드
- **언어**: 한국어/영어 (향후 확장)
- **캐시 관리**: 이미지 캐시, 데이터 캐시 초기화

#### 8.3 고객센터
- **FAQ**: 자주 묻는 질문 카테고리별
- **1:1 문의**: 문의 작성 및 답변 확인
- **공지사항**: 플랫폼 공지 리스트

---

## 기능 명세

### 1. 인증 및 권한
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 이메일/비밀번호 로그인 | JWT 토큰 기반 인증 | P0 |
| 자동 로그인 | 리프레시 토큰 활용 | P1 |
| 비밀번호 찾기 | 이메일/SMS 인증 코드 발송 | P0 |
| 로그아웃 | 토큰 무효화 및 캐시 정리 | P0 |
| 계정 전환 | 마스터/서브 계정 간 전환 | P1 |
| 권한 검증 | 라우트/컴포넌트 레벨 권한 체크 | P0 |

### 2. 주문 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 신규 주문 알림 | 실시간 푸시 알림 + 배지 | P0 |
| 주문 목록 조회 | 필터/검색/정렬/페이지네이션 | P0 |
| 주문 상세 조회 | 모든 주문 정보 + 지도 표시 | P0 |
| 주문 수락/거절 | 상태 변경 + 알림 전송 | P0 |
| 주문 상태 업데이트 | 진행중 → 완료 등 상태 변경 | P0 |
| 추가 비용 입력 | 서비스 카테고리에 매핑된 현장비용 항목 선택 및 금액 입력 (service_category_on_site_fee_mappings 기준) | P1 |
| 사진 업로드 | 작업 전후 사진 업로드 (최대 5장) | P0 |
| 주문 취소 | 취소 사유 입력 + 고객 알림 | P1 |
| 주문 메모 작성 | 내부 메모/고객 메모 구분 | P1 |

### 3. 일정 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 캘린더 뷰 | 월/주/일별 일정 시각화 | P0 |
| 일정 드래그 앤 드롭 | 일정 시간 변경 | P1 |
| 중복 일정 검사 | 같은 시간대 중복 예약 방지 | P0 |
| 일정 알림 | 사전 알림 (30분, 1시간, 2시간 전) | P1 |
| 휴일 설정 | 정기 휴일/개인 휴일 설정 | P2 |
| 일정 공유 | 일정을 마스터 계정과 공유 | P1 |

### 4. 정산 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 정산 요약 조회 | 기간별 수익, 수수료, 순수익 | P0 |
| 정산 상세 내역 | 주문별 상세 내역 조회 | P0 |
| 정산 명세서 다운로드 | PDF 형식으로 다운로드 | P0 |
| 정산 이의제기 | 특정 정산 건 문의 | P1 |
| 예상 정산 조회 | 진행중 주문 예상 정산 금액 | P1 |
| 세금 계산서 관리 | 발행 내역 조회 및 다운로드 | P2 |

### 5. 프로필 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 기본 정보 수정 | 이름, 연락처, 프로필 사진 | P0 |
| 사업자 정보 관리 | 사업자 등록증, 서비스 지역 | P0 |
| 서비스 카테고리 설정 | 3단계 서비스 계층 선택 (대분류→중분류→소분류) 및 멤버십 적용 가능 여부 설정 | P0 |
| 계좌 정보 관리 | 정산 받을 계좌 정보 | P0 |
| 포트폴리오 관리 | 작업 사진 업로드 및 정렬 | P1 |
| 평점/리뷰 조회 | 고객 리뷰 및 평점 확인 | P1 |

### 6. 팀 관리 (마스터 계정)
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 서브 계정 초대 | 이메일 초대 발송 | P0 |
| 서브 계정 권한 설정 | 세분화된 권한 부여 | P0 |
| 서브 계정 활동 모니터링 | 로그인, 주문 처리 현황 | P1 |
| 팀 성과 분석 | 개인별/팀별 성과 지표 | P1 |
| 수익 분배 설정 | 서브 계정별 수익 분배율 | P2 |
| 팀 공지사항 | 팀 내 공지 작성 및 발송 | P1 |

### 7. 알림 시스템
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 실시간 푸시 알림 | Socket.io 기반 실시간 전송 | P0 |
| 알림 히스토리 | 과거 알림 조회 및 필터링 | P0 |
| 알림 설정 | 유형별 알림 수신 여부 설정 | P0 |
| 알림 읽음 처리 | 개별/일괄 읽음 처리 | P0 |
| 중요 알림 강조 | 정산, 고객 문의 등 중요 알림 강조 | P1 |

### 8. 파일 관리
| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 이미지 업로드 | 작업 사진, 문서 스캔 업로드 | P0 |
| 이미지 압축 | 클라이언트 사이드 압축 | P1 |
| 파일 미리보기 | 이미지/PDF 미리보기 | P1 |
| 파일 삭제 | 업로드된 파일 삭제 | P0 |
| 저장소 정리 | 오래된 파일 자동 정리 | P2 |

### 9. 전문가 관리 (자기 관리)
|| 기능 | 설명 | 우선순위 |
||------|------|----------|
|| 멤버십 정보 조회 | 본인의 멤버십 구좌 수, 적용 중분류, 가중치 정보 확인 | P1 |
|| 배정 이력 조회 | 과거 배정 이력 필터링 및 상세 조회 (기간, 서비스 카테고리, 지역 기준) | P1 |
|| 패널티 상태 확인 | 현재 적용 중인 패널티 유형, 기간, 사유 확인 | P0 |
|| 일일 배정 상한 확인 | 일일 배정 상한 설정값 및 오늘 배정 건수 실시간 확인 | P1 |
|| 통계 대시보드 | 배정 건수, 응답 품질, 완료 품질 등 종합 성과 지표 확인 | P1 |
|| 변경 이력 조회 | 본인 정보 변경 이력 (승인, 멤버십, 패널티 등) 감사 로그 조회 | P1 |

---

## Ant Design 컴포넌트 매핑

### 레이아웃 컴포넌트
| 기능 | Ant Design Mobile 컴포넌트 | 커스텀 여부 |
|------|----------------------------|-------------|
| 하단 탭 바 | `TabBar` | 커스텀 아이콘 + 배지 |
| 상단 헤더 | `NavBar` | 뒤로가기 + 액션 버튼 |
| 사이드 메뉴 | `SideBar` | 햄버거 메뉴 슬라이드 |
| 콘텐츠 영역 | `Page` | 기본 레이아웃 |
| 풀다운 새로고침 | `PullToRefresh` | 커스텀 로딩 아이콘 |
| 무한 스크롤 | `InfiniteScroll` | 가상화 적용 |

### 폼 컴포넌트
| 기능 | Ant Design Mobile 컴포넌트 | 유효성 검사 |
|------|----------------------------|-------------|
| 텍스트 입력 | `Input` | 실시간 검증 + 에러 메시지 |
| 숫자 입력 | `Stepper` | 최소/최대값 제한 |
| 날짜 선택 | `DatePicker` | 범위 제한 (미래만 선택 등) |
| 시간 선택 | `TimePicker` | 30분 단위 슬롯 |
| 선택기 | `Picker` | 다중 컬럼 연동 (시/구) |
| 스위치 | `Switch` | Boolean 설정 |
| 체크박스 | `Checkbox` | 그룹 체크박스 |
| 라디오 버튼 | `Radio` | 단일 선택 |
| 업로더 | `ImageUploader` | 이미지 압축 + 미리보기 |

### 피드백 컴포넌트
| 기능 | Ant Design Mobile 컴포넌트 | 사용 시나리오 |
|------|----------------------------|---------------|
| 토스트 | `Toast` | 간단한 성공/실패 메시지 |
| 다이얼로그 | `Dialog` | 확인/취소가 필요한 액션 |
| 액션 시트 | `ActionSheet` | 여러 옵션 중 선택 |
| 로딩 표시기 | `Loading` | API 호출 중 표시 |
| 빈 상태 | `Empty` | 데이터 없을 때 표시 |
| 결과 페이지 | `Result` | 작업 완료 결과 표시 |

### 데이터 표시 컴포넌트
| 기능 | Ant Design Mobile 컴포넌트 | 커스텀 여부 |
|------|----------------------------|-------------|
| 리스트 | `List` | 스와이프 액션 + 풀다운 새로고침 |
| 카드 | `Card` | 주문 카드, 정산 카드 |
| 그리드 | `Grid` | 서비스 카테고리 표시 |
| 아코디언 | `Collapse` | 주문 상세 정보 |
| 태그 | `Tag` | 상태 표시 (신규, 진행중, 완료) |
| 배지 | `Badge` | 알림 개수 표시 |
| 진행률 | `Progress` | 주문 진행 상태 |

### 네비게이션 컴포넌트
| 기능 | Ant Design Mobile 컴포넌트 | 설명 |
|------|----------------------------|------|
| 탭 바 | `TabBar` | 메인 네비게이션 (5개 이하) |
| 세그먼트 | `Segmented` | 뷰 전환 (리스트/캘린더) |
| 스텝퍼 | `Steps` | 회원가입, 주문 생성 단계 |
| 페이지네이션 | `Pagination` | 데스크톱용, 모바일은 무한 스크롤 |

---

## 상태 관리

### 전역 상태 (Zustand)
```typescript
// store/auth.ts
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

// store/orders.ts
interface OrdersState {
  orders: Order[]
  filteredOrders: Order[]
  selectedOrder: Order | null
  filters: OrderFilters
  isLoading: boolean
  fetchOrders: (filters?: OrderFilters) => Promise<void>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  setFilters: (filters: OrderFilters) => void
}

// store/notifications.ts
interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  fetchNotifications: () => Promise<void>
}

// store/settings.ts
interface SettingsState {
  theme: 'light' | 'dark'
  language: 'ko' | 'en'
  notificationSettings: NotificationSettings
  updateTheme: (theme: 'light' | 'dark') => void
  updateNotificationSettings: (settings: NotificationSettings) => void
}
```

### 로컬 상태 (React Hooks)
- **폼 상태**: `useState` + `useEffect` (간단한 폼)
- **UI 상태**: 모달 열기/닫기, 로딩 상태, 에러 상태
- **컴포넌트 내 상태**: 드롭다운 열기, 선택된 항목, 정렬 기준

### 서버 상태 (React Query 고려)
- **캐싱**: 자동 캐싱 및 무효화
- **백그라운드 업데이트**: 포커스 시 데이터 재검증
- **낙관적 업데이트**: UI 즉시 반영 후 서버 동기화

---

## API 연동

### Axios 인스턴스 설정
```typescript
// api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터 (토큰 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 응답 인터셉터 (토큰 갱신)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await apiClient.post('/auth/refresh', { refreshToken })
        const { access_token } = response.data
        localStorage.setItem('access_token', access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // 리프레시 토큰도 만료 → 로그아웃
        store.getState().auth.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
```

### API 서비스 모듈

**3계층 서비스 카탈로그 통합**: 전문가 웹앱은 백엔드의 3계층 서비스 구조(대분류→중분류→소분류)와 완전히 통합됩니다. 아래 API 모듈은 서비스 카탈로그 조회 및 전문가 서비스 매핑 관리를 제공합니다.

```typescript
// TypeScript 인터페이스는 백엔드 TypeBox 스키마(specs/03_BACKEND_API_SPEC.md)에서 파생됩니다.
// ServiceCategory, ServiceSubcategory, ServiceItem, ServiceItemPrice 등
// api/auth.ts
export const authApi = {
  login: (credentials: LoginRequest) => 
    apiClient.post<LoginResponse>('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  register: (data: RegisterRequest) => 
    apiClient.post<RegisterResponse>('/auth/register', data),
  // ...
}

// api/services.ts
export const servicesApi = {
  // 3계층 서비스 카탈로그 API (대분류 → 중분류 → 소분류)
  getCategories: () => apiClient.get<ServiceCategory[]>('/services/categories'),
  getSubcategories: (categoryId: string) =>
    apiClient.get<ServiceSubcategory[]>(`/services/categories/${categoryId}/subcategories`),
  getItems: (subcategoryId: string) =>
    apiClient.get<ServiceItem[]>(`/services/subcategories/${subcategoryId}/items`),
  getItemPrices: (itemId: string) =>
    apiClient.get<ServiceItemPrice[]>(`/services/items/${itemId}/prices`),
  getItemOnSiteFees: (itemId: string) =>
    apiClient.get<OnSiteFeeCategory[]>(`/services/items/${itemId}/on-site-fees`),
  getItemExtraFields: (itemId: string) =>
    apiClient.get<ServiceExtraField[]>(`/services/items/${itemId}/extra-fields`),
  // ...
}

// api/orders.ts
export const ordersApi = {
  getOrders: (params?: GetOrdersParams) =>
    apiClient.get<PaginatedResponse<Order[]>>('/orders', { params }),
  getOrder: (orderId: string) =>
    apiClient.get<Order>(`/orders/${orderId}`),
  acceptOrder: (orderId: string) =>
    apiClient.post(`/orders/${orderId}/accept`),
  // ...
}

// api/experts.ts
export const expertsApi = {
  getProfile: () => apiClient.get<Expert>('/experts/me'),
  updateProfile: (data: UpdateExpertRequest) =>
    apiClient.put<Expert>('/experts/me', data),
  getSubAccounts: () =>
    apiClient.get<SubAccount[]>('/experts/me/sub-accounts'),
  // 서비스 매핑 관리 (3계층 서비스 카탈로그 기반)
  getServiceMappings: () => apiClient.get<ExpertServiceMapping[]>('/experts/me/services'),
  addServiceMapping: (data: AddServiceMappingRequest) =>
    apiClient.post<ExpertServiceMapping>('/experts/me/services', data),
  updateServiceMapping: (mappingId: string, data: UpdateServiceMappingRequest) =>
    apiClient.put<ExpertServiceMapping>(`/experts/me/services/${mappingId}`, data),
  deleteServiceMapping: (mappingId: string) =>
    apiClient.delete(`/experts/me/services/${mappingId}`),
  // 전문가 관리 (자기 관리) API
  getMembershipInfo: () => apiClient.get<MembershipInfo>('/experts/me/membership'),
  getAssignmentHistory: (params?: AssignmentHistoryParams) =>
    apiClient.get<PaginatedResponse<AssignmentHistory[]>>('/experts/me/assignment-history', { params }),
  getPenaltyStatus: () => apiClient.get<PenaltyStatus>('/experts/me/penalties'),
  getDailyAssignmentLimit: () => apiClient.get<DailyLimitInfo>('/experts/me/daily-assignment-limit'),
  getStatistics: (params?: StatisticsParams) =>
    apiClient.get<ExpertStatistics>('/experts/me/statistics', { params }),
  getAuditLogs: (params?: AuditLogParams) =>
    apiClient.get<PaginatedResponse<AuditLog[]>>('/experts/me/audit-logs', { params }),
}
```

### 실시간 통신 (Socket.io)
```typescript
// socket/client.ts
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  auth: {
    token: localStorage.getItem('access_token')
  }
})

// 이벤트 리스너
socket.on('connect', () => {
  console.log('Socket connected')
})

socket.on('new_order', (order: Order) => {
  // 새 주문 알림
  store.getState().notifications.addNotification({
    id: `order_${order.id}`,
    type: 'order',
    title: '새 주문이 도착했습니다',
    message: `${order.serviceItem.name} 서비스 요청`,
    data: { orderId: order.id },
    isRead: false,
    createdAt: new Date().toISOString()
  })
  
  // 주문 목록 업데이트
  store.getState().orders.fetchOrders()
})

socket.on('order_status_changed', ({ orderId, status }) => {
  // 주문 상태 변경 업데이트
  store.getState().orders.updateOrderStatus(orderId, status)
})
```

---

## 성능 최적화

### 1. 번들 최적화 (Vite)
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd': ['antd-mobile', '@ant-design/icons'],
          'charts': ['recharts'],
          'maps': ['react-naver-maps']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### 2. 코드 스플리팅
- **라우트 기반 코드 스플리팅**: `React.lazy()` + `Suspense`
- **컴포넌트 지연 로딩**: 모달, 차트 등 무거운 컴포넌트
- **이미지 레이지 로딩**: `IntersectionObserver` 활용

### 3. 이미지 최적화
- **WebP 형식 지원**: JPEG/PNG 대체
- **이미지 CDN**: Cloudflare Images 또는 imgix
- **반응형 이미지**: `srcset`으로 디바이스별 크기 제공
- **블러 플레이스홀더**: LQIP (Low Quality Image Placeholder)

### 4. 메모이제이션
```typescript
// React.memo for expensive components
const OrderCard = React.memo(({ order }: OrderCardProps) => {
  // ...
})

// useMemo for expensive calculations
const filteredOrders = useMemo(() => {
  return orders.filter(order => order.status === filterStatus)
}, [orders, filterStatus])

// useCallback for event handlers
const handleAcceptOrder = useCallback((orderId: string) => {
  // ...
}, [])
```

### 5. 가상화
- **리스트 가상화**: `react-virtualized` 또는 `react-window`
- **대규모 데이터**: 무한 스크롤 + 페이지네이션 혼합

### 6. 오프라인 지원
- **Service Worker**: PWA 설치 가능
- **캐싱 전략**: Network First for API, Cache First for static assets
- **오프라인 큐**: 네트워크 복구 후 자동 동기화

---

## 테스트 전략

### 1. 단위 테스트 (Jest + Testing Library)
```typescript
// 컴포넌트 테스트
test('OrderCard displays correct information', () => {
  const order = mockOrder
  render(<OrderCard order={order} />)
  
  expect(screen.getByText(order.orderNumber)).toBeInTheDocument()
  expect(screen.getByText(order.customer.name)).toBeInTheDocument()
})

// 훅 테스트
test('useOrders hook fetches orders', async () => {
  const { result } = renderHook(() => useOrders())
  
  await waitFor(() => {
    expect(result.current.orders).toHaveLength(3)
    expect(result.current.isLoading).toBe(false)
  })
})
```

### 2. 통합 테스트
- **사용자 흐름**: 로그인 → 주문 수락 → 서비스 완료
- **API 모킹**: MSW (Mock Service Worker)로 실제 API 모킹
- **상태 관리**: Zustand store 업데이트 검증

### 3. E2E 테스트 (Playwright)
```typescript
// 전문가 주문 수락 시나리오
test('expert can accept a new order', async ({ page }) => {
  // 로그인
  await page.goto('/login')
  await page.fill('input[type="email"]', 'expert@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // 새 주문 알림 클릭
  await page.click('.notification-badge')
  
  // 주문 수락
  await page.click('button:has-text("수락")')
  
  // 확인 대화상자
  await page.click('button:has-text("확인")')
  
  // 성공 메시지 확인
  await expect(page.locator('.toast-success')).toBeVisible()
})
```

### 4. 성능 테스트
- **Lighthouse**: PWA, 접근성, 성능 점수
- **Core Web Vitals**: LCP, FID, CLS 측정
- **번들 분석**: `rollup-plugin-visualizer`로 번들 크기 분석

### 5. 접근성 테스트
- **WCAG 2.1 AA 준수**: 색상 대비, 키보드 네비게이션, 스크린 리더
- **axe-core**: 자동화된 접근성 검사

---

**다음 단계**: 이 스펙을 바탕으로 Phase 3 전문가 웹앱 구현 시작 (3-4주 예상, 백엔드 API 완료 후)