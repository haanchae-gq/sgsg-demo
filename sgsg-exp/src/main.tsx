import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initializeTheme } from './stores/themeStore';
import './styles/mobile.css';

// 테마 초기화
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);