import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, UserOutlined } from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />
      <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          Dashboard
        </Menu.Item>
        <Menu.Item key="2" icon={<UserOutlined />}>
          Users
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;