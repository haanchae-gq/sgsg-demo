import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import './styles/global.css';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar />
          <Layout>
            <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                {/* Add more routes */}
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;