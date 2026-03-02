import React, { useState } from 'react';
import { Layout, Menu, Avatar, Button, Dropdown, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  UserOutlined, 
  TeamOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  StarOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleMenuClick = (e: any) => {
    navigate(e.key);
  };

  const getSelectedKey = () => {
    return location.pathname;
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/users')) return ['users'];
    if (path.startsWith('/services')) return ['services'];
    if (path.startsWith('/orders')) return ['orders'];
    return [];
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필 설정',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '환경 설정',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
    },
  ];

  const handleUserMenuClick = (e: any) => {
    if (e.key === 'logout') {
      // TODO: Implement logout logic
      console.log('Logout clicked');
    } else {
      navigate(`/${e.key}`);
    }
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="80"
      collapsed={collapsed}
      onCollapse={(value: boolean) => setCollapsed(value)}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        zIndex: 100,
      }}
      width={260}
    >
      {/* 로고 섹션 */}
      <div 
        style={{ 
          height: '64px', 
          margin: '16px 16px 24px 16px', 
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 16px',
          color: 'white',
          fontSize: collapsed ? '16px' : '18px',
          fontWeight: 'bold'
        }}
      >
        {!collapsed && 'SGSG Admin'}
        {collapsed && 'SG'}
        {!collapsed && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: 'white',
              border: 'none',
              fontSize: '16px',
            }}
          />
        )}
      </div>
      
      {/* 메인 메뉴 */}
      <Menu 
        theme="dark" 
        mode="inline" 
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        onClick={handleMenuClick}
        inlineCollapsed={collapsed}
        style={{
          borderRight: 0,
          flex: 1,
        }}
      >
        <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
          대시보드
        </Menu.Item>
        
        <SubMenu key="users" icon={<UserOutlined />} title="사용자 관리">
          <Menu.Item key="/users/customers" icon={<UserOutlined />}>
            고객 관리
          </Menu.Item>
          <Menu.Item key="/users/experts" icon={<TeamOutlined />}>
            전문가 관리
          </Menu.Item>
        </SubMenu>

        <SubMenu key="services" icon={<AppstoreOutlined />} title="서비스 관리">
          <Menu.Item key="/services/categories">
            카테고리 관리
          </Menu.Item>
          <Menu.Item key="/services/items">
            서비스 관리
          </Menu.Item>
        </SubMenu>

        <SubMenu key="orders" icon={<ShoppingCartOutlined />} title="주문 & 결제">
          <Menu.Item key="/orders">
            주문 관리
          </Menu.Item>
          <Menu.Item key="/payments">
            결제 관리
          </Menu.Item>
        </SubMenu>

        <Menu.Item key="/reviews" icon={<StarOutlined />}>
          리뷰 관리
        </Menu.Item>
      </Menu>

      {/* 사용자 정보 섹션 */}
      <div 
        style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: collapsed ? '16px 8px' : '16px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="관리자 메뉴" placement="right">
              <Dropdown 
                menu={{ 
                  items: userMenuItems,
                  onClick: handleUserMenuClick 
                }} 
                placement="topLeft"
                trigger={['click']}
              >
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />} 
                  style={{ 
                    backgroundColor: '#1677ff',
                    cursor: 'pointer'
                  }} 
                />
              </Dropdown>
            </Tooltip>
          </div>
        ) : (
          <Dropdown 
            menu={{ 
              items: userMenuItems,
              onClick: handleUserMenuClick 
            }} 
            placement="topLeft"
            trigger={['click']}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}>
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1677ff' }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '14px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  관리자
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.65)', 
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  admin@sgsg.com
                </div>
              </div>
              <BellOutlined style={{ 
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '14px'
              }} />
            </div>
          </Dropdown>
        )}
      </div>
    </Sider>
  );
};

export default Sidebar;