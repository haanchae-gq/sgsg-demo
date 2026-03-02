// Service Worker for SGSG Expert PWA
const CACHE_NAME = 'sgsg-expert-v1';
const RUNTIME = 'runtime';
const API_CACHE = 'api-cache';

// 캐싱할 정적 리소스
const urlsToCache = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// 오프라인 우선 캐싱할 API 패턴
const CACHE_FIRST_APIS = [
  /^.*\/api\/v1\/experts\/me$/,
  /^.*\/api\/v1\/experts\/me\/profile$/,
  /^.*\/api\/v1\/experts\/me\/services$/
];

// 네트워크 우선 캐싱할 API 패턴 (실시간 데이터)
const NETWORK_FIRST_APIS = [
  /^.*\/api\/v1\/orders/,
  /^.*\/api\/v1\/notifications/,
  /^.*\/api\/v1\/experts\/me\/earnings/,
  /^.*\/api\/v1\/experts\/me\/schedule/
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 - 다양한 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  // same origin인지 확인
  if (url.origin !== location.origin) {
    return;
  }

  // HTML 문서 요청 (SPA 라우팅 지원)
  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
              return fetchResponse;
            })
            .catch(() => {
              // 오프라인시 기본 페이지 반환
              return caches.match('/');
            });
        })
    );
    return;
  }

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    // 캐시 우선 API (프로필, 설정 등)
    if (CACHE_FIRST_APIS.some(pattern => pattern.test(request.url))) {
      event.respondWith(
        caches.match(request)
          .then(response => {
            if (response) {
              // 백그라운드에서 업데이트
              fetch(request)
                .then(fetchResponse => {
                  if (fetchResponse.ok) {
                    caches.open(API_CACHE).then(cache => {
                      cache.put(request, fetchResponse.clone());
                    });
                  }
                })
                .catch(() => {});
              return response;
            }
            return fetch(request)
              .then(fetchResponse => {
                if (fetchResponse.ok) {
                  caches.open(API_CACHE).then(cache => {
                    cache.put(request, fetchResponse.clone());
                  });
                }
                return fetchResponse;
              });
          })
      );
      return;
    }

    // 네트워크 우선 API (실시간 데이터)
    if (NETWORK_FIRST_APIS.some(pattern => pattern.test(request.url))) {
      event.respondWith(
        fetch(request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(API_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request);
          })
      );
      return;
    }
  }

  // 정적 리소스 (캐시 우선)
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request)
          .then(fetchResponse => {
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return fetchResponse;
          });
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync', event.tag);
  if (event.tag === 'expert-sync') {
    event.waitUntil(syncExpertData());
  }
});

// Push 알림 처리 (강화된 기능)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received', event);
  
  let notificationData = {
    title: 'SGSG 전문가',
    body: '새로운 알림이 있습니다',
    type: 'general'
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: notificationData.type || 'general',
    vibrate: [200, 100, 200, 100, 200],
    timestamp: Date.now(),
    requireInteraction: ['urgent', 'order'].includes(notificationData.type),
    data: {
      ...notificationData,
      timestamp: Date.now(),
      url: notificationData.url || '/'
    },
    actions: getNotificationActions(notificationData.type)
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'SGSG 전문가', options)
  );
});

// 알림 클릭 처리 (강화된 기능)
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);
  
  event.notification.close();

  const notificationData = event.notification.data;
  let targetUrl = '/';

  switch (event.action) {
    case 'view_order':
      targetUrl = notificationData.orderUrl || '/orders';
      break;
    case 'accept_order':
      targetUrl = '/orders?action=accept&id=' + notificationData.orderId;
      break;
    case 'view_schedule':
      targetUrl = '/calendar';
      break;
    case 'view_earnings':
      targetUrl = '/earnings';
      break;
    default:
      targetUrl = notificationData.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 알림 타입별 액션 버튼 정의
function getNotificationActions(type) {
  switch (type) {
    case 'order':
      return [
        {
          action: 'view_order',
          title: '주문 보기',
          icon: '/icons/action-view.png'
        },
        {
          action: 'accept_order',
          title: '수락하기',
          icon: '/icons/action-accept.png'
        }
      ];
    case 'schedule':
      return [
        {
          action: 'view_schedule',
          title: '일정 보기',
          icon: '/icons/action-calendar.png'
        }
      ];
    case 'earnings':
      return [
        {
          action: 'view_earnings',
          title: '수익 확인',
          icon: '/icons/action-earnings.png'
        }
      ];
    default:
      return [
        {
          action: 'open',
          title: '열기',
          icon: '/icons/action-open.png'
        }
      ];
  }
}

// 백그라운드 데이터 동기화
async function syncExpertData() {
  try {
    console.log('[ServiceWorker] Syncing expert data');
    
    // 오프라인 상태에서 쌓인 작업들 처리
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    // 동기화가 필요한 요청만 필터링
    const syncRequests = requests.filter(req => 
      req.url.includes('/orders') || 
      req.url.includes('/schedule') ||
      req.url.includes('/earnings')
    );

    // 최신 데이터로 캐시 업데이트
    for (const request of syncRequests.slice(0, 5)) { // 최대 5개만 처리
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.log('[ServiceWorker] Sync failed for:', request.url);
      }
    }

    console.log('[ServiceWorker] Expert data sync completed');
  } catch (error) {
    console.log('[ServiceWorker] Sync failed:', error);
  }
}