import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Tabs,
  Card,
  Space,
  Button,
  Tag,
  Image,
  PullToRefresh,
  InfiniteScroll,
  Empty,
  TabBar,
  Badge
} from 'antd-mobile';
import {
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MessageOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Order } from '../../types';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [activeBottomTab, setActiveBottomTab] = useState('orders');

  // 주문 목록 조회 (무한 스크롤)
  const {
    data: ordersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['orders', activeTab],
    queryFn: async ({ pageParam = 1 }) => {
      // 임시 데이터 (실제 구현에서는 API 호출)
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-20240301-001',
          serviceItemId: 'item1',
          serviceItem: {
            id: 'item1',
            categoryId: 'cat1',
            category: { id: 'cat1', name: '청소 서비스', description: '', icon: '', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
            name: '정기 청소',
            description: '주1회 정기적인 청소 서비스',
            basePrice: 150000,
            estimatedDuration: 180,
            isActive: true,
            tags: ['정기', '청소'],
            createdAt: '',
            updatedAt: ''
          },
          expert: {
            id: 'exp1',
            userId: 'user1',
            businessName: '깔끔한 청소 서비스',
            description: '',
            rating: 4.8,
            reviewCount: 342,
            completedOrderCount: 1250,
            isVerified: true,
            status: 'active',
            createdAt: '',
            updatedAt: ''
          },
          customerId: 'customer1',
          expertId: 'exp1',
          addressId: 'addr1',
          requestedDate: dayjs().add(2, 'day').format(),
          scheduledDate: dayjs().add(2, 'day').format(),
          status: 'confirmed',
          totalAmount: 150000,
          depositAmount: 30000,
          balanceAmount: 120000,
          customerNotes: '정기 청소 신청합니다',
          createdAt: dayjs().subtract(1, 'day').format(),
          updatedAt: dayjs().subtract(1, 'day').format()
        },
        {
          id: '2',
          orderNumber: 'ORD-20240228-002',
          serviceItemId: 'item2',
          serviceItem: {
            id: 'item2',
            categoryId: 'cat1',
            category: { id: 'cat1', name: '청소 서비스', description: '', icon: '', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
            name: '대청소',
            description: '꼼꼼한 대청소 서비스',
            basePrice: 280000,
            estimatedDuration: 300,
            isActive: true,
            tags: ['대청소'],
            createdAt: '',
            updatedAt: ''
          },
          expert: {
            id: 'exp2',
            userId: 'user2',
            businessName: '완벽청소',
            description: '',
            rating: 4.9,
            reviewCount: 156,
            completedOrderCount: 890,
            isVerified: true,
            status: 'active',
            createdAt: '',
            updatedAt: ''
          },
          customerId: 'customer1',
          expertId: 'exp2',
          addressId: 'addr1',
          requestedDate: dayjs().subtract(3, 'day').format(),
          scheduledDate: dayjs().subtract(3, 'day').format(),
          status: 'completed',
          totalAmount: 280000,
          depositAmount: 56000,
          balanceAmount: 224000,
          customerNotes: '대청소 부탁드립니다',
          completedAt: dayjs().subtract(3, 'day').format(),
          createdAt: dayjs().subtract(5, 'day').format(),
          updatedAt: dayjs().subtract(3, 'day').format()
        },
        {
          id: '3',
          orderNumber: 'ORD-20240215-003',
          serviceItemId: 'item1',
          serviceItem: {
            id: 'item1',
            categoryId: 'cat1',
            category: { id: 'cat1', name: '청소 서비스', description: '', icon: '', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
            name: '정기 청소',
            description: '주1회 정기적인 청소 서비스',
            basePrice: 150000,
            estimatedDuration: 180,
            isActive: true,
            tags: ['정기', '청소'],
            createdAt: '',
            updatedAt: ''
          },
          customerId: 'customer1',
          addressId: 'addr1',
          requestedDate: dayjs().subtract(10, 'day').format(),
          status: 'cancelled',
          totalAmount: 150000,
          depositAmount: 30000,
          balanceAmount: 120000,
          customerNotes: '일정 변경으로 취소',
          cancelledAt: dayjs().subtract(10, 'day').format(),
          createdAt: dayjs().subtract(12, 'day').format(),
          updatedAt: dayjs().subtract(10, 'day').format()
        }
      ];

      // 상태별 필터링
      let filteredOrders = mockOrders;
      if (activeTab === 'ongoing') {
        filteredOrders = mockOrders.filter(order => 
          ['pending', 'confirmed', 'expert_assigned', 'schedule_pending', 'scheduled', 'in_progress'].includes(order.status)
        );
      } else if (activeTab === 'completed') {
        filteredOrders = mockOrders.filter(order => order.status === 'completed');
      } else if (activeTab === 'cancelled') {
        filteredOrders = mockOrders.filter(order => order.status === 'cancelled');
      }

      return {
        data: filteredOrders,
        meta: {
          page: pageParam,
          totalPages: 1,
          totalCount: filteredOrders.length
        }
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const orders = ordersData?.pages.flatMap(page => page.data) || [];

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'orange',
      'confirmed': 'blue',
      'expert_assigned': 'cyan',
      'schedule_pending': 'geekblue', 
      'scheduled': 'green',
      'in_progress': 'green',
      'completed': 'default',
      'cancelled': 'red'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '대기 중',
      'confirmed': '확정됨',
      'expert_assigned': '전문가 배정',
      'schedule_pending': '일정 대기',
      'scheduled': '일정 확정',
      'in_progress': '진행 중',
      'completed': '완료',
      'cancelled': '취소됨'
    };
    return statusMap[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY.MM.DD HH:mm');
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleExpertContact = (phoneNumber?: string, type: 'call' | 'sms' = 'call') => {
    if (!phoneNumber) return;
    
    if (type === 'call') {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      window.location.href = `sms:${phoneNumber}`;
    }
  };

  const handleWriteReview = (orderId: string) => {
    navigate(`/reviews/write/${orderId}`);
  };

  const tabs = [
    { key: 'all', title: '전체' },
    { key: 'ongoing', title: '진행중' },
    { key: 'completed', title: '완료' },
    { key: 'cancelled', title: '취소/환불' }
  ];

  const bottomTabs = [
    {
      key: 'home',
      title: '홈',
      icon: <HomeOutlined />,
    },
    {
      key: 'services',
      title: '서비스',
      icon: <SearchOutlined />,
    },
    {
      key: 'orders',
      title: '주문',
      icon: <ShoppingCartOutlined />,
      badge: Badge.dot,
    },
    {
      key: 'profile',
      title: '내정보',
      icon: <UserOutlined />,
    },
  ];

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩중...</div>;
  }

  return (
    <div style={{ paddingBottom: '60px', minHeight: '100vh' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar>내 주문</NavBar>

      {/* 주문 상태별 탭 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ '--content-padding': '16px' }}
      >
        {tabs.map(tab => (
          <Tabs.Tab title={tab.title} key={tab.key}>
            <PullToRefresh onRefresh={refetch}>
              <div>
                {orders.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {orders.map((order) => (
                      <Card 
                        key={order.id}
                        style={{ 
                          border: '1px solid #f0f0f0',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          
                          {/* 주문 헤더 */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px'
                              }}>
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#8c8c8c',
                                  fontFamily: 'monospace'
                                }}>
                                  {order.orderNumber}
                                </span>
                                <Tag 
                                  color={getStatusColor(order.status)} 
                                  size="small"
                                  fill="solid"
                                >
                                  {getStatusText(order.status)}
                                </Tag>
                              </div>
                              
                              <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '16px', 
                                fontWeight: 600 
                              }}>
                                {order.serviceItem?.name}
                              </h4>
                              
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                marginBottom: '4px'
                              }}>
                                📅 {order.scheduledDate ? formatDate(order.scheduledDate) : '일정 미정'}
                              </div>
                              
                              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                💰 총 {formatPrice(order.totalAmount)}
                              </div>
                            </div>

                            <div style={{ fontSize: '11px', color: '#bfbfbf' }}>
                              {formatDate(order.createdAt)}
                            </div>
                          </div>

                          {/* 전문가 정보 (배정된 경우) */}
                          {order.expert && (
                            <div style={{ 
                              background: '#fafafa',
                              padding: '12px',
                              borderRadius: '8px'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#e6f7ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px'
                                }}>
                                  👨‍🔧
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 500,
                                    marginBottom: '4px'
                                  }}>
                                    {order.expert.businessName}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                    평점 {order.expert.rating?.toFixed(1)} ⭐ • 
                                    완료 {order.expert.completedOrderCount}회
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <Button 
                                    size="mini" 
                                    color="primary"
                                    icon={<PhoneOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExpertContact(order.expert?.user?.phone, 'call');
                                    }}
                                  />
                                  <Button 
                                    size="mini" 
                                    fill="outline"
                                    icon={<MessageOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExpertContact(order.expert?.user?.phone, 'sms');
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 주문 액션 버튼들 */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #f0f0f0'
                          }}>
                            
                            {/* 진행중 주문 액션 */}
                            {['confirmed', 'expert_assigned', 'schedule_pending', 'scheduled', 'in_progress'].includes(order.status) && (
                              <>
                                <Button 
                                  size="small" 
                                  fill="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(order.id);
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  <ClockCircleOutlined /> 진행상황
                                </Button>
                                
                                {order.status !== 'in_progress' && (
                                  <Button 
                                    size="small" 
                                    color="danger"
                                    fill="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: 주문 취소 처리
                                    }}
                                    style={{ flex: 1 }}
                                  >
                                    취소하기
                                  </Button>
                                )}
                              </>
                            )}

                            {/* 완료 주문 액션 */}
                            {order.status === 'completed' && (
                              <>
                                <Button 
                                  size="small" 
                                  fill="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(order.id);
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  주문상세
                                </Button>
                                
                                <Button 
                                  size="small" 
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWriteReview(order.id);
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  <StarOutlined /> 리뷰작성
                                </Button>
                                
                                <Button 
                                  size="small" 
                                  fill="outline"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: 재주문 처리
                                  }}
                                  style={{ flex: 1 }}
                                >
                                  재주문
                                </Button>
                              </>
                            )}

                            {/* 취소 주문 액션 */}
                            {order.status === 'cancelled' && (
                              <Button 
                                size="small" 
                                fill="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderClick(order.id);
                                }}
                                style={{ flex: 1 }}
                              >
                                상세보기
                              </Button>
                            )}

                          </div>

                        </Space>
                      </Card>
                    ))}

                    {/* 무한 스크롤 */}
                    <InfiniteScroll 
                      loadMore={fetchNextPage} 
                      hasMore={hasNextPage}
                    />
                    
                  </Space>
                ) : (
                  <Empty 
                    style={{ padding: '64px 32px' }}
                    imageStyle={{ width: 128 }}
                    description={
                      <Space direction="vertical" size="middle">
                        <div>
                          {activeTab === 'all' && '아직 주문 내역이 없어요'}
                          {activeTab === 'ongoing' && '진행중인 주문이 없어요'}
                          {activeTab === 'completed' && '완료된 주문이 없어요'}
                          {activeTab === 'cancelled' && '취소된 주문이 없어요'}
                        </div>
                        <Button 
                          color="primary"
                          onClick={() => navigate('/')}
                        >
                          서비스 둘러보기
                        </Button>
                      </Space>
                    }
                  />
                )}
              </div>
            </PullToRefresh>
          </Tabs.Tab>
        ))}
      </Tabs>

      {/* 하단 네비게이션 */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        zIndex: 100
      }}>
        <TabBar 
          activeKey={activeBottomTab} 
          onChange={(key) => {
            setActiveBottomTab(key);
            if (key !== 'orders') {
              navigate(`/${key === 'home' ? '' : key}`);
            }
          }}
          style={{ 
            background: 'white',
            borderTop: '1px solid #f0f0f0'
          }}
        >
          {bottomTabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>

    </div>
  );
};

export default MyOrders;