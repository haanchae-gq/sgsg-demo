import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import HomeScreen from './screens/HomeScreen';
import './styles/mobile.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={enUS}>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            {/* Add mobile screens */}
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;