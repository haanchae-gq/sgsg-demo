# 전문가 웹앱 모바일 디자인 가이드

**문서 버전**: 1.0  
**작성일**: 2026-01-18  
**우선순위**: P1 (높음)  
**UI 프레임워크**: Ant Design 6.2.0 (모바일 최적화)

---

## 📋 목차

1. [개요](#개요)
2. [모바일 디자인 원칙](#모바일-디자인-원칙)
3. [레이아웃 시스템](#레이아웃-시스템)
4. [컴포넌트 가이드](#컴포넌트-가이드)
5. [네비게이션 패턴](#네비게이션-패턴)
6. [인터랙션 가이드](#인터랙션-가이드)
7. [반응형 전략](#반응형-전략)

---

## 개요

### 목적

전문가 웹앱은 **모바일 우선(Mobile-First)** 접근 방식으로 설계되며, 전문가들이 현장에서 스마트폰으로 주문을 관리하고 고객과 소통할 수 있도록 최적화됩니다.

### 대상 디바이스

- **주요 타겟**: 스마트폰 (320px - 767px)
- **보조 타겟**: 태블릿 (768px - 1023px)
- **선택 지원**: 데스크톱 (1024px+)

### 백오피스와의 차이점

| 구분 | 백오피스 | 전문가 웹앱 |
|------|---------|------------|
| 주요 디바이스 | 데스크톱 | 모바일 |
| 레이아웃 | 사이드바 + 메인 | 상단 헤더 + 하단 네비게이션 |
| 네비게이션 | 좌측 사이드바 | 하단 탭 바 + 햄버거 메뉴 |
| 테이블 | 풀 테이블 | 카드 리스트 |
| 폼 | 다단 레이아웃 | 단일 컬럼 |
| 모달 | Modal | Drawer (모바일), Modal (데스크톱) |

---

## 모바일 디자인 원칙

### 1. 터치 친화적 (Touch-Friendly)

#### 최소 터치 영역
```css
/* 최소 터치 영역: 44x44px (Apple HIG 기준) */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}
```

#### 버튼 크기
```tsx
// 주요 액션 버튼
<Button type="primary" size="large" block style={{ height: 48 }}>
  확인
</Button>

// 보조 버튼
<Button type="default" size="middle" style={{ height: 40 }}>
  취소
</Button>

// 작은 버튼
<Button type="text" size="small" style={{ height: 32 }}>
  더보기
</Button>
```

#### 간격
```css
/* 터치 영역 간 최소 간격: 8px */
.touch-spacing {
  gap: 8px;
}

/* 권장 간격: 12-16px */
.recommended-spacing {
  gap: 16px;
}
```

### 2. 단순성 (Simplicity)

#### 한 화면 한 작업
- 각 화면은 하나의 주요 작업에 집중
- 불필요한 정보 최소화
- 명확한 시각적 계층 구조

#### 정보 우선순위
1. **Primary**: 주요 정보 (큰 글씨, 강조 색상)
2. **Secondary**: 보조 정보 (중간 글씨, 회색)
3. **Tertiary**: 부가 정보 (작은 글씨, 연한 회색)

```tsx
<Space direction="vertical" size="small">
  {/* Primary */}
  <Title level={4}>에어컨 설치</Title>
  
  {/* Secondary */}
  <Text type="secondary">김철수 고객</Text>
  
  {/* Tertiary */}
  <Text type="secondary" style={{ fontSize: 12 }}>
    2026-01-20 14:00
  </Text>
</Space>
```

### 3. 가독성 (Readability)

#### 폰트 크기
```css
/* 모바일 최적화 폰트 크기 */
--text-h1: 24px;  /* 페이지 타이틀 */
--text-h2: 20px;  /* 섹션 타이틀 */
--text-h3: 18px;  /* 카드 타이틀 */
--text-h4: 16px;  /* 서브 타이틀 */
--text-base: 14px;  /* 본문 */
--text-sm: 12px;  /* 보조 텍스트 */
--text-xs: 11px;  /* 라벨 */
```

#### 줄 간격
```css
/* 가독성을 위한 줄 간격 */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

#### 대비
```css
/* WCAG AA 기준 준수 */
--text-primary: #262626;  /* 배경 대비 4.5:1 이상 */
--text-secondary: #595959;  /* 배경 대비 3:1 이상 */
```

### 4. 성능 (Performance)

#### 이미지 최적화
- WebP 포맷 사용
- 적절한 해상도 (2x 레티나 대응)
- Lazy Loading 적용

#### 애니메이션
```css
/* 부드러운 애니메이션 (60fps) */
.smooth-animation {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 하드웨어 가속 */
.hardware-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

---

## 레이아웃 시스템

### 화면 구조

```
┌─────────────────────────┐
│   Header (56px)         │  ← 고정 헤더
├─────────────────────────┤
│                         │
│   Main Content          │  ← 스크롤 가능
│   (padding: 16px)       │
│                         │
├─────────────────────────┤
│   Bottom Nav (60px)     │  ← 고정 하단 네비게이션
└─────────────────────────┘
```

### 헤더 (Header)

```tsx
<Header
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '0 16px',
  }}
>
  {/* 좌측: 햄버거 메뉴 또는 뒤로가기 */}
  <MenuOutlined style={{ fontSize: 20 }} />
  
  {/* 중앙: 로고 또는 페이지 타이틀 */}
  <Title level={5} style={{ margin: 0 }}>주문 관리</Title>
  
  {/* 우측: 알림 또는 프로필 */}
  <Badge count={5}>
    <BellOutlined style={{ fontSize: 20 }} />
  </Badge>
</Header>
```

### 메인 컨텐츠 (Main Content)

```tsx
<Content
  style={{
    marginTop: 56,  // 헤더 높이
    marginBottom: 60,  // 하단 네비게이션 높이
    padding: 16,
    backgroundColor: '#F5F5F5',
    minHeight: 'calc(100vh - 116px)',
  }}
>
  {children}
</Content>
```

### 하단 네비게이션 (Bottom Navigation)

```tsx
<div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 60,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTop: '1px solid #F0F0F0',
    padding: '8px 0',
  }}
>
  {navItems.map(({ path, label, icon, badge }) => (
    <div
      key={path}
      onClick={() => navigate(path)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        color: isActive ? '#2F54EB' : '#8C8C8C',
      }}
    >
      <Badge count={badge} size="small">
        <span style={{ fontSize: 24 }}>{icon}</span>
      </Badge>
      <Text style={{ fontSize: 11 }}>{label}</Text>
    </div>
  ))}
</div>
```

### 그리드 시스템

```tsx
// 모바일: 1열, 태블릿: 2열, 데스크톱: 3-4열
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>컨텐츠</Card>
  </Col>
</Row>

// 통계 카드: 모바일 2열, 태블릿 4열
<Row gutter={[16, 16]}>
  <Col xs={12} sm={6}>
    <Statistic title="신규 주문" value={15} />
  </Col>
</Row>
```

---

## 컴포넌트 가이드

### 1. 카드 (Card)

#### 주문 카드
```tsx
<Card
  hoverable
  style={{
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  }}
  bodyStyle={{ padding: 16 }}
>
  <Space direction="vertical" size="small" style={{ width: '100%' }}>
    {/* 헤더: 주문번호 + 상태 */}
    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
      <Text strong>ORD-2024-001</Text>
      <Tag color="blue">신규</Tag>
    </Space>
    
    {/* 타이틀 */}
    <Title level={5} style={{ margin: 0 }}>에어컨 설치</Title>
    
    {/* 정보 */}
    <Text type="secondary">👤 김철수</Text>
    <Text type="secondary">📍 서울시 강남구...</Text>
    
    {/* 푸터: 날짜 + 금액 */}
    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
      <Text type="secondary">2026-01-20</Text>
      <Text strong style={{ color: '#2F54EB', fontSize: 16 }}>
        150,000원
      </Text>
    </Space>
  </Space>
</Card>
```

#### 통계 카드
```tsx
<Card style={{ borderRadius: 12 }}>
  <Statistic
    title="신규 주문"
    value={15}
    suffix="건"
    prefix={<FileTextOutlined />}
    valueStyle={{ color: '#2F54EB', fontSize: 24 }}
  />
</Card>
```

### 2. 버튼 (Button)

#### 주요 액션 버튼 (Primary)
```tsx
<Button
  type="primary"
  size="large"
  block
  icon={<CheckOutlined />}
  style={{
    height: 48,
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 8,
  }}
>
  주문 수락
</Button>
```

#### 보조 버튼 (Secondary)
```tsx
<Button
  type="default"
  size="large"
  block
  style={{
    height: 48,
    fontSize: 16,
    borderRadius: 8,
  }}
>
  취소
</Button>
```

#### 버튼 그룹
```tsx
<Space style={{ width: '100%' }} size="middle">
  <Button type="primary" size="large" block>
    수락
  </Button>
  <Button type="default" size="large" block>
    거절
  </Button>
</Space>
```

### 3. 입력 필드 (Input)

#### 기본 입력
```tsx
<Input
  size="large"
  placeholder="이메일 또는 휴대폰"
  prefix={<UserOutlined />}
  style={{
    height: 44,
    borderRadius: 8,
  }}
/>
```

#### 비밀번호 입력
```tsx
<Input.Password
  size="large"
  placeholder="비밀번호"
  prefix={<LockOutlined />}
  style={{
    height: 44,
    borderRadius: 8,
  }}
/>
```

#### 텍스트 영역
```tsx
<Input.TextArea
  rows={4}
  placeholder="메모를 입력하세요"
  style={{
    borderRadius: 8,
  }}
/>
```

### 4. 폼 (Form)

#### 모바일 최적화 폼
```tsx
<Form
  layout="vertical"
  size="large"
  style={{ maxWidth: 600, margin: '0 auto' }}
>
  <Form.Item
    label="이메일"
    name="email"
    rules={[{ required: true, type: 'email' }]}
  >
    <Input placeholder="example@email.com" />
  </Form.Item>
  
  <Form.Item
    label="비밀번호"
    name="password"
    rules={[{ required: true, min: 8 }]}
  >
    <Input.Password placeholder="8자 이상" />
  </Form.Item>
  
  <Form.Item>
    <Button type="primary" htmlType="submit" block size="large">
      로그인
    </Button>
  </Form.Item>
</Form>
```

### 5. 리스트 (List)

#### 채팅 목록
```tsx
<List
  dataSource={chats}
  renderItem={(chat) => (
    <List.Item
      onClick={() => navigate(`/chat/${chat.id}`)}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        borderBottom: '1px solid #F0F0F0',
      }}
    >
      <List.Item.Meta
        avatar={
          <Badge dot={chat.unread > 0}>
            <Avatar size={48} src={chat.avatar} />
          </Badge>
        }
        title={
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Text strong>{chat.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatTime(chat.lastMessageAt)}
            </Text>
          </Space>
        }
        description={
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Text ellipsis style={{ maxWidth: 200 }}>
              {chat.lastMessage}
            </Text>
            {chat.unread > 0 && (
              <Badge count={chat.unread} />
            )}
          </Space>
        }
      />
    </List.Item>
  )}
/>
```

### 6. 모달 vs Drawer

#### 모바일: Drawer 사용
```tsx
<Drawer
  title="주문 상세"
  placement="bottom"
  height="90%"
  open={open}
  onClose={onClose}
  style={{ borderRadius: '16px 16px 0 0' }}
>
  {content}
</Drawer>
```

#### 데스크톱: Modal 사용
```tsx
<Modal
  title="주문 상세"
  open={open}
  onCancel={onClose}
  width={600}
  footer={null}
>
  {content}
</Modal>
```

#### 반응형 처리
```tsx
const isMobile = window.innerWidth < 768;

{isMobile ? (
  <Drawer {...drawerProps}>{content}</Drawer>
) : (
  <Modal {...modalProps}>{content}</Modal>
)}
```

### 7. 테이블 → 카드 리스트

#### 모바일: 카드 리스트
```tsx
<Space direction="vertical" size="middle" style={{ width: '100%' }}>
  {data.map(item => (
    <Card key={item.id} size="small">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="주문번호">
          {item.orderNumber}
        </Descriptions.Item>
        <Descriptions.Item label="고객">
          {item.customerName}
        </Descriptions.Item>
        <Descriptions.Item label="금액">
          {item.amount.toLocaleString()}원
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={getStatusColor(item.status)}>
            {item.status}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      <Button type="link" size="small" style={{ marginTop: 8 }}>
        상세보기
      </Button>
    </Card>
  ))}
</Space>
```

#### 데스크톱: 테이블
```tsx
<Table
  dataSource={data}
  columns={columns}
  pagination={{ pageSize: 20 }}
/>
```

---

## 네비게이션 패턴

### 1. 하단 탭 네비게이션 (Primary)

**용도**: 주요 5개 메뉴 (항상 표시)

```tsx
const bottomNavItems = [
  { path: '/dashboard', label: '홈', icon: <HomeOutlined /> },
  { path: '/orders', label: '주문', icon: <FileTextOutlined /> },
  { path: '/chat', label: '채팅', icon: <MessageOutlined />, badge: 3 },
  { path: '/schedule', label: '일정', icon: <CalendarOutlined /> },
  { path: '/profile', label: '프로필', icon: <UserOutlined /> },
];
```

**특징**:
- 항상 화면 하단에 고정
- 현재 페이지 강조 (색상 변경)
- 알림 배지 표시 가능
- 아이콘 + 라벨

### 2. 햄버거 메뉴 (Secondary)

**용도**: 전체 메뉴 (필요시 표시)

```tsx
<Drawer
  title="메뉴"
  placement="left"
  onClose={() => setDrawerOpen(false)}
  open={drawerOpen}
  width={280}
>
  {/* 사용자 정보 */}
  <Space>
    <Avatar size={48} />
    <div>
      <Text strong>{user.name}님</Text>
      <br />
      <Text type="secondary">{user.email}</Text>
    </div>
  </Space>
  
  {/* 메뉴 아이템 */}
  {menuItems.map(item => (
    <div
      key={item.path}
      onClick={() => navigate(item.path)}
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: isActive ? '#E6F7FF' : 'transparent',
      }}
    >
      {item.icon} {item.label}
    </div>
  ))}
</Drawer>
```

### 3. 뒤로가기

**용도**: 상세 페이지에서 목록으로 돌아가기

```tsx
<Header>
  <ArrowLeftOutlined
    onClick={() => navigate(-1)}
    style={{ fontSize: 20, cursor: 'pointer' }}
  />
  <Title level={5}>주문 상세</Title>
  <div style={{ width: 20 }} /> {/* 균형을 위한 빈 공간 */}
</Header>
```

---

## 인터랙션 가이드

### 1. 터치 제스처

#### 탭 (Tap)
- 버튼 클릭
- 카드 선택
- 링크 이동

#### 스와이프 (Swipe)
```tsx
// 좌우 스와이프로 탭 전환
<Tabs
  defaultActiveKey="1"
  items={[
    { key: '1', label: '신규', children: <OrderList status="new" /> },
    { key: '2', label: '진행중', children: <OrderList status="in_progress" /> },
  ]}
/>
```

#### 풀 투 리프레시 (Pull to Refresh)
```tsx
// 아래로 당겨서 새로고침
<PullToRefresh onRefresh={loadData}>
  <List dataSource={data} />
</PullToRefresh>
```

### 2. 피드백

#### 로딩 상태
```tsx
// 전체 화면 로딩
<Spin size="large" tip="로딩 중...">
  <div style={{ minHeight: 200 }} />
</Spin>

// 버튼 로딩
<Button type="primary" loading>
  처리 중...
</Button>
```

#### 성공/실패 메시지
```tsx
// 토스트 메시지
message.success('주문을 수락했습니다');
message.error('주문 수락에 실패했습니다');

// 알림
notification.success({
  message: '주문 수락 완료',
  description: '고객에게 알림이 전송되었습니다',
});
```

#### 확인 다이얼로그
```tsx
Modal.confirm({
  title: '주문을 거절하시겠습니까?',
  content: '거절 후에는 취소할 수 없습니다',
  okText: '거절',
  okType: 'danger',
  cancelText: '취소',
  onOk: handleReject,
});
```

### 3. 애니메이션

#### 페이지 전환
```css
.page-enter {
  opacity: 0;
  transform: translateX(100%);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease-out;
}
```

#### 카드 호버
```tsx
<Card
  hoverable
  style={{
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }}
>
  {content}
</Card>
```

---

## 반응형 전략

### 브레이크포인트

```css
/* Ant Design 기본 브레이크포인트 */
--breakpoint-xs: 0px;      /* 모바일 */
--breakpoint-sm: 576px;    /* 큰 모바일 */
--breakpoint-md: 768px;    /* 태블릿 */
--breakpoint-lg: 992px;    /* 작은 데스크톱 */
--breakpoint-xl: 1200px;   /* 데스크톱 */
--breakpoint-xxl: 1600px;  /* 큰 데스크톱 */
```

### 반응형 그리드

```tsx
// 모바일: 1열, 태블릿: 2열, 데스크톱: 4열
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={6}>
    <Card>통계 1</Card>
  </Col>
  <Col xs={24} sm={12} md={6}>
    <Card>통계 2</Card>
  </Col>
  <Col xs={24} sm={12} md={6}>
    <Card>통계 3</Card>
  </Col>
  <Col xs={24} sm={12} md={6}>
    <Card>통계 4</Card>
  </Col>
</Row>
```

### 반응형 컴포넌트

```tsx
import { useMediaQuery } from 'react-responsive';

function ResponsiveComponent() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  return (
    <>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </>
  );
}
```

### 반응형 폰트

```css
/* 모바일 */
@media (max-width: 767px) {
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }
  body { font-size: 14px; }
}

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) {
  h1 { font-size: 28px; }
  h2 { font-size: 22px; }
  h3 { font-size: 20px; }
  body { font-size: 15px; }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  h1 { font-size: 32px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  body { font-size: 16px; }
}
```

---

## 접근성 (Accessibility)

### 1. 키보드 네비게이션

```tsx
// Tab 키로 이동 가능
<Button tabIndex={0}>버튼</Button>

// Enter/Space로 활성화
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  클릭 가능한 영역
</div>
```

### 2. ARIA 속성

```tsx
// 버튼 역할
<div role="button" aria-label="주문 수락">
  <CheckOutlined />
</div>

// 알림 배지
<Badge count={5} aria-label="5개의 새 알림">
  <BellOutlined />
</Badge>

// 로딩 상태
<Spin aria-label="로딩 중" />
```

### 3. 색상 대비

```css
/* WCAG AA 기준 (4.5:1 이상) */
--text-on-white: #262626;  /* 대비 12.63:1 */
--text-secondary: #595959;  /* 대비 7.00:1 */

/* WCAG AAA 기준 (7:1 이상) */
--text-high-contrast: #000000;  /* 대비 21:1 */
```

---

## 성능 최적화

### 1. 이미지 최적화

```tsx
// Lazy Loading
<Image
  src={imageUrl}
  alt="설명"
  loading="lazy"
  placeholder={<Skeleton.Image />}
/>

// 반응형 이미지
<picture>
  <source srcSet={mobileImage} media="(max-width: 767px)" />
  <source srcSet={tabletImage} media="(max-width: 1023px)" />
  <img src={desktopImage} alt="설명" />
</picture>
```

### 2. 코드 스플리팅

```tsx
// 페이지별 코드 스플리팅
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrderListPage = lazy(() => import('./pages/OrderListPage'));

<Suspense fallback={<Spin size="large" />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/orders" element={<OrderListPage />} />
  </Routes>
</Suspense>
```

### 3. 가상 스크롤

```tsx
// 긴 리스트 최적화
<List
  dataSource={longList}
  renderItem={(item) => <ListItem item={item} />}
  pagination={{
    pageSize: 20,
    showSizeChanger: false,
  }}
/>
```

---

## 다크 모드 (선택사항)

### 테마 전환

```tsx
import { ConfigProvider, theme } from 'antd';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <YourApp />
    </ConfigProvider>
  );
}
```

---

## 체크리스트

### 모바일 최적화 체크리스트

- [ ] 터치 영역 최소 44x44px
- [ ] 버튼 높이 최소 44px
- [ ] 입력 필드 높이 최소 44px
- [ ] 터치 영역 간격 최소 8px
- [ ] 폰트 크기 최소 14px (본문)
- [ ] 색상 대비 4.5:1 이상
- [ ] 하단 네비게이션 구현
- [ ] 햄버거 메뉴 구현
- [ ] 뒤로가기 버튼 구현
- [ ] 로딩 상태 표시
- [ ] 에러 처리
- [ ] 빈 상태 표시
- [ ] 반응형 레이아웃
- [ ] 이미지 최적화
- [ ] 코드 스플리팅

### 접근성 체크리스트

- [ ] 키보드 네비게이션
- [ ] ARIA 속성
- [ ] 색상 대비
- [ ] 포커스 표시
- [ ] 스크린 리더 지원
- [ ] 대체 텍스트 (이미지)

---

## 참고 자료

- [Ant Design Mobile](https://mobile.ant.design/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Mobile](https://material.io/design/platform-guidance/android-mobile.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**작성일**: 2026-01-18  
**작성자**: Architect Mode  
**상태**: 완료
