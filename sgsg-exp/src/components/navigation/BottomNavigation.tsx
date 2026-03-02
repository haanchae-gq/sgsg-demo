import React from 'react';
import { TabBar } from 'antd-mobile';
import { 
  AppOutline, 
  CalendarOutline, 
  PayCircleOutline, 
  UserOutline,
  BellOutline
} from 'antd-mobile-icons';

export interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface BottomNavigationProps {
  activeTab: string;
  onChange: (key: string) => void;
  orderBadge?: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChange,
  orderBadge
}) => {
  const tabs: NavigationItem[] = [
    {
      key: 'orders',
      label: '주문',
      icon: <AppOutline />,
      badge: orderBadge
    },
    {
      key: 'calendar',
      label: '일정',
      icon: <CalendarOutline />
    },
    {
      key: 'earnings',
      label: '정산',
      icon: <PayCircleOutline />
    },
    {
      key: 'profile',
      label: '내정보',
      icon: <UserOutline />
    }
  ];

  return (
    <TabBar
      activeKey={activeTab}
      onChange={onChange}
      style={{
        borderTop: '1px solid #f0f0f0',
        background: 'white'
      }}
    >
      {tabs.map(tab => (
        <TabBar.Item
          key={tab.key}
          icon={tab.icon}
          title={tab.label}
          badge={tab.badge}
        />
      ))}
    </TabBar>
  );
};

export default BottomNavigation;