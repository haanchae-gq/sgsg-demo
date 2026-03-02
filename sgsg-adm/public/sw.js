const CACHE_NAME = 'sgsg-admin-v1';
const RUNTIME = 'runtime';

// 캐싱할 리소스
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// 캐시 우선 전략으로 캐싱할 API 경로
const API_CACHE_PATTERNS = [
  /^.*\/api\/v1\/dashboard/,
  /^.*\/api\/v1\/services/,
  /^.*\/api\/v1\/users/
];

// 서비스 워커 설치
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 새 버전이 설치되면 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 활성화 후 모든 탭을 제어
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // same origin인지 확인
  if (url.origin !== location.origin) {
    return;
  }

  // 정적 리소스에 대해 cache-first 전략
  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        });
      }).catch(() => {
        // 오프라인일 때 기본 페이지 반환
        return caches.match('/');
      })
    );
    return;
  }

  // API 요청에 대해 네트워크 우선, 캐시 백업 전략
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_PATTERNS.some(pattern => 
      pattern.test(request.url)
    );

    if (shouldCache) {
      event.respondWith(
        fetch(request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(RUNTIME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // 네트워크 실패시 캐시에서 제공
            return caches.match(request);
          })
      );
    }
    return;
  }

  // 기타 리소스에 대한 기본 처리
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

// 백그라운드 동기화 (지원되는 경우)
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background Sync', event);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 푸시 알림 처리
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push Received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'sgsg-admin-notification',
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: '닫기',
        icon: '/icons/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SGSG Admin', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click Received');

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// 백그라운드 동기화 함수
function doBackgroundSync() {
  return new Promise((resolve) => {
    // 백그라운드에서 처리할 작업
    console.log('[ServiceWorker] Performing background sync');
    resolve();
  });
}