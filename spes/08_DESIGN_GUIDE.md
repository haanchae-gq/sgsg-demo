# 쓱싹 홈케어 플랫폼 - 디자인 가이드 및 컴포넌트 스펙

**문서 버전**: 2.1  
**작성일**: 2026-01-14  
**우선순위**: P0 (최우선)  
**UI 프레임워크**: Ant Design + Tailwind CSS

---

## 📋 목차

1. [디자인 시스템 개요](#디자인-시스템-개요)
2. [색상 팔레트](#색상-팔레트)
3. [타이포그래피](#타이포그래피)
4. [레이아웃 시스템](#레이아웃-시스템)
5. [컴포넌트 가이드](#컴포넌트-가이드)
6. [Ant Design 컴포넌트 매핑](#ant-design-컴포넌트-매핑)

---

## 디자인 시스템 개요

### 기존 사이트 분석 결과

이미지 분석을 통해 확인된 디자인 특징:

1. **브랜드 컬러**: 파란색 (#2F54EB 계열) 주요 CTA 버튼
2. **캐릭터 일러스트**: 3D 캐릭터 사용 (친근한 이미지)
3. **카드 레이아웃**: 그리드 기반 카드형 서비스 목록
4. **아이콘**: 원형 배경의 컬러 아이콘
5. **여백**: 넉넉한 여백과 깔끔한 레이아웃
6. **반응형**: 모바일 최적화 디자인

### 디자인 원칙

1. **단순성**: 복잡하지 않은 직관적인 UI
2. **일관성**: 통일된 디자인 패턴
3. **접근성**: 모바일 친화적 반응형 디자인
4. **신뢰성**: 전문적이면서도 친근한 느낌

---

## 색상 팔레트

### Primary Colors (주요 색상)
```css
/* 브랜드 메인 컬러 - 파란색 */
--primary-default: #2F54EB;    /* 주요 버튼, 링크 */
--primary-hover: #1D39C4;      /* 호버 상태 */
--primary-active: #10239E;     /* 클릭 상태 */
--primary-light: #597EF7;      /* 배경, 보조 요소 */
--primary-lighter: #ADC6FF;    /* 매우 연한 배경 */

/* 보조 컬러 - 오렌지 (강조) */
--secondary-default: #FA8C16;  /* 강조 버튼 */
--secondary-hover: #D46B08;
--secondary-light: #FFA940;
```

### Neutral Colors (중립 색상)
```css
--white: #FFFFFF;
--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #E8E8E8;
--gray-300: #D9D9D9;
--gray-400: #BFBFBF;
--gray-500: #8C8C8C;
--gray-600: #595959;
--gray-700: #434343;
--gray-800: #262626;
--gray-900: #1F1F1F;
--black: #000000;
```

### Semantic Colors (의미 색상)
```css
/* 성공 */
--success: #52C41A;
--success-light: #95DE64;
--success-bg: #F6FFED;

/* 경고 */
--warning: #FAAD14;
--warning-light: #FFD666;
--warning-bg: #FFFBE6;

/* 에러 */
--error: #FF4D4F;
--error-light: #FF7875;
--error-bg: #FFF1F0;

/* 정보 */
--info: #1890FF;
--info-light: #69C0FF;
--info-bg: #E6F7FF;
```

### Service Category Colors (서비스 카테고리 색상)
```css
/* 설치/시공 */
--category-installation: #2F54EB;

/* 클리닝 */
--category-cleaning: #13C2C2;

/* 막힘해결 */
--category-unclogging: #FA8C16;
```

---

## 타이포그래피

### Font Family
```css
--font-primary: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-secondary: 'Roboto', sans-serif;
--font-mono: 'Courier New', monospace;
```

### Font Sizes
```css
/* Headings */
--text-h1: 32px;      /* 메인 타이틀 */
--text-h2: 24px;      /* 섹션 타이틀 */
--text-h3: 20px;      /* 서브 타이틀 */
--text-h4: 18px;      /* 카드 타이틀 */

/* Body */
--text-lg: 16px;      /* 본문 큰 글씨 */
--text-base: 14px;    /* 기본 본문 */
--text-sm: 12px;      /* 작은 글씨 */
--text-xs: 11px;      /* 매우 작은 글씨 */
```

### Font Weights
```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
--leading-loose: 2;
```

---

## 레이아웃 시스템

### Container
```css
--container-max-width: 1200px;
--container-padding: 24px;
```

### Spacing (간격)
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Border Radius (모서리)
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Shadows (그림자)
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Breakpoints (반응형)
```css
--breakpoint-xs: 0px;      /* 모바일 */
--breakpoint-sm: 576px;    /* 작은 태블릿 */
--breakpoint-md: 768px;    /* 태블릿 */
--breakpoint-lg: 992px;    /* 작은 데스크톱 */
--breakpoint-xl: 1200px;   /* 데스크톱 */
--breakpoint-xxl: 1600px;  /* 큰 데스크톱 */
```

---

## 컴포넌트 가이드

### 1. 버튼 (Button)

#### Primary Button (주요 버튼)
```tsx
// 기존 사이트 스타일 기반
<Button 
  type="primary"
  size="large"
  style={{
    backgroundColor: '#2F54EB',
    borderRadius: '4px',
    height: '48px',
    fontSize: '16px',
    fontWeight: 500
  }}
>
  로그인
</Button>
```

#### Secondary Button (보조 버튼)
```tsx
<Button 
  type="default"
  size="large"
  style={{
    borderColor: '#D9D9D9',
    color: '#595959',
    borderRadius: '4px',
    height: '48px'
  }}
>
  취소
</Button>
```

#### CTA Button (행동 유도 버튼)
```tsx
<Button 
  type="primary"
  size="large"
  style={{
    backgroundColor: '#FA8C16',
    borderRadius: '8px',
    height: '56px',
    fontSize: '18px',
    fontWeight: 600
  }}
>
  서비스 신청하기
</Button>
```

---

### 2. 카드 (Card)

#### Service Card (서비스 카드)
```tsx
// 기존 사이트의 서비스 카드 스타일
<Card
  hoverable
  cover={<img alt="서비스" src="..." />}
  style={{
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  }}
  bodyStyle={{
    padding: '16px'
  }}
>
  <Card.Meta
    title={<span style={{ fontSize: '16px', fontWeight: 600 }}>에어컨 설치</span>}
    description={<span style={{ fontSize: '14px', color: '#8C8C8C' }}>전문가가 설치합니다</span>}
  />
</Card>
```

#### Info Card (정보 카드)
```tsx
// 안심 보장 서비스 카드
<Card
  style={{
    borderRadius: '12px',
    border: '1px solid #F0F0F0',
    textAlign: 'center',
    padding: '24px'
  }}
>
  <Avatar 
    size={64} 
    icon={<CheckCircleOutlined />}
    style={{ backgroundColor: '#E6F7FF', color: '#1890FF', marginBottom: '16px' }}
  />
  <Title level={4}>소수 정예 전문가</Title>
  <Paragraph style={{ color: '#8C8C8C' }}>
    까다로운 검증을 통과한 최정예 전문가가 설치합니다.
  </Paragraph>
</Card>
```

---

### 3. 헤더 (Header)

```tsx
<Layout.Header
  style={{
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }}
>
  {/* 로고 */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Avatar 
      size={40} 
      style={{ backgroundColor: '#2F54EB' }}
      icon={<CloudOutlined />}
    />
    <span style={{ marginLeft: '12px', fontSize: '20px', fontWeight: 700 }}>쓱싹</span>
  </div>
  
  {/* 메뉴 */}
  <Menu 
    mode="horizontal" 
    style={{ border: 'none', flex: 1, justifyContent: 'center' }}
    items={[
      { key: 'home', label: '홈' },
      { key: 'service', label: '서비스' },
      { key: 'store', label: '스토어' },
      { key: 'expert', label: '전문가 지원' },
      { key: 'support', label: '고객센터' }
    ]}
  />
  
  {/* 로그인 버튼 */}
  <Button type="primary">로그인</Button>
</Layout.Header>
```

---

### 4. 푸터 (Footer)

```tsx
<Layout.Footer
  style={{
    backgroundColor: '#F5F5F5',
    padding: '48px 24px',
    marginTop: '64px'
  }}
>
  <Row gutter={[48, 24]}>
    {/* 좌측 */}
    <Col xs={24} md={12}>
      <Space direction="vertical" size="small">
        <Space split={<Divider type="vertical" />}>
          <a href="/terms">이용약관</a>
          <a href="/partnership">제휴신청</a>
          <a href="/about">About쓱싹</a>
          <a href="/blog">쓱싹 블로그</a>
        </Space>
        <Text type="secondary">제휴/입점 문의: go@sgsgcare.com</Text>
        <Text strong>(주)쓱싹</Text>
        <Text type="secondary">
          대표: 이주열 | 통신판매번호: 2025-서울금천-0166 | 사업자등록번호: 852-86-02742
        </Text>
        <Text type="secondary">서울특별시 금천구 가산동 371-6 가산비즈니스센터</Text>
      </Space>
    </Col>
    
    {/* 우측 */}
    <Col xs={24} md={12}>
      <Space direction="vertical" size="small">
        <Text strong>카카오 고객센터</Text>
        <Text>월 - 금 10:00 ~ 17:00</Text>
        <Text type="secondary">점심시간 12:30 ~ 13:30 (주말/공휴일 제외)</Text>
      </Space>
    </Col>
  </Row>
</Layout.Footer>
```

---

### 5. Hero Banner (히어로 배너)

```tsx
// 메인 페이지 Hero
<div
  style={{
    backgroundColor: '#FFFFFF',
    padding: '80px 24px',
    textAlign: 'center'
  }}
>
  <Row align="middle" gutter={[48, 48]}>
    <Col xs={24} md={12}>
      <Space direction="vertical" size="large" style={{ textAlign: 'left' }}>
        <Title level={1} style={{ fontSize: '48px', marginBottom: 0 }}>
          양심가격, 안심케어
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#595959' }}>
          소비자 기만이 일상이던 가전시장,<br />
          쓱싹이 투명히 개선합니다.
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          style={{ 
            height: '56px', 
            fontSize: '18px',
            borderRadius: '8px',
            paddingLeft: '32px',
            paddingRight: '32px'
          }}
        >
          서비스 신청하기
        </Button>
      </Space>
    </Col>
    <Col xs={24} md={12}>
      {/* 3D 캐릭터 이미지 */}
      <img src="/hero-character.png" alt="쓱싹 캐릭터" style={{ maxWidth: '100%' }} />
    </Col>
  </Row>
</div>
```

---

### 6. Service Category Card (서비스 카테고리 카드)

```tsx
// 대분류 카테고리 카드 (3열)
<Row gutter={[24, 24]}>
  {categories.map(category => (
    <Col xs={24} sm={12} md={8} key={category.id}>
      <Card
        hoverable
        style={{
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px solid #F0F0F0',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: '32px' }}
        onClick={() => navigate(`/services/${category.slug}`)}
      >
        <Avatar 
          size={80} 
          style={{ 
            backgroundColor: category.color,
            marginBottom: '16px'
          }}
          icon={category.icon}
        />
        <Title level={3} style={{ marginBottom: '8px' }}>
          {category.name}
        </Title>
        <Paragraph type="secondary">
          {category.description}
        </Paragraph>
      </Card>
    </Col>
  ))}
</Row>
```

---

### 7. Service Item Card (서비스 항목 카드)

```tsx
// 중분류 서비스 카드 (4열)
<Row gutter={[16, 16]}>
  {services.map(service => (
    <Col xs={12} sm={12} md={6} key={service.id}>
      <Card
        hoverable
        cover={
          <div style={{ 
            height: '200px', 
            overflow: 'hidden',
            borderRadius: '12px 12px 0 0'
          }}>
            <img 
              alt={service.name} 
              src={service.image}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        }
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Title level={4} style={{ fontSize: '16px', marginBottom: '4px' }}>
          {service.name}
        </Title>
        <Paragraph 
          type="secondary" 
          style={{ fontSize: '14px', marginBottom: 0 }}
          ellipsis={{ rows: 2 }}
        >
          {service.description}
        </Paragraph>
      </Card>
    </Col>
  ))}
</Row>
```

---

### 8. Feature Card (특징 카드)

```tsx
// 안심 보장 서비스 카드 (2열)
<Row gutter={[24, 24]}>
  {features.map(feature => (
    <Col xs={24} sm={12} key={feature.id}>
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #F0F0F0',
          height: '100%'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Space align="start" size="middle">
          <Avatar 
            size={56} 
            style={{ 
              backgroundColor: feature.bgColor,
              flexShrink: 0
            }}
            icon={feature.icon}
          />
          <div>
            <Title level={4} style={{ marginBottom: '8px' }}>
              {feature.title}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {feature.description}
            </Paragraph>
          </div>
        </Space>
      </Card>
    </Col>
  ))}
</Row>
```

---

### 9. Review Card (리뷰 카드)

```tsx
<Card
  style={{
    borderRadius: '12px',
    border: '1px solid #F0F0F0'
  }}
  bodyStyle={{ padding: '20px' }}
>
  <Space direction="vertical" size="small" style={{ width: '100%' }}>
    {/* 평점 */}
    <Rate disabled defaultValue={5} style={{ fontSize: '16px', color: '#FAAD14' }} />
    
    {/* 리뷰 내용 */}
    <Paragraph style={{ marginBottom: '12px' }}>
      정말 만족스러운 서비스였습니다. 전문가님이 친절하게 설명해주시고...
    </Paragraph>
    
    {/* 리뷰 이미지 */}
    <Image.PreviewGroup>
      <Space size="small">
        <Image width={80} height={80} src="..." style={{ borderRadius: '8px' }} />
        <Image width={80} height={80} src="..." style={{ borderRadius: '8px' }} />
      </Space>
    </Image.PreviewGroup>
    
    {/* 작성자 정보 */}
    <div style={{ marginTop: '12px' }}>
      <Text type="secondary" style={{ fontSize: '12px' }}>
        김** · 에어컨 설치
      </Text>
    </div>
  </Space>
</Card>
```

---

### 10. Statistics Card (통계 카드)

```tsx
// 대시보드 통계 카드
<Card
  style={{
    borderRadius: '12px',
    border: '1px solid #F0F0F0',
    textAlign: 'center'
  }}
  bodyStyle={{ padding: '24px' }}
>
  <Statistic
    title={<span style={{ fontSize: '14px', color: '#8C8C8C' }}>신규 주문</span>}
    value={15}
    suffix="건"
    valueStyle={{ 
      fontSize: '32px', 
      fontWeight: 700,
      color: '#2F54EB'
    }}
  />
</Card>
```

---

### 11. Tab Navigation (탭 네비게이션)

```tsx
// 예약관리 상태별 탭
<Tabs
  defaultActiveKey="new"
  type="card"
  size="large"
  style={{
    marginBottom: '24px'
  }}
  items={[
    { key: 'new', label: '신규 주문', children: <OrderList status="new" /> },
    { key: 'consult', label: '상담 필요', children: <OrderList status="consult" /> },
    { key: 'pending', label: '예약 미정', children: <OrderList status="pending" /> },
    { key: 'confirmed', label: '예약 확정', children: <OrderList status="confirmed" /> },
    { key: 'payment', label: '잔금 결제', children: <OrderList status="payment" /> },
    { key: 'paid', label: '구매 확정', children: <OrderList status="paid" /> },
    { key: 'as', label: 'A/S', children: <OrderList status="as" /> },
    { key: 'cancelled', label: '취소', children: <OrderList status="cancelled" /> }
  ]}
/>
```

---

### 12. Order Card (주문 카드)

```tsx
// 전문가 웹앱 주문 카드
<Card
  style={{
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #F0F0F0'
  }}
  bodyStyle={{ padding: '16px' }}
>
  <Space direction="vertical" size="small" style={{ width: '100%' }}>
    {/* 타이머 (신규 주문인 경우) */}
    {status === 'new' && (
      <Alert
        message={<Countdown value={deadline} format="HH:mm:ss" />}
        type="warning"
        showIcon
        icon={<ClockCircleOutlined />}
      />
    )}
    
    {/* 상태 배지 */}
    <Tag color="blue">신규 주문</Tag>
    
    {/* 주문 정보 */}
    <Title level={4} style={{ marginBottom: '8px' }}>
      {service.name}
    </Title>
    
    <Descriptions column={1} size="small">
      <Descriptions.Item label="고객명">{customer.name}</Descriptions.Item>
      <Descriptions.Item label="주소">{address.full}</Descriptions.Item>
      <Descriptions.Item label="희망일정">{requestedDate}</Descriptions.Item>
      <Descriptions.Item label="금액">
        <Text strong style={{ fontSize: '16px', color: '#2F54EB' }}>
          {formatPrice(totalAmount)}원
        </Text>
      </Descriptions.Item>
    </Descriptions>
    
    {/* 액션 버튼 */}
    <Space style={{ marginTop: '12px', width: '100%' }}>
      <Button type="primary" block>수락</Button>
      <Button block>거절</Button>
    </Space>
  </Space>
</Card>
```

---

### 13. Calendar (캘린더)

```tsx
<Calendar
  fullscreen={false}
  dateCellRender={(date) => {
    const orders = getOrdersByDate(date);
    return orders.length > 0 ? (
      <Badge 
        count={orders.length} 
        style={{ backgroundColor: '#2F54EB' }}
      />
    ) : null;
  }}
  onSelect={(date) => {
    setSelectedDate(date);
    showOrdersForDate(date);
  }}
/>
```

---

### 14. Chat Interface (채팅 인터페이스)

```tsx
// 채팅 화면
<div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
  {/* 채팅 헤더 */}
  <div style={{ 
    padding: '16px', 
    borderBottom: '1px solid #F0F0F0',
    backgroundColor: '#FAFAFA'
  }}>
    <Space>
      <Avatar src={customer.avatar} />
      <div>
        <Text strong>{customer.name}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {order.orderNumber}
        </Text>
      </div>
    </Space>
  </div>
  
  {/* 메시지 목록 */}
  <div style={{ 
    flex: 1, 
    overflowY: 'auto', 
    padding: '16px',
    backgroundColor: '#F5F5F5'
  }}>
    {messages.map(msg => (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
          marginBottom: '12px'
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: msg.isMine ? '#2F54EB' : '#FFFFFF',
            color: msg.isMine ? '#FFFFFF' : '#000000',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Text style={{ color: 'inherit' }}>{msg.content}</Text>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
            {formatTime(msg.createdAt)}
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {/* 입력창 */}
  <div style={{ 
    padding: '16px', 
    borderTop: '1px solid #F0F0F0',
    backgroundColor: '#FFFFFF'
  }}>
    <Space.Compact style={{ width: '100%' }}>
      <Input
        placeholder="메시지를 입력하세요"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onPressEnter={sendMessage}
      />
      <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>
        전송
      </Button>
    </Space.Compact>
  </div>
</div>
```

---

### 15. Form Components (폼 컴포넌트)

#### 로그인 폼
```tsx
<Form
  name="login"
  layout="vertical"
  onFinish={onSubmit}
  style={{ maxWidth: '400px', margin: '0 auto' }}
>
  <Form.Item
    label="이메일 또는 휴대폰"
    name="emailOrPhone"
    rules={[{ required: true, message: '이메일 또는 휴대폰을 입력하세요' }]}
  >
    <Input 
      size="large" 
      placeholder="example@email.com 또는 010-1234-5678"
      style={{ borderRadius: '8px' }}
    />
  </Form.Item>
  
  <Form.Item
    label="비밀번호"
    name="password"
    rules={[{ required: true, message: '비밀번호를 입력하세요' }]}
  >
    <Input.Password 
      size="large" 
      placeholder="비밀번호"
      style={{ borderRadius: '8px' }}
    />
  </Form.Item>
  
  <Form.Item>
    <Button 
      type="primary" 
      htmlType="submit" 
      size="large" 
      block
      style={{ 
        height: '48px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 500
      }}
    >
      로그인
    </Button>
  </Form.Item>
  
  <Form.Item>
    <Space split={<Divider type="vertical" />}>
      <a href="/forgot-password">비밀번호 찾기</a>
      <a href="/signup">회원가입</a>
    </Space>
  </Form.Item>
</Form>
```

---

### 16. Table (테이블)

```tsx
// 백오피스 주문 목록 테이블
<Table
  columns={[
    {
      title: '주문번호',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <a>{text}</a>
    },
    {
      title: '고객',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: '전문가',
      dataIndex: 'expertName',
      key: 'expertName'
    },
    {
      title: '서비스',
      dataIndex: 'serviceName',
      key: 'serviceName'
    },
    {
      title: '금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${formatPrice(amount)}원`
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: '작업',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">상세</Button>
        </Space>
      )
    }
  ]}
  dataSource={orders}
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `총 ${total}건`
  }}
  style={{
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px'
  }}
/>
```

---

### 17. Modal (모달)

```tsx
// 주문 수락 모달
<Modal
  title="주문 수락"
  open={isOpen}
  onOk={handleAccept}
  onCancel={handleCancel}
  width={600}
  okText="확인"
  cancelText="취소"
  style={{ borderRadius: '12px' }}
>
  <Form layout="vertical">
    <Form.Item label="서비스 일정" required>
      <DatePicker 
        size="large" 
        style={{ width: '100%' }}
        placeholder="날짜 선택"
      />
    </Form.Item>
    
    <Form.Item label="시작 시간" required>
      <TimePicker 
        size="large" 
        style={{ width: '100%' }}
        format="HH:mm"
        placeholder="시간 선택"
      />
    </Form.Item>
    
    <Form.Item label="종료 시간" required>
      <TimePicker 
        size="large" 
        style={{ width: '100%' }}
        format="HH:mm"
        placeholder="시간 선택"
      />
    </Form.Item>
    
    <Form.Item label="메모">
      <Input.TextArea 
        rows={4}
        placeholder="고객에게 전달할 메시지를 입력하세요"
      />
    </Form.Item>
  </Form>
</Modal>
```

---

### 18. Bottom Navigation (하단 네비게이션)

```tsx
// 전문가 웹앱 하단 네비게이션 (모바일)
<div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #F0F0F0',
    padding: '8px 0',
    zIndex: 1000
  }}
>
  <Row justify="space-around">
    {[
      { key: 'home', icon: <HomeOutlined />, label: '홈' },
      { key: 'orders', icon: <FileTextOutlined />, label: '예약관리' },
      { key: 'calendar', icon: <CalendarOutlined />, label: '캘린더' },
      { key: 'chat', icon: <MessageOutlined />, label: '채팅', badge: 3 },
      { key: 'profile', icon: <UserOutlined />, label: '내정보' }
    ].map(item => (
      <Col key={item.key} style={{ textAlign: 'center' }}>
        <Badge count={item.badge} offset={[10, 0]}>
          <Button
            type="text"
            icon={item.icon}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 'auto',
              padding: '8px 16px',
              color: activeTab === item.key ? '#2F54EB' : '#8C8C8C'
            }}
            onClick={() => navigate(item.key)}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>
              {item.icon}
            </div>
            <div style={{ fontSize: '11px' }}>
              {item.label}
            </div>
          </Button>
        </Badge>
      </Col>
    ))}
  </Row>
</div>
```

---

## Ant Design 컴포넌트 매핑

### 기본 컴포넌트

| 용도 | Ant Design 컴포넌트 | 사용 예시 |
|------|---------------------|----------|
| 버튼 | `Button` | 로그인, 수락/거절, CTA |
| 입력 | `Input`, `Input.Password`, `Input.TextArea` | 폼 입력 |
| 선택 | `Select`, `Radio`, `Checkbox` | 옵션 선택 |
| 날짜 | `DatePicker`, `TimePicker`, `Calendar` | 일정 선택 |
| 카드 | `Card` | 서비스 카드, 주문 카드 |
| 테이블 | `Table` | 주문 목록, 사용자 목록 |
| 폼 | `Form` | 로그인, 회원가입, 주문 입력 |
| 모달 | `Modal`, `Drawer` | 상세 보기, 수정 |
| 탭 | `Tabs` | 상태별 주문 관리 |
| 메뉴 | `Menu` | 헤더 메뉴, 사이드바 |

### 데이터 표시

| 용도 | Ant Design 컴포넌트 | 사용 예시 |
|------|---------------------|----------|
| 통계 | `Statistic` | 대시보드 통계 |
| 배지 | `Badge` | 알림 개수, 상태 표시 |
| 태그 | `Tag` | 상태, 카테고리 |
| 평점 | `Rate` | 리뷰 평점 |
| 진행바 | `Progress` | 서비스 진행 상태 |
| 타임라인 | `Timeline` | 주문 이력 |
| 설명 | `Descriptions` | 상세 정보 |
| 아바타 | `Avatar` | 프로필 사진, 아이콘 |

### 피드백

| 용도 | Ant Design 컴포넌트 | 사용 예시 |
|------|---------------------|----------|
| 알림 | `Alert` | 타이머, 경고 메시지 |
| 메시지 | `message` | 성공/실패 알림 |
| 알림창 | `notification` | 푸시 알림 |
| 스피너 | `Spin` | 로딩 상태 |
| 스켈레톤 | `Skeleton` | 데이터 로딩 중 |
| 결과 | `Result` | 성공/실패 페이지 |

### 레이아웃

| 용도 | Ant Design 컴포넌트 | 사용 예시 |
|------|---------------------|----------|
| 레이아웃 | `Layout`, `Layout.Header`, `Layout.Footer` | 전체 레이아웃 |
| 그리드 | `Row`, `Col` | 반응형 그리드 |
| 공간 | `Space` | 요소 간 간격 |
| 구분선 | `Divider` | 섹션 구분 |

---

## 페이지별 컴포넌트 구성

### 1. 소비자 웹 - 홈 페이지

```tsx
<Layout>
  <Layout.Header /> {/* 헤더 */}
  
  <Layout.Content>
    {/* Hero Banner */}
    <HeroBanner />
    
    {/* 서비스 대분류 카테고리 (3열) */}
    <Section title="쓱싹 주요 서비스">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8}>
          <CategoryCard category="설치/시공" />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <CategoryCard category="클리닝" />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <CategoryCard category="막힘해결" />
        </Col>
      </Row>
    </Section>
    
    {/* 인기 서비스 (탭 + 4열 카드) */}
    <Section title="쓱싹 인기 서비스">
      <Tabs items={categoryTabs} />
      <Row gutter={[16, 16]}>
        {services.map(service => (
          <Col xs={12} sm={12} md={6} key={service.id}>
            <ServiceCard service={service} />
          </Col>
        ))}
      </Row>
    </Section>
    
    {/* 안심 보장 서비스 (2열) */}
    <Section title="쓱싹만의 안심 보장 서비스">
      <Row gutter={[24, 24]}>
        {features.map(feature => (
          <Col xs={24} sm={12} key={feature.id}>
            <FeatureCard feature={feature} />
          </Col>
        ))}
      </Row>
    </Section>
    
    {/* 리뷰 */}
    <Section title="정직한 쓱싹의 리얼한 리뷰">
      <ReviewCarousel reviews={reviews} />
    </Section>
    
    {/* 전문가 인터뷰 (유튜브) */}
    <Section title="정직과 실력 쓱싹 전문가들">
      <ExpertInterviewSlider videos={videos} />
    </Section>
  </Layout.Content>
  
  <Layout.Footer /> {/* 푸터 */}
</Layout>
```

---

### 2. 전문가 웹앱 - 대시보드

```tsx
<Layout>
  <Layout.Header>
    <Space>
      <Avatar src={expert.avatar} />
      <Text strong>{expert.name}님</Text>
    </Space>
  </Layout.Header>
  
  <Layout.Content style={{ padding: '16px' }}>
    {/* 통계 카드 (2열) */}
    <Row gutter={[16, 16]}>
      <Col xs={12} sm={12} md={6}>
        <Statistic title="신규 주문" value={stats.new} suffix="건" />
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Statistic title="진행 중" value={stats.inProgress} suffix="건" />
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Statistic title="이번 주 수익" value={stats.weeklyEarnings} prefix="₩" />
      </Col>
      <Col xs={12} sm={12} md={6}>
        <Statistic title="평점" value={stats.rating} suffix="/ 5.0" />
      </Col>
    </Row>
    
    {/* 오늘의 일정 */}
    <Card title="오늘의 일정" style={{ marginTop: '24px' }}>
      <Timeline>
        {todaySchedule.map(schedule => (
          <Timeline.Item key={schedule.id} color="blue">
            <Text strong>{schedule.time}</Text> - {schedule.service}
            <br />
            <Text type="secondary">{schedule.address}</Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
    
    {/* 신규 주문 */}
    <Card title="신규 주문" style={{ marginTop: '24px' }}>
      {newOrders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </Card>
  </Layout.Content>
  
  {/* 하단 네비게이션 (모바일) */}
  <BottomNavigation />
</Layout>
```

---

### 3. 백오피스 - 대시보드

```tsx
<Layout>
  <Layout.Sider>
    <Menu
      mode="inline"
      items={[
        { key: 'dashboard', icon: <DashboardOutlined />, label: '대시보드' },
        { key: 'users', icon: <UserOutlined />, label: '사용자 관리' },
        { key: 'orders', icon: <FileTextOutlined />, label: '주문 관리' },
        { key: 'services', icon: <AppstoreOutlined />, label: '서비스 관리' },
        { key: 'settlements', icon: <DollarOutlined />, label: '정산 관리' },
        { key: 'reports', icon: <BarChartOutlined />, label: '통계 및 리포트' }
      ]}
    />
  </Layout.Sider>
  
  <Layout>
    <Layout.Header>
      <Space style={{ float: 'right' }}>
        <Badge count={5}>
          <BellOutlined style={{ fontSize: '20px' }} />
        </Badge>
        <Avatar src={admin.avatar} />
        <Text>{admin.name}</Text>
      </Space>
    </Layout.Header>
    
    <Layout.Content style={{ padding: '24px' }}>
      {/* 주요 지표 (4열) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="총 사용자" 
              value={1234} 
              prefix={<UserOutlined />}
              valueStyle={{ color: '#2F54EB' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="총 주문" 
              value={5678} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#13C2C2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="이번 달 매출" 
              value={75000000} 
              prefix="₩"
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic 
              title="활성 전문가" 
              value={156} 
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#FA8C16' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 최근 주문 */}
      <Card title="최근 주문" style={{ marginTop: '24px' }}>
        <Table dataSource={recentOrders} columns={orderColumns} />
      </Card>
      
      {/* 승인 대기 */}
      <Card title="승인 대기" style={{ marginTop: '24px' }}>
        <Alert
          message="전문가 가입 승인: 2건"
          type="warning"
          showIcon
          action={
            <Button size="small" type="link">바로가기</Button>
          }
        />
      </Card>
    </Layout.Content>
  </Layout>
</Layout>
```

---

## 다음 단계

1. **Ant Design 설치**
   ```bash
   npm install antd @ant-design/icons
   ```

2. **Tailwind CSS 설정**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **테마 커스터마이징**
   ```tsx
   // App.tsx
   import { ConfigProvider } from 'antd';
   import koKR from 'antd/locale/ko_KR';
   
   const theme = {
     token: {
       colorPrimary: '#2F54EB',
       colorSuccess: '#52C41A',
       colorWarning: '#FAAD14',
       colorError: '#FF4D4F',
       colorInfo: '#1890FF',
       borderRadius: 8,
       fontFamily: 'Noto Sans KR, sans-serif'
     }
   };
   
   function App() {
     return (
       <ConfigProvider theme={theme} locale={koKR}>
         {/* 앱 컴포넌트 */}
       </ConfigProvider>
     );
   }
   ```

---

**작성일**: 2026-01-14  
**버전**: 2.1  
**상태**: 디자인 가이드 완료
