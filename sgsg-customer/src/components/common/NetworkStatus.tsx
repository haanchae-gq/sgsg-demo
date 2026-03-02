import React, { useState, useEffect } from 'react';
import { Toast } from 'antd-mobile';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasShownOfflineMessage, setHasShownOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (hasShownOfflineMessage) {
        Toast.show({
          icon: 'success',
          content: '인터넷이 다시 연결되었습니다',
          duration: 2000
        });
      }
      setHasShownOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasShownOfflineMessage(true);
      Toast.show({
        icon: 'fail',
        content: '인터넷 연결이 끊어졌습니다',
        duration: 0
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasShownOfflineMessage]);

  // 오프라인 상태일 때 지속적으로 표시되는 배너
  if (!isOnline) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#ff4d4f',
        color: 'white',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '12px',
        zIndex: 2000
      }}>
        📶 인터넷 연결이 끊어졌습니다. 연결 상태를 확인해주세요.
      </div>
    );
  }

  return null;
};

export default NetworkStatus;