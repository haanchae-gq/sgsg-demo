import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import koKR from 'antd-mobile/es/locales/ko-KR';
import { QueryProvider } from './providers/QueryProvider';
import { useAuthStore } from './stores/authStore';
import Login from './screens/auth/Login';
import AppRouter from './components/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/mobile.css';

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const isExpert = user?.role === 'expert';

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ConfigProvider locale={koKR}>
          <div className="app-container" style={{ height: '100vh', overflow: 'hidden' }}>
          {!isAuthenticated ? (
            <Login />
          ) : !isExpert ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh', 
              flexDirection: 'column',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#f5222d', marginBottom: '16px' }}>⚠️ 접근 권한 없음</h2>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                이 앱은 전문가 계정만 사용할 수 있습니다.<br />
                현재 계정: {user?.role}
              </p>
              <button 
                onClick={() => useAuthStore.getState().logout()}
                style={{
                  padding: '12px 24px',
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                다른 계정으로 로그인
              </button>
            </div>
          ) : (
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          )}
          </div>
        </ConfigProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;