import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';

// Service Worker 등록
if ('serviceWorker' in navigator && import.meta.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // 서비스 워커 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // 새 버전이 사용 가능할 때 사용자에게 알림
                  if (confirm('새 버전이 사용 가능합니다. 페이지를 새로고침하시겠습니까?')) {
                    window.location.reload();
                  }
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA 설치 프롬프트 처리
let deferredPrompt: Event | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  // 기본 설치 프롬프트 방지
  e.preventDefault();
  deferredPrompt = e;
  
  // 앱에서 설치 버튼 표시 가능
  console.log('PWA install prompt available');
});

// PWA가 설치되었을 때
window.addEventListener('appinstalled', (_evt) => {
  console.log('PWA was installed');
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);