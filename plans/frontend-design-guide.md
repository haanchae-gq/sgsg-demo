# SGSG 프론트엔드 디자인 구현 가이드

**문서 버전**: 1.0  
**작성일**: 2024-03-01  
**대상**: 프론트엔드 구현 에이전트  
**목적**: 일관된 디자인 패턴과 사용자 경험을 위한 구현 지침

---

## 📋 목차

1. [프로젝트 구조 및 공통 설정](#프로젝트-구조-및-공통-설정)
2. [디자인 시스템 & 브랜딩](#디자인-시스템--브랜딩)
3. [관리자 대시보드 디자인 가이드](#관리자-대시보드-디자인-가이드)
4. [전문가 모바일 앱 디자인 가이드](#전문가-모바일-앱-디자인-가이드)
5. [고객 마켓플레이스 디자인 가이드](#고객-마켓플레이스-디자인-가이드)
6. [공통 컴포넌트 라이브러리](#공통-컴포넌트-라이브러리)
7. [API 연동 패턴](#api-연동-패턴)
8. [성능 최적화 가이드](#성능-최적화-가이드)

---

## 프로젝트 구조 및 공통 설정

### 🏗️ 공통 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── forms/          # 폼 관련 컴포넌트
│   ├── charts/         # 차트 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── pages/              # 페이지 컴포넌트 (관리자)
├── screens/            # 화면 컴포넌트 (모바일)
├── services/           # API 서비스
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
├── hooks/              # Custom hooks
├── stores/             # 상태 관리
├── styles/             # 전역 스타일
└── constants/          # 상수 정의
```

### 🎨 공통 스타일 설정

```typescript
// styles/variables.ts - 공통 변수
export const colors = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB', 
    500: '#2196F3',    // 메인 브랜드 컬러
    600: '#1E88E5',
    700: '#1976D2',
    900: '#0D47A1'
  },
  secondary: {
    50: '#FFF3E0',
    500: '#FF9800',    // 액센트 컬러
    700: '#F57C00'
  },
  success: '#52c41a',
  warning: '#faad14', 
  error: '#ff4d4f',
  info: '#1890ff',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f'
  }
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
}

export const borderRadius = {
  sm: '4px',
  md: '6px', 
  lg: '8px',
  xl: '12px'
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
}
```

### 📱 반응형 브레이크포인트

```typescript
// utils/breakpoints.ts
export const breakpoints = {
  xs: 320,   // 모바일 (세로)
  sm: 375,   // 모바일 (가로) 
  md: 768,   // 태블릿
  lg: 1024,  // 태블릿 가로/작은 데스크톱
  xl: 1280,  // 데스크톱
  xxl: 1600  // 큰 데스크톱
}

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`
}
```

---

## 디자인 시스템 & 브랜딩

### 🎯 브랜드 아이덴티티

#### 브랜드 컬러
- **Primary Blue (#2196F3)**: 신뢰성, 전문성을 나타내는 메인 브랜드 컬러
- **Secondary Orange (#FF9800)**: 따뜻함, 친근함을 나타내는 액센트 컬러  
- **Success Green (#52c41a)**: 완료, 성공 상태 표시
- **Warning Yellow (#faad14)**: 주의, 대기 상태 표시
- **Error Red (#ff4d4f)**: 오류, 취소 상태 표시

#### 타이포그래피
```css
/* 폰트 패밀리 */
font-family: 
  'Pretendard', -apple-system, BlinkMacSystemFont, 
  'Segoe UI', 'Roboto', sans-serif;

/* 폰트 크기 스케일 */
h1: 32px/40px (가중치: 700)
h2: 28px/36px (가중치: 700)  
h3: 24px/32px (가중치: 600)
h4: 20px/28px (가중치: 600)
h5: 16px/24px (가중치: 600)
h6: 14px/20px (가중치: 600)

body: 14px/20px (가중치: 400)
body-large: 16px/24px (가중치: 400)
caption: 12px/16px (가중치: 400)
small: 11px/14px (가중치: 400)
```

### 🧩 Ant Design 커스터마이즈

```typescript
// styles/antd-theme.ts
import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // 브랜드 컬러
    colorPrimary: '#2196F3',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // 폰트
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    fontSize: 14,
    
    // 테두리
    borderRadius: 6,
    
    // 그림자
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    
    // 간격
    padding: 16,
    margin: 16
  },
  components: {
    Button: {
      primaryShadow: 'none',
      fontWeight: 500
    },
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    Table: {
      headerBg: '#fafafa'
    }
  }
}
```

---

## 관리자 대시보드 디자인 가이드

### 🖥️ 데스크톱 우선 설계

#### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│               Header (64px)              │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │        Main Content          │
│ (240px) │         (Flexible)           │
│         │                               │
│         │                               │
└─────────┴───────────────────────────────┘
```

#### 주요 네비게이션 구조
```typescript
// constants/navigation.ts
export const adminNavigation = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '대시보드',
    path: '/dashboard'
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: '사용자 관리',
    children: [
      { key: 'customers', label: '고객 관리', path: '/users/customers' },
      { key: 'experts', label: '전문가 관리', path: '/users/experts' },
      { key: 'admins', label: '관리자 관리', path: '/users/admins' }
    ]
  },
  {
    key: 'services',
    icon: <AppstoreOutlined />,
    label: '서비스 관리',
    children: [
      { key: 'categories', label: '카테고리', path: '/services/categories' },
      { key: 'items', label: '서비스 아이템', path: '/services/items' }
    ]
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: '주문 관리',
    path: '/orders'
  },
  {
    key: 'payments',
    icon: <CreditCardOutlined />,
    label: '결제 관리',
    path: '/payments'
  },
  {
    key: 'reviews',
    icon: <StarOutlined />,
    label: '리뷰 관리',
    path: '/reviews'
  }
]
```

#### 대시보드 레이아웃 패턴

**1. 지표 카드 (4-열 그리드)**
```typescript
// components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: number; // 증감률
  icon: ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, color }) => (
  <Card className="metric-card">
    <Row align="middle" justify="space-between">
      <Col>
        <Statistic
          title={title}
          value={value}
          valueStyle={{ color: colors[color][500] }}
        />
        {trend && (
          <Text type={trend > 0 ? 'success' : 'danger'}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </Text>
        )}
      </Col>
      <Col>
        <div className={`metric-icon metric-icon--${color}`}>
          {icon}
        </div>
      </Col>
    </Row>
  </Card>
);
```

**2. 데이터 테이블 패턴**
```typescript
// components/common/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnsType<T>;
  loading?: boolean;
  pagination?: TablePaginationConfig;
  onSearch?: (value: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  actions?: ReactNode;
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading,
  pagination,
  onSearch,
  onFilter,
  actions
}: DataTableProps<T>) => (
  <Card>
    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
      <Col>
        {onSearch && (
          <Input.Search
            placeholder="검색..."
            onSearch={onSearch}
            style={{ width: 300 }}
          />
        )}
      </Col>
      <Col>
        {actions}
      </Col>
    </Row>
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={pagination}
      scroll={{ x: true }}
      size="middle"
    />
  </Card>
);
```

**3. 차트 컨테이너 패턴**
```typescript
// components/charts/ChartContainer.tsx
interface ChartContainerProps {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
  loading?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  extra,
  loading
}) => (
  <Card 
    title={title}
    extra={extra}
    loading={loading}
  >
    <div style={{ height: 400 }}>
      {children}
    </div>
  </Card>
);
```

---

## 전문가 모바일 앱 디자인 가이드

### 📱 모바일 우선 설계

#### 터치 최적화 가이드라인
- **최소 터치 영역**: 44×44px (Apple HIG 기준)
- **버튼 높이**: 주요 액션 48px, 보조 액션 40px
- **간격**: 요소 간 최소 8px, 그룹 간 16px
- **스와이프**: 리스트 항목에서 액션 노출

#### 네비게이션 구조
```typescript
// constants/expert-navigation.ts
export const expertNavigation = [
  {
    key: 'orders',
    icon: <UnorderedListOutlined />,
    label: '주문',
    badge: true // 새 주문 카운트
  },
  {
    key: 'calendar',
    icon: <CalendarOutlined />,
    label: '일정'
  },
  {
    key: 'earnings',
    icon: <DollarOutlined />,
    label: '정산'
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: '내 정보'
  }
]
```

#### 모바일 레이아웃 패턴

**1. 상단 헤더 + 하단 탭**
```typescript
// components/layout/ExpertLayout.tsx
const ExpertLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="expert-layout">
    <NavBar
      backArrow={false}
      right={<Badge count={notificationCount}><BellOutlined /></Badge>}
    >
      SGSG Expert
    </NavBar>
    
    <div className="expert-content">
      {children}
    </div>
    
    <TabBar
      activeKey={activeTab}
      onChange={setActiveTab}
    >
      {expertNavigation.map(item => (
        <TabBar.Item
          key={item.key}
          icon={item.icon}
          title={item.label}
          badge={item.badge ? orderCount : undefined}
        />
      ))}
    </TabBar>
  </div>
);
```

**2. 주문 카드 패턴**
```typescript
// components/expert/OrderCard.tsx
interface OrderCardProps {
  order: Order;
  onAccept?: () => void;
  onReject?: () => void;
  onViewDetail?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAccept,
  onReject, 
  onViewDetail
}) => (
  <SwipeAction
    rightActions={[
      { key: 'accept', text: '수락', color: 'primary', onClick: onAccept },
      { key: 'reject', text: '거절', color: 'danger', onClick: onReject }
    ]}
  >
    <Card 
      className="order-card"
      onClick={onViewDetail}
    >
      <div className="order-header">
        <Tag color={getStatusColor(order.status)}>
          {getStatusText(order.status)}
        </Tag>
        <Text type="secondary">
          {formatDateTime(order.createdAt)}
        </Text>
      </div>
      
      <div className="order-content">
        <Text strong>{order.serviceItem.name}</Text>
        <Text type="secondary">{order.customer.user.name}</Text>
        <Text>{order.address}</Text>
      </div>
      
      <div className="order-footer">
        <Text strong style={{ fontSize: 16, color: colors.primary[500] }}>
          {formatCurrency(order.totalAmount)}
        </Text>
        <Text type="secondary">
          {formatDate(order.scheduledAt)}
        </Text>
      </div>
    </Card>
  </SwipeAction>
);
```

**3. 빠른 액션 버튼**
```typescript
// components/expert/QuickActions.tsx
const QuickActions: React.FC = () => (
  <Card className="quick-actions">
    <Row gutter={[8, 8]}>
      <Col span={12}>
        <Button
          type="primary"
          size="large"
          icon={<CheckOutlined />}
          block
          onClick={handleCompleteService}
        >
          서비스 완료
        </Button>
      </Col>
      <Col span={12}>
        <Button
          size="large"
          icon={<PhoneOutlined />}
          block
          onClick={handleCallCustomer}
        >
          고객 연락
        </Button>
      </Col>
    </Row>
  </Card>
);
```

---

## 고객 마켓플레이스 디자인 가이드

### 🛍️ 쇼핑몰 스타일 디자인

#### 홈페이지 레이아웃
```typescript
// components/customer/HomePage.tsx
const HomePage: React.FC = () => (
  <div className="customer-home">
    {/* 검색 바 */}
    <div className="search-section">
      <SearchBar 
        placeholder="어떤 서비스를 찾으세요?"
        onSearch={handleSearch}
      />
    </div>
    
    {/* 카테고리 그리드 */}
    <section className="category-section">
      <Title level={4}>서비스 카테고리</Title>
      <Grid columns={4} gap={8}>
        {categories.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </Grid>
    </section>
    
    {/* 추천 전문가 */}
    <section className="featured-experts">
      <Title level={4}>추천 전문가</Title>
      <Carousel>
        {experts.map(expert => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </Carousel>
    </section>
    
    {/* 인기 서비스 */}
    <section className="popular-services">
      <Title level={4}>인기 서비스</Title>
      <List>
        {services.map(service => (
          <ServiceListItem key={service.id} service={service} />
        ))}
      </List>
    </section>
  </div>
);
```

#### 서비스 필터링 패턴
```typescript
// components/customer/ServiceFilter.tsx
interface ServiceFilterProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
}

const ServiceFilter: React.FC<ServiceFilterProps> = ({
  filters,
  onFiltersChange
}) => (
  <Collapse defaultActiveKey={['price']}>
    <Collapse.Panel header="가격대" key="price">
      <Slider
        range
        min={0}
        max={500000}
        step={10000}
        value={[filters.minPrice, filters.maxPrice]}
        onChange={(value) => 
          onFiltersChange({
            ...filters,
            minPrice: value[0],
            maxPrice: value[1]
          })
        }
        formatTooltip={(value) => `${formatCurrency(value)}`}
      />
    </Collapse.Panel>
    
    <Collapse.Panel header="지역" key="region">
      <CheckboxGroup
        options={regionOptions}
        value={filters.regions}
        onChange={(regions) => 
          onFiltersChange({ ...filters, regions })
        }
      />
    </Collapse.Panel>
    
    <Collapse.Panel header="평점" key="rating">
      <Rate
        value={filters.minRating}
        onChange={(minRating) => 
          onFiltersChange({ ...filters, minRating })
        }
      />
    </Collapse.Panel>
  </Collapse>
);
```

#### 주문 플로우 디자인
```typescript
// 1. 서비스 선택
// components/customer/ServiceSelector.tsx

// 2. 일정 선택  
// components/customer/DateTimeSelector.tsx

// 3. 주소 입력
// components/customer/AddressForm.tsx

// 4. 결제
// components/customer/PaymentForm.tsx

// 5. 주문 완료
// components/customer/OrderConfirmation.tsx
```

---

## 공통 컴포넌트 라이브러리

### 🔧 재사용 컴포넌트

#### 1. 로딩 상태
```typescript
// components/common/LoadingStates.tsx

// 스켈레톤 로딩
export const CardSkeleton: React.FC = () => (
  <Card loading>
    <Skeleton active />
  </Card>
);

// 전체 페이지 로딩
export const PageLoading: React.FC = () => (
  <div className="page-loading">
    <Spin size="large" tip="로딩 중..." />
  </div>
);

// 리스트 로딩
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }, (_, i) => (
      <Card key={i} style={{ marginBottom: 8 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    ))}
  </div>
);
```

#### 2. 빈 상태
```typescript
// components/common/EmptyStates.tsx
interface EmptyStateProps {
  image?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  image = '/images/empty.svg',
  title,
  description,
  action
}) => (
  <Empty
    image={image}
    description={
      <div>
        <Title level={4}>{title}</Title>
        {description && <Text type="secondary">{description}</Text>}
      </div>
    }
  >
    {action}
  </Empty>
);
```

#### 3. 모달/드로어 패턴
```typescript
// components/common/DetailModal.tsx
interface DetailModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T | null;
  loading?: boolean;
  children: (data: T) => ReactNode;
}

export const DetailModal = <T,>({
  visible,
  onClose,
  title,
  data,
  loading,
  children
}: DetailModalProps<T>) => (
  <Modal
    title={title}
    open={visible}
    onCancel={onClose}
    footer={null}
    width={800}
  >
    {loading ? (
      <Skeleton active />
    ) : data ? (
      children(data)
    ) : (
      <EmptyState title="데이터를 불러올 수 없습니다" />
    )}
  </Modal>
);
```

#### 4. 폼 컴포넌트
```typescript
// components/forms/FormItems.tsx

// 전화번호 입력
export const PhoneInput: React.FC<FormItemProps> = (props) => (
  <Form.Item {...props}>
    <Input
      addonBefore="+82"
      placeholder="01012345678"
      maxLength={11}
    />
  </Form.Item>
);

// 주소 입력 (Kakao 주소 API)
export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange
}) => (
  <div className="address-input">
    <Input.Group compact>
      <Input
        style={{ width: '70%' }}
        value={value?.address}
        placeholder="주소를 검색하세요"
        readOnly
      />
      <Button
        style={{ width: '30%' }}
        onClick={() => openAddressModal()}
      >
        주소 검색
      </Button>
    </Input.Group>
    <Input
      style={{ marginTop: 8 }}
      value={value?.detail}
      onChange={(e) => onChange?.({ ...value, detail: e.target.value })}
      placeholder="상세 주소를 입력하세요"
    />
  </div>
);
```

---

## API 연동 패턴

### 🔌 API 서비스 구조

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,
});

// 인증 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 토큰 갱신 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 갱신 로직
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refreshToken
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          return api.request(error.config);
        } catch {
          // 갱신 실패 시 로그아웃
          localStorage.clear();
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 📊 React Query 패턴

```typescript
// hooks/api/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// 주문 목록 조회
export const useOrders = (filters: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: filters });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 주문 상태 변경
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      message.success('주문 상태가 변경되었습니다');
    },
    onError: (error) => {
      message.error('상태 변경에 실패했습니다');
    }
  });
};
```

### 🔄 실시간 데이터 (WebSocket)

```typescript
// hooks/useWebSocket.ts
export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const ws = new WebSocket(`${url}?token=${token}`);
    
    ws.onopen = () => {
      setConnected(true);
      setSocket(ws);
    };
    
    ws.onclose = () => {
      setConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, connected]);

  return { socket, connected, sendMessage };
};

// 실시간 알림
export const useNotifications = () => {
  const { socket } = useWebSocket('ws://localhost:4000/api/v1/notifications/ws');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev]);
        
        // 토스트 알림 표시
        notification('info', {
          message: notification.title,
          description: notification.message,
          duration: 4.5,
        });
      };
    }
  }, [socket]);

  return notifications;
};
```

---

## 성능 최적화 가이드

### ⚡ React 최적화

```typescript
// 1. 메모이제이션
const ExpensiveComponent = React.memo(({ data, onAction }) => {
  const expensiveValue = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0);
  }, [data]);

  const handleAction = useCallback(() => {
    onAction();
  }, [onAction]);

  return <div>{/* 컴포넌트 내용 */}</div>;
});

// 2. 가상화 (대용량 리스트)
import { FixedSizeList } from 'react-window';

const VirtualizedList: React.FC<{ items: any[] }> = ({ items }) => (
  <FixedSizeList
    height={400}
    itemCount={items.length}
    itemSize={60}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <ListItem item={data[index]} />
      </div>
    )}
  </FixedSizeList>
);

// 3. 코드 스플리팅
const LazyDashboard = React.lazy(() => import('../pages/Dashboard'));
const LazyOrders = React.lazy(() => import('../pages/Orders'));

const App: React.FC = () => (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/dashboard" element={<LazyDashboard />} />
      <Route path="/orders" element={<LazyOrders />} />
    </Routes>
  </Suspense>
);
```

### 🖼️ 이미지 최적화

```typescript
// components/common/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="optimized-image" style={{ width, height }}>
      {!loaded && !error && (
        <Skeleton.Image style={{ width, height }} />
      )}
      
      <img
        src={src}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          display: loaded ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      {error && (
        <div className="image-error">
          <FileImageOutlined />
          <Text type="secondary">이미지를 불러올 수 없습니다</Text>
        </div>
      )}
    </div>
  );
};
```

## 🎨 마무리

이 가이드를 활용하여:

1. **일관된 디자인 언어** 구현
2. **사용자 경험 최적화** 
3. **개발 효율성 향상**
4. **유지보수 용이성** 확보

모든 에이전트는 이 가이드를 준수하여 통합된 사용자 경험을 제공해야 합니다. 🚀