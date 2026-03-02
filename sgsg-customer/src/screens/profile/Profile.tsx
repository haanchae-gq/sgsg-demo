import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Space,
  Button,
  List,
  Avatar,
  Badge,
  Modal,
  Toast,
  TabBar,
  Divider,
  Switch,
  Input,
  Popup,
  Form,
  Rate
} from 'antd-mobile';
import {
  UserOutlined,
  EditOutlined,
  SettingOutlined,
  HeartOutlined,
  GiftOutlined,
  SecurityScanOutlined,
  QuestionCircleOutlined,
  PhoneOutlined,
  LogoutOutlined,
  RightOutlined,
  HomeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotions: true,
    reviews: true
  });

  // 사용자 통계 조회
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      // 임시 데이터
      return {
        totalOrders: 15,
        completedOrders: 12,
        totalAmount: 2340000,
        points: 5600,
        reviewsWritten: 8,
        favoriteExperts: 3,
        memberSince: '2024-01-15',
        nextLevel: 'VIP',
        pointsToNextLevel: 4400
      };
    },
    enabled: isAuthenticated
  });

  // 최근 주문 조회
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders', 3],
    queryFn: async () => {
      // 임시 데이터
      return [
        {
          id: '1',
          orderNumber: 'ORD-20240301-001',
          serviceItem: { name: '정기 청소' },
          status: 'completed',
          createdAt: dayjs().subtract(2, 'day').format()
        },
        {
          id: '2',
          orderNumber: 'ORD-20240228-002',
          serviceItem: { name: '대청소' },
          status: 'in_progress',
          createdAt: dayjs().subtract(1, 'week').format()
        },
        {
          id: '3',
          orderNumber: 'ORD-20240225-003',
          serviceItem: { name: '에어컨 청소' },
          status: 'completed',
          createdAt: dayjs().subtract(2, 'week').format()
        }
      ];
    },
    enabled: isAuthenticated
  });

  // 로그아웃
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      logout();
      Toast.show('로그아웃되었습니다');
      navigate('/');
    }
  });

  const handleLogout = () => {
    Modal.confirm({
      title: '로그아웃',
      content: '정말 로그아웃하시겠습니까?',
      onConfirm: () => {
        logoutMutation.mutate();
      }
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY.MM.DD');
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '대기 중',
      'confirmed': '확정됨',
      'expert_assigned': '전문가 배정',
      'in_progress': '진행 중',
      'completed': '완료',
      'cancelled': '취소됨'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'orange',
      'confirmed': 'blue',
      'in_progress': 'green',
      'completed': 'default',
      'cancelled': 'red'
    };
    return colorMap[status] || 'default';
  };

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

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>👤</div>
        <h2 style={{ marginBottom: '16px' }}>로그인이 필요합니다</h2>
        <p style={{ color: '#8c8c8c', marginBottom: '32px' }}>
          프로필 정보를 보려면 로그인해주세요
        </p>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button 
            color="primary" 
            size="large" 
            block
            onClick={() => navigate('/auth/login')}
          >
            로그인
          </Button>
          <Button 
            fill="outline" 
            size="large" 
            block
            onClick={() => navigate('/auth/register')}
          >
            회원가입
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px', minHeight: '100vh' }}>
      
      {/* 상단 네비게이션 */}
      <NavBar
        right={
          <Button
            fill="none"
            size="small"
            onClick={() => setEditModalVisible(true)}
          >
            <EditOutlined />
          </Button>
        }
      >
        내 정보
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          {/* 프로필 헤더 */}
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Avatar 
                  size={64}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '24px'
                  }}
                  icon={<UserOutlined />}
                />
                
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    color: 'white', 
                    margin: '0 0 8px 0',
                    fontSize: '20px'
                  }}>
                    {user?.name}님
                  </h2>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {userStats && `${formatDate(userStats.memberSince)} 가입`}
                  </div>
                </div>
              </div>

              {/* 회원 등급 & 포인트 */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '14px', opacity: 0.8 }}>등급</span>
                    <span style={{ fontSize: '16px', fontWeight: 600, marginLeft: '8px' }}>
                      일반회원
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', opacity: 0.8 }}>포인트</span>
                    <span style={{ fontSize: '16px', fontWeight: 600, marginLeft: '8px' }}>
                      {userStats ? formatNumber(userStats.points) : 0}P
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  VIP 등급까지 {userStats ? formatNumber(userStats.pointsToNextLevel) : 0}P 남음
                </div>
              </div>

            </Space>
          </Card>

          {/* 활동 통계 */}
          <Card 
            title="나의 활동"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
          >
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              textAlign: 'center'
            }}>
              <div onClick={() => navigate('/orders')}>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#2196F3',
                  marginBottom: '4px'
                }}>
                  {userStats?.totalOrders || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  총 주문
                </div>
              </div>
              
              <div onClick={() => navigate('/orders?tab=completed')}>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#52c41a',
                  marginBottom: '4px'
                }}>
                  {userStats?.completedOrders || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  완료
                </div>
              </div>
              
              <div onClick={() => navigate('/reviews')}>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#faad14',
                  marginBottom: '4px'
                }}>
                  {userStats?.reviewsWritten || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  리뷰
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 600,
                  color: '#ff7875',
                  marginBottom: '4px'
                }}>
                  {userStats?.favoriteExperts || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  즐겨찾기
                </div>
              </div>
            </div>
          </Card>

          {/* 최근 주문 */}
          <Card 
            title="최근 주문"
            style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
            extra={
              <Button
                fill="none"
                size="small"
                color="primary"
                onClick={() => navigate('/orders')}
              >
                전체보기
              </Button>
            }
          >
            {recentOrders && recentOrders.length > 0 ? (
              <List>
                {recentOrders.map((order) => (
                  <List.Item
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    extra={
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          color: getStatusColor(order.status) === 'default' ? '#8c8c8c' : '#2196F3',
                          fontSize: '12px'
                        }}>
                          {getStatusText(order.status)}
                        </div>
                      </div>
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                        {order.serviceItem.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#8c8c8c',
                        fontFamily: 'monospace'
                      }}>
                        {order.orderNumber} • {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </List.Item>
                ))}
              </List>
            ) : (
              <div style={{ 
                textAlign: 'center',
                color: '#8c8c8c',
                padding: '20px 0'
              }}>
                아직 주문 내역이 없어요
              </div>
            )}
          </Card>

          {/* 메뉴 목록 */}
          <Card style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}>
            <List>
              
              <List.Item
                prefix={<EnvironmentOutlined style={{ color: '#2196F3' }} />}
                onClick={() => navigate('/profile/addresses')}
                arrow
              >
                주소록 관리
              </List.Item>

              <List.Item
                prefix={<CreditCardOutlined style={{ color: '#2196F3' }} />}
                onClick={() => navigate('/profile/payment-methods')}
                arrow
              >
                결제수단 관리
              </List.Item>

              <List.Item
                prefix={<HeartOutlined style={{ color: '#2196F3' }} />}
                onClick={() => navigate('/profile/favorites')}
                arrow
              >
                즐겨찾기 전문가
              </List.Item>

              <List.Item
                prefix={<GiftOutlined style={{ color: '#2196F3' }} />}
                onClick={() => navigate('/profile/points')}
                arrow
              >
                포인트 내역
              </List.Item>

              <Divider style={{ margin: '12px 0' }} />

              <List.Item
                prefix={<BellOutlined style={{ color: '#8c8c8c' }} />}
                extra={
                  <Switch
                    checked={notificationSettings.orderUpdates}
                    onChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                }
              >
                주문 알림
              </List.Item>

              <List.Item
                prefix={<GiftOutlined style={{ color: '#8c8c8c' }} />}
                extra={
                  <Switch
                    checked={notificationSettings.promotions}
                    onChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, promotions: checked }))
                    }
                  />
                }
              >
                혜택 알림
              </List.Item>

              <Divider style={{ margin: '12px 0' }} />

              <List.Item
                prefix={<QuestionCircleOutlined style={{ color: '#8c8c8c' }} />}
                onClick={() => navigate('/help')}
                arrow
              >
                고객센터
              </List.Item>

              <List.Item
                prefix={<SettingOutlined style={{ color: '#8c8c8c' }} />}
                onClick={() => navigate('/settings')}
                arrow
              >
                앱 설정
              </List.Item>

              <List.Item
                prefix={<SecurityScanOutlined style={{ color: '#8c8c8c' }} />}
                onClick={() => navigate('/privacy')}
                arrow
              >
                개인정보 처리방침
              </List.Item>

              <Divider style={{ margin: '12px 0' }} />

              <List.Item
                prefix={<LogoutOutlined style={{ color: '#ff4d4f' }} />}
                onClick={handleLogout}
                style={{ color: '#ff4d4f' }}
              >
                로그아웃
              </List.Item>

            </List>
          </Card>

          {/* 고객센터 */}
          <Card 
            style={{ 
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '12px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500,
                color: '#52c41a',
                marginBottom: '8px'
              }}>
                🎧 고객센터
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#389e0d',
                marginBottom: '12px'
              }}>
                궁금한 점이 있으시면 언제든 문의해주세요
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button 
                  size="small"
                  color="success"
                  fill="outline"
                  onClick={() => window.location.href = 'tel:1588-1234'}
                >
                  <PhoneOutlined /> 전화상담
                </Button>
                <Button 
                  size="small"
                  color="success"
                  fill="outline"
                  onClick={() => navigate('/help/chat')}
                >
                  💬 채팅상담
                </Button>
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#8c8c8c',
                marginTop: '8px'
              }}>
                상담시간: 평일 09:00-18:00
              </div>
            </div>
          </Card>

        </Space>
      </div>

      {/* 프로필 수정 팝업 */}
      <Popup 
        visible={editModalVisible}
        onMaskClick={() => setEditModalVisible(false)}
        position="bottom"
        bodyStyle={{ 
          borderTopLeftRadius: '12px', 
          borderTopRightRadius: '12px',
          padding: '20px',
          maxHeight: '70vh'
        }}
      >
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0 }}>프로필 수정</h3>
            <Button 
              fill="none" 
              onClick={() => setEditModalVisible(false)}
              size="small"
            >
              ✕
            </Button>
          </div>

          <Form layout="vertical">
            <Form.Item label="이름">
              <Input value={user?.name} disabled />
            </Form.Item>
            
            <Form.Item label="이메일">
              <Input value={user?.email} disabled />
            </Form.Item>
            
            <Form.Item label="휴대폰 번호">
              <Input placeholder="휴대폰 번호를 입력하세요" />
            </Form.Item>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <Button 
                fill="outline" 
                onClick={() => setEditModalVisible(false)}
                style={{ flex: 1 }}
              >
                취소
              </Button>
              <Button 
                color="primary"
                onClick={() => {
                  Toast.show('프로필이 수정되었습니다');
                  setEditModalVisible(false);
                }}
                style={{ flex: 1 }}
              >
                저장
              </Button>
            </div>
          </Form>
        </div>
      </Popup>

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
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            if (key !== 'profile') {
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

export default Profile;