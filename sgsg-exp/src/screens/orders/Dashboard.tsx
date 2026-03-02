import React, { useState, useEffect } from 'react';
import { 
  List, 
  Card, 
  Badge, 
  Button, 
  PullToRefresh,
  InfiniteScroll,
  Tabs,
  Toast,
  SwipeAction,
  NoticeBar
} from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { 
  ClockCircleOutline,
  CheckCircleOutline,
  CalendarOutline,
  EnvironmentOutline,
  UserOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getOrderStatusText, getOrderStatusColor } from '../../utils/status';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import './Dashboard.css';

interface Order {
  id: string;
  orderNumber: string;
  serviceItem: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  requestedDate: string;
  status: string;
  totalAmount: number;
  customerNotes?: string;
  address: {
    fullAddress: string;
    detailAddress?: string;
  };
  createdAt: string;
}

const OrdersDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [hasMore, setHasMore] = useState(true);
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // WebSocket 실시간 알림 연결
  const { isConnected } = useWebSocket({
    onNewOrder: () => {
      // 새 주문 알림 시 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ['orders', 'new'] });
    },
    onMessage: (message) => {
      if (message.type === 'order_update' || message.type === 'payment_update') {
        // 주문 상태 변경 시 데이터 새로고침
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    }
  });

  // 새 주문 조회
  const { data: newOrders, refetch: refetchNew, isLoading: isLoadingNew } = useQuery({
    queryKey: ['orders', 'new'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: {
          status: 'pending,confirmed',
          limit: 20,
          page: 1
        }
      });
      return response.data.data.items;
    }
  });

  // 진행 중 주문 조회
  const { data: inProgressOrders, refetch: refetchInProgress } = useQuery({
    queryKey: ['orders', 'inProgress'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: {
          status: 'expert_assigned,schedule_pending,scheduled,in_progress',
          limit: 20,
          page: 1
        }
      });
      return response.data.data.items;
    }
  });

  // 완료된 주문 조회
  const { data: completedOrders, refetch: refetchCompleted } = useQuery({
    queryKey: ['orders', 'completed'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: {
          status: 'completed,cancelled',
          limit: 20,
          page: 1
        }
      });
      return response.data.data.items;
    }
  });

  // 주문 승낙 뮤테이션
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await api.put(`/orders/${orderId}`, {
        status: 'expert_assigned',
        expertId: user?.id
      });
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '주문을 승낙했습니다' });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '주문 승낙에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  // 주문 거절 뮤테이션  
  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await api.post(`/orders/${orderId}/cancel`, {
        reason: 'expert_declined'
      });
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '주문을 거절했습니다' });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || '주문 거절에 실패했습니다';
      Toast.show({ icon: 'fail', content: message });
    }
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchNew(),
      refetchInProgress(), 
      refetchCompleted()
    ]);
  };

  const getOrdersByTab = () => {
    switch (activeTab) {
      case 'new':
        return newOrders || [];
      case 'inProgress':
        return inProgressOrders || [];
      case 'completed':
        return completedOrders || [];
      default:
        return [];
    }
  };

  const renderOrderCard = (order: Order) => {
    const isNew = activeTab === 'new';
    
    const orderCard = (
      <Card 
        className="order-card" 
        key={order.id}
        onClick={() => navigate(`/orders/${order.id}`)}
      >
        <div className="order-header">
          <div className="order-info">
            <div className="order-number">#{order.orderNumber}</div>
            <Badge 
              content={getOrderStatusText(order.status)}
              style={{ 
                background: getOrderStatusColor(order.status),
                fontSize: '11px'
              }}
            />
          </div>
          <div className="order-amount">{formatCurrency(order.totalAmount)}</div>
        </div>

        <div className="order-service">
          <h3>{order.serviceItem.name}</h3>
          <div className="service-category">{order.serviceItem.category.name}</div>
        </div>

        <div className="order-details">
          <div className="detail-item">
            <UserOutline />
            <span>{order.customer.name}</span>
          </div>
          <div className="detail-item">
            <CalendarOutline />
            <span>{formatDateTime(order.requestedDate)}</span>
          </div>
          <div className="detail-item">
            <EnvironmentOutline />
            <span>{order.address.fullAddress}</span>
          </div>
        </div>

        {order.customerNotes && (
          <div className="customer-notes">
            <div className="notes-label">고객 요청사항:</div>
            <div className="notes-content">{order.customerNotes}</div>
          </div>
        )}
      </Card>
    );

    // 새 주문인 경우 스와이프 액션 추가
    if (isNew && (order.status === 'pending' || order.status === 'confirmed')) {
      const rightActions = [
        {
          key: 'accept',
          text: '승낙',
          color: 'success',
          onClick: () => acceptOrderMutation.mutate(order.id)
        },
        {
          key: 'reject', 
          text: '거절',
          color: 'danger',
          onClick: () => rejectOrderMutation.mutate(order.id)
        }
      ];

      return (
        <SwipeAction rightActions={rightActions} key={order.id}>
          {orderCard}
        </SwipeAction>
      );
    }

    return orderCard;
  };

  const tabItems = [
    { key: 'new', title: `새 주문 ${newOrders?.length || 0}` },
    { key: 'inProgress', title: `진행중 ${inProgressOrders?.length || 0}` },
    { key: 'completed', title: `완료 ${completedOrders?.length || 0}` }
  ];

  return (
    <div className="orders-dashboard">
      <div className="dashboard-header">
        <h1>주문 관리</h1>
        <div className="header-stats">
          <div className="stat-item">
            <ClockCircleOutline />
            <span>신규: {newOrders?.length || 0}</span>
          </div>
        </div>
      </div>

      {newOrders && newOrders.length > 0 && activeTab === 'new' && (
        <NoticeBar
          content="새로운 주문이 있습니다! 좌우로 스와이프하여 승낙/거절하세요"
          color="alert"
          closeable
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="orders-tabs"
      >
        {tabItems.map(tab => (
          <Tabs.Tab title={tab.title} key={tab.key}>
            <PullToRefresh onRefresh={handleRefresh}>
              <div className="orders-list">
                {getOrdersByTab().map(renderOrderCard)}
                
                <InfiniteScroll
                  loadMore={async () => {}}
                  hasMore={hasMore}
                />
              </div>
            </PullToRefresh>
          </Tabs.Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default OrdersDashboard;