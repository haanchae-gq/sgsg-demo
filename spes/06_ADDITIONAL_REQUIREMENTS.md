# 쓱싹 홈케어 플랫폼 - 추가 요구사항 (PDF 반영)

**문서 버전**: 2.1  
**작성일**: 2026-01-14  
**우선순위**: P0 (최우선)  
**출처**: 운영팀 PDF 문서 (251212~260102)

---

## 📋 목차

1. [주요 추가 요구사항 요약](#주요-추가-요구사항-요약)
2. [마스터/서브 계정 구조](#마스터서브-계정-구조)
3. [채팅 기능](#채팅-기능)
4. [상세 서비스 카테고리](#상세-서비스-카테고리)
5. [가격표 시스템](#가격표-시스템)
6. [백오피스 추가 기능](#백오피스-추가-기능)
7. [소비자 웹 요구사항](#소비자-웹-요구사항)

---

## 주요 추가 요구사항 요약

### PDF 문서에서 발견된 핵심 변경사항

1. **전문가 계정 구조 변경**
   - 마스터 계정 (사업체 대표)
   - 서브 계정 (팀원) - 1:N 구조
   - 내부 배정 시스템

2. **채팅 기능 추가**
   - 전문가 ↔ 고객 1:1 채팅
   - 실시간 메시지
   - 이미지/파일 첨부
   - 마스터/서브 계정 간 채팅 내역 공유

3. **상세 서비스 카테고리**
   - 3단계 구조: 대분류 → 중분류 → 상세분류
   - 24개 이상의 상세 서비스
   - 서비스별 상세 옵션 (평형, 브랜드, 타입 등)

4. **가격표 시스템**
   - 기본 비용 + 현장 비용 구조
   - 서비스별 상세 단가표
   - 가격 스냅샷 (과거 거래 영향 없음)

5. **백오피스 추가 기능**
   - 전문가 역할/지역 상세 관리
   - 서비스 금액 스냅샷 관리
   - 하위 카테고리 관리
   - 정산 상태 관리
   - 대시보드/리포트 상세 항목

6. **소비자 웹 요구사항**
   - 서비스 탐색 및 신청 폼
   - 스토어 연동 (쇼핑몰)
   - 전문가 지원 페이지
   - GA4, 메타 픽셀 연동

---

## 마스터/서브 계정 구조

### 1. 계정 유형

#### 마스터 계정 (Master Account)
```yaml
설명: 전문가 사업체 대표 또는 개인 전문가
사업자 단위: 1개
주요 권한:
  - 팀(서브계정) 등록/관리
  - 모든 주문/정산 데이터 접근
  - 리드 수락/거절/팀배정 가능
  - 사업자 정보 수정
  - 팀원별 배정/처리 현황 확인
```

#### 서브 계정 (Sub Account)
```yaml
설명: 마스터 계정의 하위 팀원 계정
구조: 1개 마스터 아래 다수 등록 가능 (1:N)
주요 권한:
  - 마스터로부터 배정된 리드/일정 처리
  - 서비스 진행/결제/사진업로드
  - 정산 조회 불가
  - 사업자 정보 수정 불가
```

### 2. 데이터베이스 스키마 추가

#### expert_teams (전문가 팀 관리)
```sql
CREATE TABLE expert_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_expert_id UUID NOT NULL REFERENCES experts(id),
    sub_expert_id UUID NOT NULL REFERENCES experts(id),
    role VARCHAR(50) DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(master_expert_id, sub_expert_id)
);

CREATE INDEX idx_expert_teams_master ON expert_teams(master_expert_id);
CREATE INDEX idx_expert_teams_sub ON expert_teams(sub_expert_id);

COMMENT ON TABLE expert_teams IS '전문가 팀 구조 (마스터-서브 관계)';
```

#### experts 테이블 수정
```sql
ALTER TABLE experts ADD COLUMN account_type VARCHAR(20) DEFAULT 'master' 
    CHECK (account_type IN ('master', 'sub'));
ALTER TABLE experts ADD COLUMN master_expert_id UUID REFERENCES experts(id);

COMMENT ON COLUMN experts.account_type IS '계정 유형: master(대표), sub(팀원)';
COMMENT ON COLUMN experts.master_expert_id IS '소속 마스터 계정 ID (서브 계정인 경우)';
```

### 3. 권한 매트릭스

| 기능 | 마스터 | 서브 |
|------|--------|------|
| 로그인/인증 | ✓ | ✓ |
| 리드 조회 | 전체 | 배정된 것만 |
| 리드 수락/거절 | ✓ | ✗ |
| 내부 배정 | ✓ | ✗ |
| 일정 보기/수정 | 전체 | 배정된 것만 |
| 서비스 시작/완료 | ✓ | ✓ |
| 추가금 입력 | ✓ | ✓ |
| 결제수단 요청 | ✓ | ✓ |
| 거래/정산 조회 | ✓ | ✗ |
| 프로필/사업자 정보 | ✓ | ✗ |
| 팀원 관리 | ✓ | ✗ |
| 채팅 | ✓ | ✓ |

### 4. 내부 배정 플로우

```
신규 주문 생성
   ↓
시스템 자동 배정 → 마스터 계정
   ↓
마스터 수락
   ↓
[옵션 1] 마스터가 직접 처리
[옵션 2] 서브 계정에게 내부 배정
   ↓
서브 계정이 상담/일정/서비스 진행
   ↓
완료 후 정산은 마스터 계정으로
```

---

## 채팅 기능

### 1. 채팅 시스템 개요

**목적**: 전문가와 고객 간 실시간 상담 채널 제공

**주요 기능**:
- 전문가 ↔ 고객 1:1 채팅
- 텍스트 메시지
- 이미지/파일 첨부 (최대 10MB)
- 읽음/안읽음 표시
- 푸시 알림
- 마스터/서브 계정 간 채팅 내역 공유

### 2. 데이터베이스 스키마

#### chat_rooms (채팅방)
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    expert_id UUID NOT NULL REFERENCES experts(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_rooms_order_id ON chat_rooms(order_id);
CREATE INDEX idx_chat_rooms_customer_id ON chat_rooms(customer_id);
CREATE INDEX idx_chat_rooms_expert_id ON chat_rooms(expert_id);
CREATE INDEX idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);

COMMENT ON TABLE chat_rooms IS '주문별 채팅방 (1주문 = 1채팅방)';
```

#### chat_messages (채팅 메시지)
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'expert')),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_is_read ON chat_messages(room_id, is_read);

COMMENT ON TABLE chat_messages IS '채팅 메시지';
COMMENT ON COLUMN chat_messages.message_type IS '메시지 유형: text(텍스트), image(이미지), file(파일)';
```

### 3. API 엔드포인트

```http
# 채팅방 목록 조회
GET /api/v1/chat/rooms

# 채팅방 생성 (주문 기반)
POST /api/v1/chat/rooms
{
  "order_id": "uuid"
}

# 채팅 메시지 목록 조회
GET /api/v1/chat/rooms/:roomId/messages?page=1&limit=50

# 메시지 전송
POST /api/v1/chat/rooms/:roomId/messages
{
  "message_type": "text",
  "content": "안녕하세요"
}

# 이미지/파일 전송
POST /api/v1/chat/rooms/:roomId/messages
{
  "message_type": "image",
  "file": <multipart/form-data>
}

# 메시지 읽음 처리
PUT /api/v1/chat/messages/:messageId/read

# 실시간 연결 (Socket.io)
socket.on('chat:message', (data) => { ... })
socket.emit('chat:send', { roomId, message })
```

---

## 상세 서비스 카테고리

### 1. 서비스 카테고리 구조 (3단계)

```
대분류 (service_categories)
  ├─ 중분류 (service_sub_categories)
  │   └─ 상세분류 (service_items)
  └─ 옵션 (service_item_options)
```

### 2. 데이터베이스 스키마 추가

#### service_sub_categories (서비스 중분류)
```sql
CREATE TABLE service_sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES service_categories(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

CREATE INDEX idx_service_sub_categories_category_id ON service_sub_categories(category_id);
CREATE INDEX idx_service_sub_categories_slug ON service_sub_categories(slug);

COMMENT ON TABLE service_sub_categories IS '서비스 중분류 (예: 에어컨, 세탁기)';
```

#### service_item_options (서비스 옵션)
```sql
CREATE TABLE service_item_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_item_id UUID NOT NULL REFERENCES service_items(id) ON DELETE CASCADE,
    option_type VARCHAR(50) NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_item_options_service_id ON service_item_options(service_item_id);
CREATE INDEX idx_service_item_options_type ON service_item_options(option_type);

COMMENT ON TABLE service_item_options IS '서비스 옵션 (예: 평형, 브랜드, 타입)';
COMMENT ON COLUMN service_item_options.option_type IS '옵션 유형 (예: size, brand, type)';
COMMENT ON COLUMN service_item_options.price_modifier IS '가격 조정 금액 (+ 또는 -)';
```

### 3. 서비스 카테고리 전체 목록

#### A. 설치/시공 (10개 중분류)
1. **에어컨** - 신품설치, 보유제품설치, 이전설치
2. **시스템 에어컨** - 신품설치, 보유제품설치, 이전설치
3. **벽걸이 TV** - 보유제품설치, 이전설치
4. **보일러/온수기** - 보일러 신품설치, 온수기 신품설치
5. **도어락** - 신품설치, 보유제품설치, 이전설치
6. **주방후드** - 신품설치, 보유제품설치
7. **전기/조명** - 콘센트/스위치, 조명, 누전차단기
8. **수도** - 수전 교체, 팝업/배수관 교체
9. **미끄럼방지 시공** - 논슬립식각, UV 세라믹 볼 코팅
10. **방충망 교체 시공** - 8가지 재질 옵션

#### B. 클리닝 (7개 중분류)
1. **에어컨** - 벽걸이, 스탠드, 업소용, 2in1, 1/2way, 4way
2. **세탁기** - 통돌이, 드럼, 빌트인, 트윈워시, 아기사랑, 꼬망스
3. **냉장고** - 일반냉장고, 김치냉장고
4. **매트리스** - 건식/습식, 사이즈별
5. **소파/카펫** - 건식/습식, 사이즈별
6. **유리창** - 건물 종류별
7. **입주/이사청소** - 평수별, 구조별

#### C. 막힘해결 (4개 중분류)
1. **변기** - 기본 막힘해결
2. **싱크대** - 기본 막힘해결
3. **하수구** - 대수별
4. **세면대** - 기본 막힘해결

---

## 가격표 시스템

### 1. 가격 구조

```
총 비용 = 기본 비용 + 현장 비용 - 할인 금액
```

- **기본 비용**: 서비스 기본 패키지 비용
- **현장 비용**: 현장에서 추가 발생하는 비용 (자재, 작업, 특이상황)
- **할인 금액**: 쿠폰, 프로모션 할인

### 2. 가격 스냅샷 시스템

**목적**: 가격 변동 시 과거 거래에 영향을 주지 않음

#### price_snapshots (가격 스냅샷)
```sql
CREATE TABLE price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_item_id UUID NOT NULL REFERENCES service_items(id),
    snapshot_date DATE NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    onsite_costs JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_snapshots_service_id ON price_snapshots(service_item_id);
CREATE INDEX idx_price_snapshots_date ON price_snapshots(snapshot_date DESC);
CREATE INDEX idx_price_snapshots_active ON price_snapshots(is_active);

COMMENT ON TABLE price_snapshots IS '서비스 가격 스냅샷 (과거 거래 보호)';
COMMENT ON COLUMN price_snapshots.onsite_costs IS '현장 비용 항목 JSON 배열';
```

### 3. 현장 비용 템플릿

#### onsite_cost_templates (현장 비용 템플릿)
```sql
CREATE TABLE onsite_cost_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_item_id UUID NOT NULL REFERENCES service_items(id),
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    is_negotiable BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onsite_cost_templates_service_id ON onsite_cost_templates(service_item_id);
CREATE INDEX idx_onsite_cost_templates_category ON onsite_cost_templates(category);

COMMENT ON TABLE onsite_cost_templates IS '현장 비용 템플릿';
COMMENT ON COLUMN onsite_cost_templates.category IS '비용 카테고리 (예: 배관자재, 타공, 철거)';
COMMENT ON COLUMN onsite_cost_templates.is_negotiable IS '협의 가능 여부';
```

### 4. 예시: 에어컨 설치 가격표

#### 기본 비용
```json
{
  "service_name": "에어컨 보유제품 설치",
  "base_prices": [
    { "type": "벽걸이형(냉방) 6~10평형", "price": 69000 },
    { "type": "벽걸이형(냉방) 11~17평", "price": 79000 },
    { "type": "벽걸이형(냉난방) 7~9평", "price": 69000 },
    { "type": "벽걸이형(냉난방) 10~11평", "price": 75000 },
    { "type": "벽걸이형(냉난방) 12~16평", "price": 79000 },
    { "type": "스탠드형 12~14평", "price": 109000 },
    { "type": "스탠드형 15~17평", "price": 129000 },
    { "type": "스탠드형 18평이상", "price": 129000 }
  ]
}
```

#### 현장 비용
```json
{
  "onsite_costs": [
    {
      "category": "배관자재",
      "items": [
        { "name": "동배관(10평 이하)", "unit_price": 18000, "unit": "m" },
        { "name": "동배관(30평 이하)", "unit_price": 21000, "unit": "m" },
        { "name": "알루미늄배관(10평 이하)", "unit_price": 17000, "unit": "m" }
      ]
    },
    {
      "category": "배관작업",
      "items": [
        { "name": "매립 배관 청소", "unit_price": 50000, "unit": "회" },
        { "name": "배관 용접", "unit_price": 20000, "unit": "회" },
        { "name": "전기작업", "unit_price": 12000, "unit": "회" }
      ]
    },
    {
      "category": "타공",
      "items": [
        { "name": "일반타공", "unit_price": 20000, "unit": "회" },
        { "name": "난타공", "unit_price": null, "is_negotiable": true }
      ]
    }
  ]
}
```

---

## 백오피스 추가 기능

### 1. 전문가 관리 상세

#### 전문가 역할/지역 관리
```
전문가 상세 화면
├─ 기본 정보
├─ 사업자 정보
├─ 서비스 카테고리 (다중 선택)
├─ 서비스 지역 (다중 선택)
├─ 팀원 관리 (마스터 계정인 경우)
│   ├─ 팀원 목록
│   ├─ 팀원 추가/삭제
│   └─ 팀원 권한 설정
├─ 평점 및 리뷰
└─ 활성/비활성 상태
```

### 2. 서비스 금액 관리

#### 가격 스냅샷 관리
```
서비스 금액 관리
├─ 현재 가격 조회
├─ 가격 수정
│   ├─ 기본 비용 수정
│   ├─ 현장 비용 템플릿 수정
│   └─ 스냅샷 생성 (과거 거래 보호)
├─ 가격 이력 조회
└─ 가격 비교 (이전 vs 현재)
```

### 3. 카테고리 관리

#### 3단계 카테고리 관리
```
카테고리 관리
├─ 대분류 관리
│   ├─ 추가/수정/삭제
│   └─ 순서 변경
├─ 중분류 관리
│   ├─ 추가/수정/삭제
│   ├─ 대분류 연결
│   └─ 순서 변경
└─ 상세분류 (서비스 항목)
    ├─ 추가/수정/삭제
    ├─ 중분류 연결
    ├─ 가격 설정
    └─ 옵션 관리
```

### 4. 정산 관리 상세

#### 정산 상태 관리
```sql
-- 정산 상태 추가
ALTER TABLE settlements ADD COLUMN processing_status VARCHAR(20) 
    DEFAULT 'pending' CHECK (processing_status IN (
        'pending',      -- 대기
        'processing',   -- 처리중
        'approved',     -- 승인
        'paid',         -- 지급완료
        'cancelled'     -- 취소
    ));

COMMENT ON COLUMN settlements.processing_status IS '정산 처리 상태';
```

#### 정산 승인 플로우
```
주간 정산 생성 (자동)
   ↓
정산 내역 검토 (관리자)
   ↓
정산 승인 (관리자)
   ↓
지급 처리 (관리자)
   ↓
지급 완료 알림 (전문가)
```

### 5. 대시보드 항목

#### 주요 지표
```yaml
실시간 통계:
  - 오늘 신규 주문 수
  - 진행 중인 주문 수
  - 오늘 완료된 주문 수
  - 오늘 매출액

사용자 통계:
  - 총 고객 수
  - 총 전문가 수 (활성/비활성)
  - 신규 가입 (일/주/월)

주문 통계:
  - 상태별 주문 수 (신규, 진행중, 완료, 취소)
  - 평균 주문 금액
  - 완료율

정산 통계:
  - 이번 주 정산 대기 건수
  - 이번 주 정산 금액
  - 승인 대기 건수
```

### 6. 리포트 양식

#### 주문 리포트 (Excel/PDF)
```yaml
항목:
  - 주문번호
  - 주문일시
  - 고객명
  - 전문가명
  - 서비스명
  - 서비스 카테고리
  - 주소 (시/구)
  - 상태
  - 기본 비용
  - 현장 비용
  - 총 금액
  - 예약금
  - 잔금
  - 결제 상태
  - 완료일시

필터:
  - 기간 (시작일 ~ 종료일)
  - 상태
  - 서비스 카테고리
  - 전문가
  - 지역
```

#### 정산 리포트 (Excel/PDF)
```yaml
항목:
  - 정산번호
  - 정산 기간
  - 전문가명
  - 사업자번호
  - 총 주문 수
  - 총 매출
  - 플랫폼 수수료 (15%)
  - 결제 수수료 (2.5%)
  - 세금 (10%)
  - 순수익
  - 정산 상태
  - 지급일

필터:
  - 정산 기간
  - 전문가
  - 정산 상태
```

---

## 소비자 웹 요구사항

### 1. 페이지 구조

#### 헤더
```
┌─────────────────────────────────────────────────────────────┐
│  [로고]  홈 | 서비스 | 스토어 | 전문가 지원 | 고객센터  [로그인] │
└─────────────────────────────────────────────────────────────┘
```

#### 푸터
```
┌─────────────────────────────────────────────────────────────┐
│  좌측:                                                       │
│  - 이용약관 | 제휴신청 | About쓱싹 | 쓱싹 블로그            │
│  - 제휴/입점 문의: go@sgsgcare.com                          │
│  - (주)쓱싹                                                  │
│  - 대표: 이주열 | 통신판매번호: 2025-서울금천-0166           │
│  - 사업자등록번호: 852-86-02742                              │
│  - 서울특별시 금천구 가산동 371-6 가산비즈니스센터          │
│                                                             │
│  우측:                                                       │
│  - 카카오 고객센터                                           │
│  - 월-금 10:00~17:00 (점심 12:30~13:30)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. 주요 페이지

#### 홈 (메인)
- Hero Banner: "양심가격, 안심케어"
- 서비스 대분류 카테고리 (3개)
- 쓱싹 인기 서비스 (탭별 중분류)
- 쓱싹만의 안심 보장 서비스
- 정직한 쓱싹의 리얼한 리뷰
- 정직과 실력 쓱싹 전문가들 (유튜브 영상)

#### 서비스 목록
- Hero Banner (이벤트 배너)
- 서비스 카테고리 네비게이션
- 서비스 리스트 (카드형)

#### 서비스 상세
- Hero Banner
- 서비스 안내
- 시공 후기/사진
- 가격 비교
- 서비스 과정 안내
- 서비스 신청 및 예약 안내
- 서비스 신청 CTA
- 자주 묻는 질문

#### 전문가 지원
- Hero Banner
- 쓱싹 전문가가 되는 이유 (혜택)
- 쓱싹 전문가가 되는 방법
- 쓱싹 전문가 후기
- 서비스 방식
- 전문가 지원하기 CTA
- 자주 묻는 질문

### 3. 서비스 신청 폼 로직

#### 공통 접수 모듈
```
주소 입력
   ↓
무료 주차장 유무 (있음/없음)
   ↓
그 외 남김 말 입력
   ↓
서비스 신청 완료
```

#### 이전 설치 접수 모듈
```
철거 주소 입력
   ↓
설치 주소 입력
   ↓
무료 주차장 유무 (있음/없음)
   ↓
그 외 남김 말 입력
   ↓
서비스 신청 완료
```

#### 스토어 연동 접수 모듈
```
상품 선택 (스토어)
   ↓
주소 입력
   ↓
서비스 신청 완료
```

### 4. 외부 서비스 연동

```yaml
트래킹 & 분석:
  - Google Analytics 4 (GA4)
  - Meta Pixel (페이스북 광고)
  - Naver Pixel (네이버 광고)
  - UTM 파라미터 추적

상담/문의:
  - 채널톡 (실시간 상담)
  - 카카오 고객센터

결제:
  - Toss Payments (간편결제, 카드, 가상계좌)
```

---

## 다음 단계

### 즉시 반영 필요
1. **데이터베이스 스키마 업데이트**
   - expert_teams 테이블 추가
   - chat_rooms, chat_messages 테이블 추가
   - service_sub_categories 테이블 추가
   - service_item_options 테이블 추가
   - price_snapshots 테이블 추가
   - onsite_cost_templates 테이블 추가

2. **API 엔드포인트 추가**
   - 팀원 관리 API
   - 채팅 API
   - 가격 스냅샷 API
   - 상세 카테고리 API

3. **전문가 웹앱 기능 추가**
   - 마스터/서브 계정 로그인 분기
   - 내부 배정 기능
   - 채팅 기능
   - 팀원 관리 화면

4. **백오피스 기능 추가**
   - 전문가 팀 관리
   - 3단계 카테고리 관리
   - 가격 스냅샷 관리
   - 상세 대시보드/리포트

5. **소비자 웹 개발 계획 수립**
   - 페이지 구조 설계
   - 서비스 신청 폼 로직
   - 외부 서비스 연동

---

**작성일**: 2026-01-14  
**버전**: 2.1  
**상태**: 추가 요구사항 분석 완료
