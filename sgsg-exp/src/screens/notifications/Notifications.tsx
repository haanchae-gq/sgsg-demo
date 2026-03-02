import React, { useState } from 'react';
import { 
  NavBar, 
  Card, 
  List, 
  Badge, 
  Button,
  Tabs,
  Empty,
  SwipeAction,
  Toast
} from 'antd-mobile';
import { 
  LeftOutline,
  BellOutline,
  CloseOutline,
  CheckOutline,
  DeleteOutline
} from 'antd-mobile-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import api from '../../services/api';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'new_order' | 'order_update' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_order':
      return '📋';
    case 'order_update':
      return '🔄';
    case 'payment':
      return '💰';
    case 'review':
      return '⭐';
    case 'system':
      return '🔔';
    default:
      return '📢';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'new_order':
      return '#52c41a';
    case 'order_update':
      return '#1890ff';
    case 'payment':
      return '#faad14';
    case 'review':
      return '#eb2f96';
    case 'system':
      return '#722ed1';
    default:
      return '#8c8c8c';
  }
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  // 알림 목록 조회
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data.items as Notification[];
    }
  });

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // 알림 삭제
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '알림이 삭제되었습니다' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // 모든 알림 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '모든 알림을 읽음 처리했습니다' });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getFilteredNotifications = () => {
    if (!notifications) return [];
    
    switch (activeTab) {
      case 'all':
        return notifications;
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'orders':
        return notifications.filter(n => ['new_order', 'order_update'].includes(n.type));
      case 'payments':
        return notifications.filter(n => n.type === 'payment');
      case 'reviews':
        return notifications.filter(n => n.type === 'review');
      default:
        return notifications;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // 알림 타입에 따른 화면 이동
    switch (notification.type) {
      case 'new_order':
      case 'order_update':
        if (notification.data?.orderId) {
          navigate(`/orders/${notification.data.orderId}`);
        }
        break;
      case 'review':
        navigate('/reviews');
        break;
      case 'payment':
        navigate('/earnings');
        break;
      default:
        break;
    }
  };

  const renderNotificationCard = (notification: Notification) => {
    const swipeActions = [
      {
        key: 'read',
        text: notification.isRead ? '읽지않음' : '읽음',
        color: 'primary',
        onClick: () => markAsReadMutation.mutate(notification.id)
      },
      {
        key: 'delete',
        text: '삭제',
        color: 'danger',
        onClick: () => deleteMutation.mutate(notification.id)
      }
    ];

    return (
      <SwipeAction rightActions={swipeActions} key={notification.id}>
        <Card 
          className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="notification-content">
            <div className="notification-icon">
              <span 
                className="icon-emoji"
                style={{ color: getNotificationColor(notification.type) }}
              >
                {getNotificationIcon(notification.type)}
              </span>
              {!notification.isRead && <div className="unread-dot" />}
            </div>
            
            <div className="notification-body">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {formatRelativeTime(notification.createdAt)}
              </div>
            </div>
          </div>
        </Card>
      </SwipeAction>
    );
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const tabItems = [
    { key: 'all', title: `전체 ${notifications?.length || 0}` },
    { key: 'unread', title: `안읽음 ${unreadCount}` },
    { key: 'orders', title: '주문 알림' },
    { key: 'payments', title: '결제 알림' },
    { key: 'reviews', title: '리뷰 알림' }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="notifications-screen">
      <NavBar
        onBack={() => navigate(-1)}
        backIcon={<LeftOutline />}
        right={
          unreadCount > 0 && (
            <Button
              fill="none"
              size="mini"
              onClick={() => markAllAsReadMutation.mutate()}
              loading={markAllAsReadMutation.isPending}
            >
              모두 읽음
            </Button>
          )
        }
      >
        알림 센터 {unreadCount > 0 && <Badge content={unreadCount} />}
      </NavBar>

      <div className="notifications-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="notifications-tabs"
        >
          {tabItems.map(tab => (
            <Tabs.Tab title={tab.title} key={tab.key}>
              <div className="notifications-list">
                {getFilteredNotifications().length === 0 ? (
                  <Empty
                    description="알림이 없습니다"
                    imageStyle={{ width: 128 }}
                    image={<BellOutline style={{ fontSize: 64, color: '#ccc' }} />}
                  />
                ) : (
                  getFilteredNotifications().map(renderNotificationCard)
                )}
              </div>
            </Tabs.Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;