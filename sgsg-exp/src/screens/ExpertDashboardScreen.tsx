import React, { useState, useEffect } from 'react';
import { TabBar, NavBar } from 'antd-mobile';
import {
  AppOutline,
  CalendarOutline,
  UserContactOutline,
  PieOutline,
  AlertCircleOutline
} from 'antd-mobile-icons';
import ExpertDashboard from '../components/ExpertDashboard';
import ScheduleManager from '../components/ScheduleManager'; 
import SubAccountManager from '../components/SubAccountManager';
import MembershipDashboard from '../components/MembershipDashboard';
import AssignmentHistory from '../components/AssignmentHistory';
import NotificationCenter, { NotificationBadge } from '../components/NotificationCenter';

interface ExpertDashboardScreenProps {
  authToken: string;
  expertName: string;
  onLogout: () => void;
}

const ExpertDashboardScreen: React.FC<ExpertDashboardScreenProps> = ({ 
  authToken, 
  expertName, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationVisible, setNotificationVisible] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '전문가 대시보드';
      case 'schedule': return '스케줄 관리';
      case 'subaccounts': return '서브 계정';
      case 'membership': return '멤버십 정보';
      case 'history': return '배정 이력';
      default: return 'SGSG 전문가';
    }
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExpertDashboard authToken={authToken} />;
      case 'schedule':
        return <ScheduleManager authToken={authToken} />;
      case 'subaccounts':
        return <SubAccountManager authToken={authToken} />;
      case 'membership':
        return <MembershipDashboard authToken={authToken} />;
      case 'history':
        return <AssignmentHistory authToken={authToken} />;
      default:
        return <ExpertDashboard authToken={authToken} />;
    }
  };

  const tabs = [
    {
      key: 'dashboard',
      title: '홈',
      icon: <AppOutline />,
    },
    {
      key: 'schedule',
      title: '스케줄',
      icon: <CalendarOutline />,
    },
    {
      key: 'subaccounts',
      title: '서브계정',
      icon: <UserContactOutline />,
    },
    {
      key: 'membership',
      title: '멤버십',
      icon: <PieOutline />,
    },
    {
      key: 'history',
      title: '배정이력',
      icon: <AlertCircleOutline />,
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 네비게이션 */}
      <NavBar
        onBack={() => {
          if (activeTab !== 'dashboard') {
            setActiveTab('dashboard');
          } else {
            onLogout();
          }
        }}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationBadge 
              authToken={authToken}
              onClick={() => setNotificationVisible(true)}
            />
            <div style={{ fontSize: '14px', color: '#666' }}>
              {expertName}님
            </div>
          </div>
        }
      >
        {getTabTitle()}
      </NavBar>

      {/* 메인 컨텐츠 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderCurrentTab()}
      </div>

      {/* 하단 탭 네비게이션 */}
      <TabBar
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      >
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>

      {/* 탭바 여백 */}
      <div style={{ height: '50px' }} />

      {/* 알림 센터 */}
      <NotificationCenter
        authToken={authToken}
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </div>
  );
};

export default ExpertDashboardScreen;