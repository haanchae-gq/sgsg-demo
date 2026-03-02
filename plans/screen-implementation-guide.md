# SGSG 화면별 구현 가이드

**문서 버전**: 1.0  
**작성일**: 2024-03-01  
**대상**: 프론트엔드 구현 에이전트  
**목적**: 각 화면의 상세한 구현 명세 및 사용자 플로우 제공

---

## 📋 목차

1. [관리자 대시보드 화면 구현](#관리자-대시보드-화면-구현)
2. [전문가 모바일 앱 화면 구현](#전문가-모바일-앱-화면-구현)
3. [고객 마켓플레이스 화면 구현](#고객-마켓플레이스-화면-구현)
4. [공통 컴포넌트 구현](#공통-컴포넌트-구현)
5. [상태 관리 패턴](#상태-관리-패턴)

---

## 관리자 대시보드 화면 구현

### 🏠 1. 메인 대시보드 (`/dashboard`)

#### 레이아웃 구조
```typescript
// pages/Dashboard.tsx
const Dashboard: React.FC = () => {
  const { data: metrics, loading } = useQuery(['dashboard-metrics'], fetchDashboardMetrics);
  
  return (
    <div className="dashboard">
      {/* 지표 카드 섹션 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <MetricCard
            title="총 주문"
            value={metrics?.totalOrders || 0}
            trend={metrics?.ordersTrend}
            icon={<ShoppingCartOutlined />}
            color="primary"
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="총 매출"
            value={formatCurrency(metrics?.totalRevenue || 0)}
            trend={metrics?.revenueTrend}
            icon={<DollarOutlined />}
            color="success"
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="활성 고객"
            value={metrics?.activeCustomers || 0}
            trend={metrics?.customersTrend}
            icon={<UserOutlined />}
            color="info"
          />
        </Col>
        <Col span={6}>
          <MetricCard
            title="전문가 수"
            value={metrics?.totalExperts || 0}
            trend={metrics?.expertsTrend}
            icon={<TeamOutlined />}
            color="warning"
          />
        </Col>
      </Row>

      {/* 차트 섹션 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <ChartContainer title="매출 트렌드" loading={loading}>
            <RevenueChart data={metrics?.revenueChart} />
          </ChartContainer>
        </Col>
        <Col span={8}>
          <ChartContainer title="주문 상태 분포" loading={loading}>
            <OrderStatusChart data={metrics?.orderStatusDistribution} />
          </ChartContainer>
        </Col>
      </Row>

      {/* 최근 활동 섹션 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="최근 주문">
            <List
              dataSource={metrics?.recentOrders}
              renderItem={(order) => (
                <List.Item>
                  <RecentOrderItem order={order} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="대기 중인 리뷰">
            <List
              dataSource={metrics?.pendingReviews}
              renderItem={(review) => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => viewReview(review.id)}>
                      검토
                    </Button>
                  ]}
                >
                  <PendingReviewItem review={review} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

#### 실시간 알림 구현
```typescript
// hooks/useRealtimeNotifications.ts
export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000/api/v1/notifications/ws?token=' + getAccessToken());
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      
      // UI 알림 표시
      notification('info', {
        message: notification.title,
        description: notification.message,
        placement: 'topRight',
        duration: 4.5,
      });
      
      // 상태 업데이트
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    };
    
    return () => ws.close();
  }, []);
  
  return notifications;
};
```

### 👥 2. 사용자 관리 화면

#### 고객 관리 (`/users/customers`)
```typescript
// pages/users/Customers.tsx
const Customers: React.FC = () => {
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
    status: undefined,
    search: '',
    dateRange: [dayjs().subtract(30, 'days'), dayjs()]
  });
  
  const { data, loading } = useQuery(
    ['customers', filters],
    () => fetchCustomers(filters)
  );
  
  const columns: ColumnsType<Customer> = [
    {
      title: '고객 정보',
      key: 'customer',
      width: 300,
      render: (_, record) => (
        <div className="customer-info">
          <Avatar src={record.user.avatarUrl} size={40}>
            {record.user.name[0]}
          </Avatar>
          <div style={{ marginLeft: 12 }}>
            <Text strong>{record.user.name}</Text>
            <br />
            <Text type="secondary" copyable>{record.user.email}</Text>
            <br />
            <Text type="secondary" copyable>{record.user.phone}</Text>
          </div>
        </div>
      )
    },
    {
      title: '가입일',
      dataIndex: ['user', 'createdAt'],
      width: 120,
      render: (date) => formatDate(date)
    },
    {
      title: '주문 건수',
      dataIndex: 'totalOrders',
      width: 100,
      align: 'center'
    },
    {
      title: '총 결제 금액',
      dataIndex: 'totalSpent',
      width: 120,
      align: 'right',
      render: (amount) => formatCurrency(amount)
    },
    {
      title: '상태',
      dataIndex: ['user', 'status'],
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '액션',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            onClick={() => viewCustomerDetail(record.id)}
          >
            상세
          </Button>
          <Button 
            size="small" 
            type="primary"
            onClick={() => viewCustomerOrders(record.id)}
          >
            주문내역
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'suspend', label: '계정 정지' },
                { key: 'activate', label: '계정 활성화' },
                { key: 'delete', label: '계정 삭제', danger: true }
              ],
              onClick: ({ key }) => handleCustomerAction(record.id, key)
            }}
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <PageContainer title="고객 관리">
      {/* 필터 섹션 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input.Search
              placeholder="이름, 이메일, 전화번호로 검색"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={() => setFilters(prev => ({ ...prev, page: 1 }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="상태"
              value={filters.status}
              onChange={(status) => setFilters(prev => ({ ...prev, status, page: 1 }))}
              style={{ width: '100%' }}
            >
              <Select.Option value="">전체</Select.Option>
              <Select.Option value="active">활성</Select.Option>
              <Select.Option value="inactive">비활성</Select.Option>
              <Select.Option value="suspended">정지</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col span={4}>
            <Button type="primary" icon={<ExportOutlined />}>
              엑셀 다운로드
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 데이터 테이블 */}
      <DataTable
        data={data?.customers || []}
        columns={columns}
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: data?.pagination.total,
          onChange: (page, pageSize) => setFilters(prev => ({ 
            ...prev, 
            page, 
            limit: pageSize 
          }))
        }}
      />
    </PageContainer>
  );
};
```

### 📦 3. 주문 관리 화면 (`/orders`)

#### 주문 목록과 상태 관리
```typescript
// pages/orders/Orders.tsx
const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const { data, loading } = useQuery(
    ['orders', activeTab],
    () => fetchOrders({ status: activeTab })
  );

  const tabItems = [
    { key: 'pending', label: '대기 중', count: data?.statusCounts.pending },
    { key: 'confirmed', label: '확정됨', count: data?.statusCounts.confirmed },
    { key: 'in_progress', label: '진행 중', count: data?.statusCounts.inProgress },
    { key: 'completed', label: '완료', count: data?.statusCounts.completed },
    { key: 'cancelled', label: '취소됨', count: data?.statusCounts.cancelled }
  ];

  const handleBulkAction = (action: string) => {
    Modal.confirm({
      title: `선택한 ${selectedOrders.length}개 주문을 ${action}하시겠습니까?`,
      onOk: async () => {
        await bulkUpdateOrders(selectedOrders, action);
        setSelectedOrders([]);
        // 데이터 새로고침
      }
    });
  };

  const columns: ColumnsType<Order> = [
    {
      title: '주문 정보',
      key: 'order',
      width: 300,
      render: (_, record) => (
        <div className="order-info">
          <div className="order-header">
            <Text strong>{record.orderNumber}</Text>
            <Tag color={getOrderStatusColor(record.status)}>
              {getOrderStatusText(record.status)}
            </Tag>
          </div>
          <Text>{record.serviceItem.name}</Text>
          <br />
          <Text type="secondary">
            {formatDateTime(record.createdAt)}
          </Text>
        </div>
      )
    },
    {
      title: '고객',
      key: 'customer',
      width: 200,
      render: (_, record) => (
        <CustomerInfo customer={record.customer} />
      )
    },
    {
      title: '전문가',
      key: 'expert',
      width: 200,
      render: (_, record) => (
        record.expert ? (
          <ExpertInfo expert={record.expert} />
        ) : (
          <Text type="secondary">배정 대기</Text>
        )
      )
    },
    {
      title: '금액',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div>
          <Text strong>{formatCurrency(record.totalAmount)}</Text>
          <br />
          <PaymentStatusBadge status={record.paymentStatus} />
        </div>
      )
    },
    {
      title: '일정',
      dataIndex: 'scheduledAt',
      width: 150,
      render: (date) => date ? formatDateTime(date) : '-'
    },
    {
      title: '액션',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <OrderActionButtons order={record} />
      )
    }
  ];

  return (
    <PageContainer 
      title="주문 관리"
      extra={[
        <Button key="export" icon={<ExportOutlined />}>
          대량 다운로드
        </Button>
      ]}
    >
      <Card>
        {/* 탭 네비게이션 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems.map(tab => ({
            ...tab,
            label: (
              <span>
                {tab.label}
                {tab.count > 0 && (
                  <Badge count={tab.count} style={{ marginLeft: 8 }} />
                )}
              </span>
            )
          }))}
        />

        {/* 일괄 액션 바 */}
        {selectedOrders.length > 0 && (
          <Alert
            message={`${selectedOrders.length}개 주문이 선택되었습니다`}
            action={
              <Space>
                <Button size="small" onClick={() => handleBulkAction('confirm')}>
                  일괄 확정
                </Button>
                <Button size="small" onClick={() => handleBulkAction('cancel')}>
                  일괄 취소
                </Button>
                <Button size="small" onClick={() => setSelectedOrders([])}>
                  선택 해제
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 주문 테이블 */}
        <Table
          rowSelection={{
            selectedRowKeys: selectedOrders,
            onChange: setSelectedOrders,
            getCheckboxProps: (record) => ({
              disabled: !['pending', 'confirmed'].includes(record.status)
            })
          }}
          columns={columns}
          dataSource={data?.orders}
          loading={loading}
          rowKey="id"
          size="middle"
        />
      </Card>
    </PageContainer>
  );
};
```

---

## 전문가 모바일 앱 화면 구현

### 📱 1. 주문 대시보드 (`/orders`)

#### 모바일 최적화 주문 목록
```typescript
// screens/orders/Dashboard.tsx
const OrdersDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'progress' | 'completed'>('new');
  const { data: orders, loading } = useQuery(['expert-orders', activeTab], fetchExpertOrders);
  const notifications = useRealtimeNotifications();

  const tabItems = [
    { 
      key: 'new', 
      title: '새 주문',
      badge: orders?.newCount || 0
    },
    { 
      key: 'progress', 
      title: '진행 중',
      badge: orders?.progressCount || 0
    },
    { 
      key: 'completed', 
      title: '완료',
      badge: 0
    }
  ];

  return (
    <div className="orders-dashboard">
      {/* 상단 헤더 */}
      <NavBar 
        right={
          <Badge count={notifications.length}>
            <BellOutlined />
          </Badge>
        }
      >
        주문 관리
      </NavBar>

      {/* 탭 네비게이션 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
      >
        {tabItems.map(tab => (
          <Tabs.TabPane
            key={tab.key}
            tab={
              <Badge count={tab.badge} size="small">
                {tab.title}
              </Badge>
            }
          />
        ))}
      </Tabs>

      {/* 주문 리스트 */}
      <PullToRefresh onRefresh={async () => { /* 새로고침 로직 */ }}>
        <div className="orders-list">
          {loading ? (
            <OrderListSkeleton />
          ) : (
            <InfiniteScroll
              dataLength={orders?.list.length || 0}
              next={loadMoreOrders}
              hasMore={orders?.hasMore || false}
              loader={<Loading />}
            >
              {orders?.list.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showActions={activeTab === 'new'}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onReject={() => handleRejectOrder(order.id)}
                  onViewDetail={() => navigation.push(`/orders/${order.id}`)}
                />
              ))}
            </InfiniteScroll>
          )}
        </div>
      </PullToRefresh>

      {/* 빠른 액션 버튼 */}
      {activeTab === 'progress' && (
        <FloatingActionButton
          icon={<CheckOutlined />}
          text="서비스 완료"
          onClick={() => navigation.push('/orders/complete')}
        />
      )}
    </div>
  );
};
```

#### 주문 카드 컴포넌트 (스와이프 액션)
```typescript
// components/expert/OrderCard.tsx
const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showActions,
  onAccept,
  onReject,
  onViewDetail
}) => {
  const rightActions = showActions ? [
    {
      key: 'accept',
      text: '수락',
      color: 'success',
      onClick: onAccept
    },
    {
      key: 'reject', 
      text: '거절',
      color: 'danger',
      onClick: onReject
    }
  ] : [];

  return (
    <SwipeAction rightActions={rightActions}>
      <Card 
        className="order-card"
        onClick={onViewDetail}
        size="small"
      >
        {/* 주문 헤더 */}
        <div className="order-header">
          <div className="order-status">
            <Tag color={getOrderStatusColor(order.status)}>
              {getOrderStatusText(order.status)}
            </Tag>
            {order.urgency === 'urgent' && (
              <Tag color="red" icon={<UrgentOutlined />}>
                긴급
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatRelativeTime(order.createdAt)}
          </Text>
        </div>

        {/* 서비스 정보 */}
        <div className="service-info">
          <Text strong style={{ fontSize: 16 }}>
            {order.serviceItem.name}
          </Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 14 }}>
            {order.customer.user.name} 고객
          </Text>
        </div>

        {/* 주소 정보 */}
        <div className="address-info">
          <EnvironmentOutlined style={{ marginRight: 4, color: '#666' }} />
          <Text style={{ fontSize: 14 }}>
            {formatShortAddress(order.address)}
          </Text>
        </div>

        {/* 일정 및 금액 */}
        <div className="order-footer">
          <div className="schedule">
            <ClockCircleOutlined style={{ marginRight: 4, color: '#666' }} />
            <Text style={{ fontSize: 14 }}>
              {order.scheduledAt ? 
                formatDate(order.scheduledAt) : 
                '일정 대기'
              }
            </Text>
          </div>
          <Text strong style={{ fontSize: 16, color: colors.primary[500] }}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </div>

        {/* 진행 상황 표시 */}
        {order.status === 'in_progress' && (
          <Progress 
            percent={getOrderProgress(order)} 
            size="small"
            style={{ marginTop: 8 }}
          />
        )}
      </Card>
    </SwipeAction>
  );
};
```

### 💰 2. 정산 관리 (`/earnings`)

#### 수익 대시보드
```typescript
// screens/earnings/Dashboard.tsx
const EarningsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: earnings, loading } = useQuery(
    ['earnings', period],
    () => fetchEarnings({ period })
  );

  return (
    <div className="earnings-dashboard">
      <NavBar>정산 관리</NavBar>

      {/* 기간 선택 */}
      <div className="period-selector">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { label: '주간', value: 'week' },
            { label: '월간', value: 'month' },
            { label: '연간', value: 'year' }
          ]}
        />
      </div>

      {/* 수익 요약 카드 */}
      <div className="earnings-summary">
        <Grid columns={2} gap={8}>
          <Grid.Item>
            <Card size="small">
              <Statistic
                title="총 수익"
                value={earnings?.totalEarnings || 0}
                formatter={(value) => formatCurrency(value)}
                valueStyle={{ color: colors.success[500] }}
              />
            </Card>
          </Grid.Item>
          <Grid.Item>
            <Card size="small">
              <Statistic
                title="완료 주문"
                value={earnings?.completedOrders || 0}
                suffix="건"
              />
            </Card>
          </Grid.Item>
        </Grid>
      </div>

      {/* 수익 차트 */}
      <Card title="수익 트렌드" size="small" style={{ margin: '16px 12px' }}>
        <div style={{ height: 200 }}>
          <EarningsChart data={earnings?.chartData} loading={loading} />
        </div>
      </Card>

      {/* 정산 내역 */}
      <div className="settlement-history">
        <List
          header={<div style={{ padding: '0 12px', fontWeight: 'bold' }}>정산 내역</div>}
          dataSource={earnings?.settlements}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => downloadStatement(item.id)}
                >
                  명세서
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>{item.period}</Text>
                    <Text strong>{formatCurrency(item.amount)}</Text>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary">
                      {formatDate(item.settledAt)} • {item.orderCount}건
                    </Text>
                    <br />
                    <Tag color={item.status === 'completed' ? 'green' : 'orange'}>
                      {item.status === 'completed' ? '정산 완료' : '정산 중'}
                    </Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
```

---

## 고객 마켓플레이스 화면 구현

### 🏠 1. 홈페이지 (`/`)

#### 서비스 발견 최적화 홈페이지
```typescript
// screens/Home.tsx
const HomePage: React.FC = () => {
  const { data: homeData, loading } = useQuery(['homepage'], fetchHomepageData);

  return (
    <div className="home-page">
      {/* 검색 헤더 */}
      <div className="search-header">
        <div className="search-container">
          <SearchBar
            placeholder="어떤 서비스가 필요하세요?"
            onSearch={handleSearch}
            showVoiceSearch
            showLocation
          />
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 카테고리 그리드 */}
        <section className="category-section">
          <div className="section-header">
            <Text strong style={{ fontSize: 16 }}>인기 서비스</Text>
            <Button type="link" onClick={() => navigation.push('/categories')}>
              전체보기
            </Button>
          </div>
          <Grid columns={4} gap={12}>
            {homeData?.categories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category}
                onClick={() => navigation.push(`/services?category=${category.id}`)}
              />
            ))}
          </Grid>
        </section>

        {/* 추천 전문가 */}
        <section className="featured-experts">
          <div className="section-header">
            <Text strong style={{ fontSize: 16 }}>추천 전문가</Text>
            <Button type="link" onClick={() => navigation.push('/experts')}>
              더보기
            </Button>
          </div>
          <div className="experts-carousel">
            <Swiper
              spaceBetween={12}
              slidesPerView={2.2}
              centeredSlides={false}
            >
              {homeData?.featuredExperts.map(expert => (
                <SwiperSlide key={expert.id}>
                  <ExpertCard 
                    expert={expert}
                    onClick={() => navigation.push(`/experts/${expert.id}`)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* 최근 리뷰 */}
        <section className="recent-reviews">
          <div className="section-header">
            <Text strong style={{ fontSize: 16 }}>최근 리뷰</Text>
          </div>
          <List
            dataSource={homeData?.recentReviews}
            renderItem={(review) => (
              <ReviewCard 
                review={review}
                compact
                onClick={() => navigation.push(`/reviews/${review.id}`)}
              />
            )}
          />
        </section>

        {/* 이벤트 배너 */}
        {homeData?.banners && (
          <section className="promotion-banners">
            <Carousel autoplay dots={false}>
              {homeData.banners.map(banner => (
                <div key={banner.id}>
                  <PromotionBanner 
                    banner={banner}
                    onClick={() => handleBannerClick(banner)}
                  />
                </div>
              ))}
            </Carousel>
          </section>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation activeTab="home" />
    </div>
  );
};
```

### 🛒 2. 서비스 목록 및 필터 (`/services`)

#### 고급 필터링과 검색
```typescript
// screens/services/ServiceList.tsx
const ServiceList: React.FC = () => {
  const [filters, setFilters] = useState<ServiceFilters>({
    categoryId: '',
    priceRange: [0, 500000],
    location: '',
    rating: 0,
    sortBy: 'popularity'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: services, loading, hasMore } = useInfiniteQuery(
    ['services', filters],
    ({ pageParam = 1 }) => fetchServices({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined
    }
  );

  return (
    <div className="service-list">
      {/* 상단 헤더 */}
      <NavBar
        back
        left={<ArrowLeftOutlined />}
        right={
          <Space>
            <Badge dot={hasActiveFilters(filters)}>
              <Button 
                type="text"
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(true)}
              />
            </Badge>
            <Button 
              type="text"
              icon={<SearchOutlined />}
              onClick={() => setShowSearch(true)}
            />
          </Space>
        }
      >
        서비스 찾기
      </NavBar>

      {/* 정렬 옵션 */}
      <div className="sort-options">
        <Dropdown
          menu={{
            items: [
              { key: 'popularity', label: '인기순' },
              { key: 'price_low', label: '가격 낮은순' },
              { key: 'price_high', label: '가격 높은순' },
              { key: 'rating', label: '평점순' },
              { key: 'recent', label: '최신순' }
            ],
            onClick: ({ key }) => setFilters(prev => ({ ...prev, sortBy: key }))
          }}
        >
          <Button type="text" size="small">
            {getSortLabel(filters.sortBy)} <DownOutlined />
          </Button>
        </Dropdown>
      </div>

      {/* 서비스 목록 */}
      <PullToRefresh onRefresh={refreshServices}>
        <div className="services-grid">
          <InfiniteScroll
            dataLength={services?.pages.flatMap(page => page.services).length || 0}
            next={fetchNextPage}
            hasMore={hasMore}
            loader={<ServiceCardSkeleton />}
          >
            <Grid columns={2} gap={8}>
              {services?.pages.flatMap(page => page.services).map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => navigation.push(`/services/${service.id}`)}
                />
              ))}
            </Grid>
          </InfiniteScroll>
        </div>
      </PullToRefresh>

      {/* 필터 서랍 */}
      <Drawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="필터"
        placement="bottom"
        height="70%"
      >
        <ServiceFilters
          filters={filters}
          onChange={setFilters}
          onApply={() => setShowFilters(false)}
          onReset={() => {
            setFilters(defaultFilters);
            setShowFilters(false);
          }}
        />
      </Drawer>
    </div>
  );
};
```

### 📝 3. 주문 생성 플로우

#### 다단계 주문 폼
```typescript
// screens/order/CreateOrder.tsx
const CreateOrder: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<Partial<OrderCreateRequest>>({});
  const { serviceId } = useParams();

  const steps = [
    { title: '서비스 확인', component: ServiceConfirmation },
    { title: '일정 선택', component: DateTimeSelection },
    { title: '주소 입력', component: AddressInput },
    { title: '요구사항', component: Requirements },
    { title: '결제', component: PaymentMethod }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateOrderData = (data: Partial<OrderCreateRequest>) => {
    setOrderData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="create-order">
      {/* 상단 헤더 */}
      <NavBar
        back
        left={currentStep > 0 ? undefined : <ArrowLeftOutlined />}
        onBack={currentStep > 0 ? prevStep : () => navigation.goBack()}
      >
        주문하기 ({currentStep + 1}/{steps.length})
      </NavBar>

      {/* 진행 상황 표시 */}
      <div className="progress-container">
        <Steps
          direction="horizontal"
          size="small"
          current={currentStep}
          items={steps.map(step => ({ title: step.title }))}
        />
      </div>

      {/* 단계별 컨텐츠 */}
      <div className="step-content">
        {React.createElement(steps[currentStep].component, {
          data: orderData,
          onChange: updateOrderData,
          onNext: nextStep,
          onPrev: prevStep,
          isLastStep: currentStep === steps.length - 1
        })}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="bottom-actions">
        <Row gutter={8}>
          {currentStep > 0 && (
            <Col span={8}>
              <Button block onClick={prevStep}>
                이전
              </Button>
            </Col>
          )}
          <Col span={currentStep > 0 ? 16 : 24}>
            <Button 
              type="primary" 
              block
              onClick={currentStep === steps.length - 1 ? submitOrder : nextStep}
              disabled={!isStepValid(currentStep, orderData)}
            >
              {currentStep === steps.length - 1 ? '주문 완료' : '다음'}
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};
```

---

## 공통 컴포넌트 구현

### 🔍 검색 컴포넌트

```typescript
// components/common/SearchBar.tsx
interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  showVoiceSearch?: boolean;
  showLocation?: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "검색어를 입력하세요",
  onSearch,
  showVoiceSearch = false,
  showLocation = false,
  autoFocus = false
}) => {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setValue(transcript);
        onSearch(transcript);
      };
      recognition.start();
    }
  };

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 위치 기반 검색 로직
        },
        (error) => {
          message.error('위치 정보를 가져올 수 없습니다');
        }
      );
    }
  };

  return (
    <div className="search-bar">
      <Input.Search
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSearch={onSearch}
        placeholder={placeholder}
        autoFocus={autoFocus}
        suffix={
          <Space>
            {showVoiceSearch && (
              <Button
                type="text"
                size="small"
                icon={<AudioOutlined style={{ color: isListening ? 'red' : undefined }} />}
                onClick={handleVoiceSearch}
              />
            )}
            {showLocation && (
              <Button
                type="text"
                size="small"
                icon={<EnvironmentOutlined />}
                onClick={handleLocationSearch}
              />
            )}
          </Space>
        }
      />
    </div>
  );
};
```

### 📊 차트 컴포넌트

```typescript
// components/charts/RevenueChart.tsx
interface RevenueChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  loading = false,
  height = 300
}) => {
  if (loading) {
    return <Skeleton active />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => formatDate(value, 'MM/DD')}
        />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip 
          labelFormatter={(value) => formatDate(value)}
          formatter={(value) => [formatCurrency(value), '매출']}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke={colors.primary[500]}
          strokeWidth={2}
          dot={{ fill: colors.primary[500] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

---

## 상태 관리 패턴

### 🔄 Zustand 스토어 구조

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, tokens } = response.data.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      set({ user, isAuthenticated: true, loading: false });
    } catch (error) {
      handleApiError(error);
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      get().logout();
      return;
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
    } catch (error) {
      get().logout();
    }
  }
}));
```

이 상세한 구현 가이드를 활용하여 각 에이전트가 일관되고 고품질의 사용자 인터페이스를 구현할 수 있습니다. 🚀