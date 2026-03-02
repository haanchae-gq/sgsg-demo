import React, { useState } from 'react';
import { NavBar, NoticeBar, Badge } from 'antd-mobile';
import { SetOutline, BellOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from './navigation/BottomNavigation';
import OrdersDashboard from '../screens/orders/Dashboard';
import Calendar from '../screens/calendar/Calendar';
import Earnings from '../screens/earnings/Earnings';
import Profile from '../screens/profile/Profile';
import { useAuthStore } from '../stores/authStore';
import './MainApp.css';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'orders':
        return '주문 관리';
      case 'calendar':
        return '일정 관리';
      case 'earnings':
        return '정산 관리';
      case 'profile':
        return '내 정보';
      default:
        return 'SGSG 전문가';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersDashboard />;
      case 'calendar':
        return <Calendar />;
      case 'earnings':
        return <Earnings />;
      case 'profile':
        return <Profile />;
      default:
        return <OrdersDashboard />;
    }
  };

  return (
    <div className="main-app">
      <NavBar
        className="main-navbar"
        right={
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Badge content={0} style={{ marginRight: '8px' }}>
              <BellOutline
                fontSize={18}
                onClick={() => navigate('/notifications')}
                style={{ cursor: 'pointer' }}
              />
            </Badge>
            <SetOutline
              fontSize={18}
              onClick={() => setActiveTab('profile')}
              style={{ cursor: 'pointer' }}
            />
          </div>
        }
      >
        <div className="navbar-content">
          <span className="app-title">{getPageTitle()}</span>
          <span className="expert-name">안녕하세요, {user?.name}님</span>
        </div>
      </NavBar>

      {user?.status === 'pending' && (
        <NoticeBar
          content="전문가 승인 대기 중입니다. 승인 후 주문을 받을 수 있습니다."
          color="alert"
          wrap
        />
      )}

      <div className="main-content">
        {renderContent()}
      </div>

      <BottomNavigation 
        activeTab={activeTab}
        onChange={setActiveTab}
        orderBadge={0} // TODO: 실제 신규 주문 수로 업데이트
      />
    </div>
  );
};

export default MainApp;