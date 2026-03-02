import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import Customers from './pages/users/Customers';
import Experts from './pages/users/Experts';
import Categories from './pages/services/Categories';
import Items from './pages/services/Items';
import Orders from './pages/orders/Orders';
import Payments from './pages/payments/Payments';
import Reviews from './pages/reviews/Reviews';
import './styles/global.css';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#1677ff',
          colorTextBase: '#262626',
          colorBgBase: '#ffffff',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f5f5f5',
          colorBorder: '#d9d9d9',
          borderRadius: 8,
          fontSize: 14,
          fontSizeHeading1: 38,
          fontSizeHeading2: 30,
          fontSizeHeading3: 24,
          fontSizeHeading4: 20,
          fontSizeHeading5: 16,
          lineHeight: 1.5715,
          lineHeightHeading1: 1.21,
          lineHeightHeading2: 1.35,
          lineHeightHeading3: 1.35,
          lineHeightHeading4: 1.4,
          lineHeightHeading5: 1.5,
          controlHeight: 32,
          controlHeightSM: 24,
          controlHeightLG: 40,
          padding: 16,
          paddingXS: 8,
          paddingSM: 12,
          paddingLG: 24,
          paddingXL: 32,
          margin: 16,
          marginXS: 8,
          marginSM: 12,
          marginLG: 24,
          marginXL: 32,
          screenXS: 480,
          screenSM: 576,
          screenMD: 768,
          screenLG: 992,
          screenXL: 1200,
          screenXXL: 1600,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#001529',
            bodyBg: '#f5f5f5',
            footerBg: '#f5f5f5',
          },
          Button: {
            borderRadius: 8,
            controlHeight: 32,
            controlHeightSM: 24,
            controlHeightLG: 40,
          },
          Card: {
            borderRadiusLG: 12,
            borderRadiusSM: 8,
            paddingLG: 24,
            paddingSM: 16,
            paddingXS: 12,
          },
          Table: {
            borderRadius: 8,
            padding: 16,
            paddingSM: 12,
            paddingXS: 8,
          },
          Form: {
            labelFontSize: 14,
            labelHeight: 32,
            itemMarginBottom: 24,
          },
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar />
          <Layout 
            className="site-layout" 
            style={{ 
              marginLeft: 260,
              transition: 'margin-left 0.2s'
            }}
          >
            <Content style={{ 
              margin: '24px 24px 24px 24px', 
              padding: '24px', 
              minHeight: 280, 
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users/customers" element={<Customers />} />
                <Route path="/users/experts" element={<Experts />} />
                <Route path="/services/categories" element={<Categories />} />
                <Route path="/services/items" element={<Items />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reviews" element={<Reviews />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;