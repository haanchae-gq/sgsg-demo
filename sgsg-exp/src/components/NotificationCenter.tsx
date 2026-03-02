import React, { useState, useEffect, useRef } from 'react';
import {
  List,
  Card,
  Badge,
  Button,
  Toast,
  PullToRefresh,
  SearchBar,
  FloatingPanel
} from 'antd-mobile';
import {
  BellOutline,
  CheckCircleOutline,
  ClockCircleOutline,
  AlertCircleOutline,
  MessageOutline,
  XOutline
} from 'antd-mobile-icons';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  authToken: string;
  visible: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  authToken, 
  visible, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);

  const apiHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // WebSocket 연결 설정
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://localhost:4001/ws`, [], {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      ws.onopen = () => {
        console.log('[WebSocket] Connected to notification server');
        websocketRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message);

          switch (message.type) {
            case 'notification':
              // 새로운 알림 수신
              const newNotification = message.data;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Toast로 알림 표시 (앱이 활성화된 상태일 때)
              Toast.show({
                icon: getNotificationIcon(newNotification.type),
                content: newNotification.title,
                duration: 3000
              });
              break;

            case 'unread_count':
              setUnreadCount(message.data.count);
              break;

            case 'notification_marked_read':
              // 읽음 처리 확인
              setNotifications(prev => 
                prev.map(notif => 
                  notif.id === message.data.notificationId 
                    ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                    : notif
                )
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
              break;

            case 'connection_established':
              console.log('[WebSocket] Connection established:', message.data);
              break;

            case 'pong':
              console.log('[WebSocket] Heartbeat response received');
              break;

            case 'error':
              console.error('[WebSocket] Server error:', message.data);
              Toast.show(`서버 오류: ${message.data.message}`);
              break;

            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        websocketRef.current = null;
        
        // 연결이 비정상적으로 끊어진 경우 재연결 시도
        if (event.code !== 1000 && event.code !== 1008) {
          setTimeout(connectWebSocket, 5000); // 5초 후 재연결
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
      };

    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
    }
  };

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4001/api/v1/notifications', {
        headers: apiHeaders
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications || []);
        setFilteredNotifications(data.data.notifications || []);
      } else {
        Toast.show('알림 로딩 실패');
      }
    } catch (error) {
      Toast.show('네트워크 오류가 발생했습니다.');
      console.error('Notifications fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:4001/api/v1/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: apiHeaders
      });

      if (response.ok) {
        // WebSocket으로도 읽음 처리 요청
        if (websocketRef.current) {
          websocketRef.current.send(JSON.stringify({
            type: 'mark_notification_read',
            notificationId
          }));
        }
      } else {
        Toast.show('읽음 처리 실패');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      Toast.show('네트워크 오류가 발생했습니다.');
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/v1/notifications/read-all', {
        method: 'PUT',
        headers: apiHeaders
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
        Toast.show('모든 알림을 읽음 처리했습니다.');
      } else {
        Toast.show('읽음 처리 실패');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      Toast.show('네트워크 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트/언마운트 시 WebSocket 관리
  useEffect(() => {
    if (visible) {
      connectWebSocket();
      fetchNotifications();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [visible]);

  // 검색 필터링
  useEffect(() => {
    if (!searchText) {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(notif =>
        notif.title.includes(searchText) ||
        notif.message.includes(searchText) ||
        notif.type.includes(searchText)
      );
      setFilteredNotifications(filtered);
    }
  }, [searchText, notifications]);

  // Heartbeat 전송 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_assignment':
      case 'assignment_deadline':
        return <AlertCircleOutline style={{ color: '#faad14' }} />;
      case 'schedule_created':
      case 'schedule_updated':
        return <ClockCircleOutline style={{ color: '#1890ff' }} />;
      case 'penalty_applied':
      case 'daily_limit_reached':
        return <AlertCircleOutline style={{ color: '#f5222d' }} />;
      case 'membership_expiring':
      case 'slot_limit_reached':
        return <BellOutline style={{ color: '#faad14' }} />;
      case 'review_created':
      case 'review_approved':
        return <CheckCircleOutline style={{ color: '#52c41a' }} />;
      default:
        return <MessageOutline style={{ color: '#666' }} />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'new_assignment': return '새 배정';
      case 'assignment_deadline': return '마감 임박';
      case 'schedule_created': return '스케줄 생성';
      case 'schedule_updated': return '스케줄 변경';
      case 'penalty_applied': return '패널티';
      case 'daily_limit_reached': return '한도 도달';
      case 'membership_expiring': return '멤버십';
      case 'slot_limit_reached': return '슬롯 한도';
      case 'review_created': return '새 리뷰';
      case 'review_approved': return '리뷰 승인';
      default: return '알림';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;
    return date.toLocaleDateString();
  };

  return (
    <FloatingPanel
      visible={visible}
      onClose={onClose}
      borderRadius={16}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔔 알림</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <Button size="mini" color="primary" onClick={markAllAsRead}>
                모두 읽음
              </Button>
            )}
            <Button size="mini" fill="none" onClick={onClose}>
              <XOutline />
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ background: 'white', minHeight: '300px', maxHeight: '70vh', overflow: 'hidden' }}>
        {/* 읽지 않은 알림 수 */}
        {unreadCount > 0 && (
          <div style={{
            background: '#e6f7ff',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center',
            fontSize: '14px',
            color: '#1890ff'
          }}>
            📥 읽지 않은 알림 {unreadCount}개
          </div>
        )}

        {/* 검색 */}
        <div style={{ padding: '12px' }}>
          <SearchBar
            placeholder="알림 제목, 내용으로 검색"
            value={searchText}
            onChange={setSearchText}
          />
        </div>

        {/* 알림 목록 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <PullToRefresh onRefresh={fetchNotifications} loading={loading}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {searchText ? '🔍 검색 결과가 없습니다.' : '📭 알림이 없습니다.'}
              </div>
            ) : (
              <List>
                {filteredNotifications.map((notif) => (
                  <List.Item
                    key={notif.id}
                    prefix={getNotificationIcon(notif.type)}
                    extra={
                      <div style={{ textAlign: 'right' }}>
                        <Badge 
                          content={getNotificationTypeText(notif.type)}
                          style={{ fontSize: '10px' }}
                        />
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                          {formatTime(notif.createdAt)}
                        </div>
                      </div>
                    }
                    style={{
                      backgroundColor: notif.isRead ? 'white' : '#f6ffed',
                      borderLeft: notif.isRead ? 'none' : '3px solid #52c41a'
                    }}
                    onClick={() => {
                      if (!notif.isRead) {
                        markAsRead(notif.id);
                      }
                    }}
                  >
                    <div>
                      <div style={{ 
                        fontWeight: notif.isRead ? 'normal' : 'bold',
                        marginBottom: '4px'
                      }}>
                        {notif.title}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        lineHeight: '1.4'
                      }}>
                        {notif.message}
                      </div>
                      {notif.data && Object.keys(notif.data).length > 0 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#999', 
                          marginTop: '4px',
                          background: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          📄 추가 정보 있음
                        </div>
                      )}
                    </div>
                  </List.Item>
                ))}
              </List>
            )}
          </PullToRefresh>
        </div>
      </div>
    </FloatingPanel>
  );
};

export const NotificationBadge: React.FC<{
  authToken: string;
  onClick: () => void;
}> = ({ authToken, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket 연결로 실시간 읽지 않은 알림 수 조회
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://localhost:4001/ws`, [], {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        ws.onopen = () => {
          websocketRef.current = ws;
          // 읽지 않은 알림 수 요청
          ws.send(JSON.stringify({ type: 'get_unread_count' }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'notification') {
              setUnreadCount(prev => prev + 1);
            } else if (message.type === 'unread_count') {
              setUnreadCount(message.data.count);
            } else if (message.type === 'notification_marked_read') {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          websocketRef.current = null;
          // 5초 후 재연결 시도
          setTimeout(connectWebSocket, 5000);
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [authToken]);

  // Heartbeat (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onClick}>
      <BellOutline style={{ fontSize: '20px' }} />
      {unreadCount > 0 && (
        <Badge
          content={unreadCount > 99 ? '99+' : unreadCount}
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#f5222d'
          }}
        />
      )}
    </div>
  );
};

// 알림 타입별 아이콘 반환 함수 (export하여 재사용 가능)
export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_assignment':
    case 'assignment_deadline':
      return '⚡';
    case 'schedule_created':
    case 'schedule_updated':
      return '📅';
    case 'penalty_applied':
    case 'daily_limit_reached':
      return '⚠️';
    case 'membership_expiring':
    case 'slot_limit_reached':
      return '💳';
    case 'review_created':
    case 'review_approved':
      return '⭐';
    default:
      return '📢';
  }
};

export default NotificationCenter;