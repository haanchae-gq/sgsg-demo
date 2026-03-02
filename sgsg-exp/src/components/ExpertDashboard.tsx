import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  List, 
  Badge, 
  Button, 
  Toast,
  PullToRefresh,
  Skeleton
} from 'antd-mobile';
import { 
  CalendarOutline,
  UserContactOutline,
  PieOutline,
  AlertCircleOutline,
  CheckCircleOutline,
  ClockCircleOutline
} from 'antd-mobile-icons';

interface ExpertStats {
  totalOrders: number;
  completedOrders: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  thisMonthOrders: number;
  thisMonthEarnings: number;
  pendingOrders: number;
}

interface Schedule {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  order: {
    orderNumber: string;
    customer: {
      user: {
        name: string;
        phone: string;
      };
    };
    serviceItem: {
      name: string;
    };
    address: {
      addressLine1: string;
      city: string;
    };
  };
}

interface DashboardProps {
  authToken: string;
}

const ExpertDashboard: React.FC<DashboardProps> = ({ authToken }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, scheduleResponse] = await Promise.all([
        fetch('http://localhost:4001/api/v1/experts/me/statistics', { headers: apiHeaders }),
        fetch(`http://localhost:4001/api/v1/experts/me/schedule?date=${new Date().toISOString().split('T')[0]}`, { headers: apiHeaders })
      ]);

      const [statsData, scheduleData] = await Promise.all([
        statsResponse.json(),
        scheduleResponse.json()
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (scheduleData.success) {
        setTodaySchedules(scheduleData.data.data || []);
      }

    } catch (error) {
      Toast.show('데이터 로딩 중 오류가 발생했습니다.');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '예정';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <Skeleton.Title />
        <Skeleton.Paragraph lineCount={3} />
        <Skeleton.Paragraph lineCount={2} />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchDashboardData}>
      <div style={{ padding: '16px' }}>
        {/* 통계 카드 */}
        <Card title="📊 이번 달 실적" style={{ marginBottom: '16px' }}>
          <Grid columns={2} gap={8}>
            <Grid.Item>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {stats?.thisMonthOrders || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>이번 달 주문</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                  {(stats?.thisMonthEarnings || 0).toLocaleString()}원
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>이번 달 수익</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                  {stats?.averageRating || 0}★
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>평균 평점</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
                  {stats?.pendingOrders || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>대기 주문</div>
              </div>
            </Grid.Item>
          </Grid>
        </Card>

        {/* 오늘 스케줄 */}
        <Card title="📅 오늘의 스케줄" style={{ marginBottom: '16px' }}>
          {todaySchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              📭 오늘 예정된 스케줄이 없습니다.
            </div>
          ) : (
            <List>
              {todaySchedules.map((schedule) => (
                <List.Item
                  key={schedule.id}
                  prefix={<ClockCircleOutline />}
                  extra={
                    <Badge color={getStatusColor(schedule.status)} content={getStatusText(schedule.status)} />
                  }
                  description={`${schedule.order.customer.user.name} · ${schedule.order.serviceItem.name}`}
                  onClick={() => {
                    Toast.show(`스케줄 상세: ${schedule.order.orderNumber}`);
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{schedule.startTime} - {schedule.endTime}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {schedule.order.address.addressLine1}, {schedule.order.address.city}
                    </div>
                  </div>
                </List.Item>
              ))}
            </List>
          )}
        </Card>

        {/* 빠른 액션 */}
        <Card title="⚡ 빠른 실행">
          <Grid columns={2} gap={8}>
            <Grid.Item>
              <Button
                block
                size="large"
                onClick={() => window.location.href = '/schedule'}
                style={{
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <CalendarOutline style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '12px', marginTop: '4px' }}>스케줄 관리</span>
              </Button>
            </Grid.Item>
            <Grid.Item>
              <Button
                block
                size="large"
                onClick={() => window.location.href = '/sub-accounts'}
                style={{
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <UserContactOutline style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '12px', marginTop: '4px' }}>서브 계정</span>
              </Button>
            </Grid.Item>
            <Grid.Item>
              <Button
                block
                size="large"
                onClick={() => window.location.href = '/statistics'}
                style={{
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <PieOutline style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '12px', marginTop: '4px' }}>통계 보기</span>
              </Button>
            </Grid.Item>
            <Grid.Item>
              <Button
                block
                size="large"
                onClick={() => window.location.href = '/penalties'}
                style={{
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <AlertCircleOutline style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '12px', marginTop: '4px' }}>패널티 현황</span>
              </Button>
            </Grid.Item>
          </Grid>
        </Card>

        {/* 전체 통계 요약 */}
        <Card title="📈 전체 통계">
          <List>
            <List.Item extra={`${stats?.totalOrders || 0}건`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutline style={{ marginRight: '8px', color: '#52c41a' }} />
                총 완료 주문
              </div>
            </List.Item>
            <List.Item extra={`${(stats?.totalEarnings || 0).toLocaleString()}원`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PieOutline style={{ marginRight: '8px', color: '#1890ff' }} />
                총 수익
              </div>
            </List.Item>
            <List.Item extra={`${stats?.totalReviews || 0}개`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <AlertCircleOutline style={{ marginRight: '8px', color: '#faad14' }} />
                총 리뷰
              </div>
            </List.Item>
          </List>
        </Card>
      </div>
    </PullToRefresh>
  );
};

export default ExpertDashboard;