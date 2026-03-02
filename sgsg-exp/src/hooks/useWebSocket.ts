import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Toast } from 'antd-mobile';

interface WebSocketMessage {
  type: 'new_order' | 'order_update' | 'payment_update' | 'notification';
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onNewOrder?: (order: any) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onNewOrder,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { user, accessToken } = useAuthStore();

  const connect = () => {
    if (!accessToken || !user) {
      console.log('No auth token or user, skipping WebSocket connection');
      return;
    }

    try {
      // WebSocket 서버 URL (실제 환경에 맞게 조정)
      const wsUrl = `ws://localhost:4000/ws?token=${accessToken}&userId=${user.id}&role=${user.role}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectCount(0);
        
        // 연결 확인을 위한 핑 메시지
        ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          onMessage?.(message);

          // 메시지 타입별 처리
          switch (message.type) {
            case 'new_order':
              Toast.show({
                icon: 'success',
                content: '🔔 새로운 주문이 도착했습니다!',
                duration: 3000
              });
              onNewOrder?.(message.data);
              break;

            case 'order_update':
              Toast.show({
                icon: 'info',
                content: `주문 상태가 업데이트되었습니다: ${message.data.status}`,
                duration: 2000
              });
              break;

            case 'payment_update':
              Toast.show({
                icon: 'success',
                content: '결제가 완료되었습니다',
                duration: 2000
              });
              break;

            case 'notification':
              Toast.show({
                icon: 'info',
                content: message.data.message || '새로운 알림이 있습니다',
                duration: 2000
              });
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // 자동 재연결 시도
        if (reconnectCount < reconnectAttempts) {
          console.log(`Attempting to reconnect... (${reconnectCount + 1}/${reconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          console.log('Max reconnection attempts reached');
          Toast.show({
            icon: 'fail',
            content: '실시간 알림 연결이 끊어졌습니다',
            duration: 3000
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Toast.show({
          icon: 'fail',
          content: '실시간 알림 연결 오류',
          duration: 2000
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectCount(0);
  };

  const sendMessage = (message: object) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  };

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    if (accessToken && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [accessToken, user?.id]);

  // 페이지 가시성 변화 시 재연결
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && accessToken && user) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, accessToken, user]);

  return {
    isConnected,
    reconnectCount,
    connect,
    disconnect,
    sendMessage
  };
};