import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd-mobile';
import koKR from 'antd-mobile/es/locales/ko-KR';
import './styles/global.css';

// 에러 처리 컴포넌트들
import { ErrorBoundary } from './components/error/ErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus';

// 화면 컴포넌트들
import Home from './screens/Home';
import ServiceCatalog from './screens/services/Catalog';
import ServiceDetail from './screens/services/Detail';
import ExpertProfile from './screens/experts/Profile';
import OrderCreate from './screens/order/Create';
import OrderComplete from './screens/order/Complete';
import MyOrders from './screens/orders/MyOrders';
import OrderDetail from './screens/orders/Detail';
import ReviewWrite from './screens/reviews/Write';
import MyReviews from './screens/reviews/MyReviews';
import Login from './screens/auth/Login';
import Register from './screens/auth/Register';
import Profile from './screens/profile/Profile';
import Payment from './screens/payment/Payment';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// Ant Design Mobile 테마 설정
const theme = {
  primaryColor: '#2196F3',
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#ff4d4f',
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={koKR} theme={theme}>
          <NetworkStatus />
          <Router>
            <div className="marketplace-container">
              <Routes>
              {/* 홈 및 메인 기능 */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<ServiceCatalog />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/experts/:id" element={<ExpertProfile />} />
              
              {/* 주문 관련 */}
              <Route path="/order/create" element={<OrderCreate />} />
              <Route path="/order/complete/:id" element={<OrderComplete />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              
              {/* 결제 */}
              <Route path="/payment/:orderId" element={<Payment />} />
              
              {/* 리뷰 */}
              <Route path="/reviews/write/:orderId" element={<ReviewWrite />} />
              <Route path="/reviews" element={<MyReviews />} />
              
              {/* 인증 */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              
              {/* 프로필 */}
              <Route path="/profile" element={<Profile />} />
              
              {/* 기본 리다이렉트 */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
