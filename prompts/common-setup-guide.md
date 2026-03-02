# 🔧 SGSG 프론트엔드 공통 설정 가이드

**대상**: 프론트엔드 구현 에이전트 (1, 2, 3)  
**목적**: 일관된 개발 환경 및 코드 품질 보장

---

## 📦 프로젝트별 포트 할당

| 프로젝트 | 디렉토리 | 포트 | 용도 |
|---------|----------|------|------|
| API 서버 | `sgsg-api` | 4000 | 백엔드 API |
| 관리자 대시보드 | `sgsg-adm` | 3001 | 데스크톱 관리자 |
| 전문가 모바일 | `sgsg-exp` | 3002 | 모바일 전문가 |
| 고객 마켓플레이스 | `sgsg-customer` | 3003 | 모바일 고객 |

## 🛠️ 공통 라이브러리 스택

### **핵심 의존성** (모든 프로젝트)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0", 
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "dayjs": "^1.11.0",
    "lodash": "^4.17.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/lodash": "^4.14.0",
    "@vitejs/plugin-react": "^4.1.0",
    "typescript": "^5.2.0", 
    "vite": "^4.4.0"
  }
}
```

### **프로젝트별 특수 의존성**

#### 관리자 대시보드 (`sgsg-adm`)
```bash
npm install antd @ant-design/icons
npm install recharts 
npm install @ant-design/pro-layout  # 선택사항
```

#### 전문가/고객 모바일 (`sgsg-exp`, `sgsg-customer`)  
```bash
npm install antd-mobile @ant-design/icons
npm install swiper react-use
npm install @react-spring/web  # 애니메이션
```

## 🔧 Vite 공통 설정

### **기본 vite.config.ts**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // 프로젝트별로 변경 (3001, 3002, 3003)
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd-mobile', 'dayjs'],
  },
  define: {
    global: 'globalThis',
  },
});
```

## 🎨 공통 스타일 설정

### **전역 CSS** (`src/styles/global.css`)
```css
/* 폰트 임포트 */
@import url('https://unpkg.com/pretendard/dist/web/variable/pretendard-variable.css');

/* CSS 리셋 */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', 'Roboto', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #262626;
  background-color: #ffffff;
}

/* 모바일 최적화 */
button, input, select, textarea {
  font-family: inherit;
}

/* 터치 최적화 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* 유틸리티 클래스 */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }

.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

.p-8 { padding: 8px; }
.p-16 { padding: 16px; }
.p-24 { padding: 24px; }
```

### **변수 정의** (`src/styles/variables.ts`)
```typescript
export const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800', 
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    text: {
      primary: '#262626',
      secondary: '#8c8c8c',
      disabled: '#bfbfbf'
    },
    background: {
      default: '#ffffff',
      paper: '#fafafa',
      disabled: '#f5f5f5'
    },
    border: {
      default: '#d9d9d9',
      light: '#f0f0f0'
    }
  },
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
};
```

## 🔍 공통 유틸리티 함수

### **날짜/시간 포맷팅** (`src/utils/formatters.ts`)
```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ko');
dayjs.extend(relativeTime);

export const formatDate = (date: string | Date, format = 'YYYY년 MM월 DD일') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};
```

### **상태 표시 유틸리티** (`src/utils/status.ts`)
```typescript
export const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '대기 중',
    'confirmed': '확정됨',
    'expert_assigned': '전문가 배정',
    'schedule_pending': '일정 대기',
    'scheduled': '일정 확정',
    'in_progress': '진행 중',
    'completed': '완료',
    'cancelled': '취소됨',
    'as_requested': '요청대로 처리'
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'pending': 'orange',
    'confirmed': 'blue',
    'expert_assigned': 'cyan',
    'schedule_pending': 'geekblue', 
    'scheduled': 'green',
    'in_progress': 'green',
    'completed': 'default',
    'cancelled': 'red',
    'as_requested': 'purple'
  };
  return colorMap[status] || 'default';
};

export const getPaymentStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'unpaid': '미결제',
    'deposit_paid': '선금 완료',
    'balance_paid': '잔금 완료', 
    'refunded': '환불됨',
    'partially_refunded': '부분 환불'
  };
  return statusMap[status] || status;
};
```

## 🔐 공통 인증 처리

### **인증 스토어** (`src/stores/authStore.ts`)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: TokenData, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (tokens, user) => {
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      updateUser: (userData) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      }
    }),
    {
      name: 'sgsg-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

### **Protected Route** (`src/components/common/ProtectedRoute.tsx`)
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'expert' | 'admin';
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return fallback || <div>접근 권한이 없습니다</div>;
  }

  return <>{children}</>;
};
```

## 📱 공통 모바일 컴포넌트

### **하단 네비게이션** (`src/components/common/BottomNavigation.tsx`)
```typescript
interface BottomNavigationProps {
  activeTab: string;
  items: NavigationItem[];
  onChange: (key: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  items,
  onChange
}) => (
  <TabBar
    activeKey={activeTab} 
    onChange={onChange}
    className="bottom-navigation"
  >
    {items.map(item => (
      <TabBar.Item
        key={item.key}
        icon={item.icon}
        title={item.label}
        badge={item.badge}
      />
    ))}
  </TabBar>
);
```

### **검색 바** (`src/components/common/SearchBar.tsx`)  
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  showLocation?: boolean;
  showVoice?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "검색어를 입력하세요",
  onSearch,
  showLocation = false,
  showVoice = false
}) => {
  // 구현 내용은 screen-implementation-guide.md 참고
};
```

## 🌐 API 호출 표준 패턴

### **API 클라이언트** (`src/services/api.ts`)
```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api/v1', // Vite 프록시 사용
  timeout: 30000,
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터 (토큰 갱신)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { refreshToken, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          useAuthStore.getState().login(
            { accessToken, refreshToken },
            useAuthStore.getState().user!
          );
          
          return api(originalRequest);
        } catch {
          logout();
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### **React Query 설정** (`src/providers/QueryProvider.tsx`)
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // 401, 403 에러는 재시도하지 않음
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    },
    mutations: {
      onError: (error: any) => {
        // 전역 에러 처리
        console.error('Mutation error:', error);
      }
    }
  }
});

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
  </QueryClientProvider>
);
```

## 🎯 타입스크립트 설정

### **tsconfig.json** (공통)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🔄 상태 관리 패턴

### **전역 상태 구조**
```typescript
// stores/index.ts
export { useAuthStore } from './authStore';
export { useUIStore } from './uiStore'; 
export { useNotificationStore } from './notificationStore';

// UI 상태 (모달, 드로어 등)
interface UIState {
  sidebarVisible: boolean;
  currentModal: string | null;
  loading: boolean;
  showSidebar: () => void;
  hideSidebar: () => void;
  showModal: (modal: string) => void;
  hideModal: () => void;
  setLoading: (loading: boolean) => void;
}

// 알림 상태  
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}
```

## 🚨 에러 처리 표준

### **에러 바운더리** (`src/components/common/ErrorBoundary.tsx`)
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 에러 로깅 서비스로 전송
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <Result
            status="500"
            title="문제가 발생했습니다"
            subTitle="페이지를 새로고침하거나 다시 시도해보세요"
            extra={
              <Button
                type="primary"
                onClick={() => window.location.reload()}
              >
                새로고침
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **API 에러 처리** (`src/utils/errorHandler.ts`)
```typescript
import { message, notification } from 'antd';
// 모바일에서는 antd-mobile의 Toast 사용

export const handleApiError = (error: any, context?: string) => {
  const errorData = error.response?.data;
  
  if (errorData?.error) {
    const { code, message: errorMessage } = errorData.error;
    
    switch (code) {
      case 'AUTH_001':
        message.warning('로그인이 필요합니다');
        // 로그인 페이지로 리다이렉트
        break;
        
      case 'AUTH_002':  
        message.error('접근 권한이 없습니다');
        break;
        
      case 'VALIDATION_ERROR':
        message.error('입력 정보를 확인해주세요');
        break;
        
      case 'NOT_FOUND':
        message.error('요청한 데이터를 찾을 수 없습니다');
        break;
        
      default:
        message.error(errorMessage || '오류가 발생했습니다');
    }
  } else if (error.code === 'NETWORK_ERROR') {
    notification.error({
      message: '네트워크 오류',
      description: '인터넷 연결을 확인하고 다시 시도해주세요'
    });
  } else {
    message.error('알 수 없는 오류가 발생했습니다');
  }
  
  // 에러 로깅
  console.error(`[${context || 'API'}] Error:`, error);
};
```

## 📊 개발 가이드라인

### **코드 컨벤션**
- **컴포넌트**: PascalCase (`UserProfile.tsx`)
- **파일명**: camelCase (`userService.ts`)
- **상수**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **CSS 클래스**: kebab-case (`user-profile`)

### **폴더 구조 컨벤션**
- **pages/screens**: 라우트와 1:1 매칭되는 컴포넌트
- **components**: 재사용 가능한 컴포넌트
- **hooks**: Custom React hooks
- **services**: API 호출 로직
- **stores**: 전역 상태 관리
- **utils**: 순수 함수 유틸리티

### **Import 순서**
```typescript
// 1. React 및 라이브러리
import React from 'react';
import { Button, Card } from 'antd';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 컴포넌트
import { UserCard } from '@/components/UserCard';

// 3. 훅 및 서비스
import { useAuth } from '@/hooks/useAuth'; 
import api from '@/services/api';

// 4. 타입 및 상수
import type { User } from '@/types/user';
import { API_ENDPOINTS } from '@/constants/api';
```

## 🧪 테스팅 가이드라인

### **테스트 도구** (선택사항)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

### **테스트 파일 명명**
- **단위 테스트**: `ComponentName.test.tsx`
- **통합 테스트**: `ComponentName.integration.test.tsx`
- **E2E 테스트**: `feature.e2e.test.tsx`

## 🚀 시작 체크리스트

### **에이전트 1 (관리자)**
- [ ] `sgsg-adm` 폴더 확인
- [ ] 의존성 설치 여부 확인
- [ ] 개발 서버 실행 (포트 3001)
- [ ] Dashboard.tsx 구현 시작

### **에이전트 2 (전문가)**  
- [ ] `sgsg-exp` 폴더 확인
- [ ] 의존성 설치 여부 확인  
- [ ] 개발 서버 실행 (포트 3002)
- [ ] Login.tsx 구현 시작

### **에이전트 3 (고객)**
- [ ] `sgsg-customer` 프로젝트 생성
- [ ] 의존성 설치 및 초기 설정
- [ ] 개발 서버 실행 (포트 3003)
- [ ] Home.tsx 구현 시작

## ⚠️ 주의사항

1. **포트 충돌 방지**: 각 프로젝트는 지정된 포트 사용
2. **API 의존성**: 백엔드 서버 (localhost:4000) 먼저 실행
3. **공통 타입**: API 응답 타입은 일관성 유지
4. **브라우저 호환성**: 모던 브라우저 (Chrome 90+, Safari 14+)
5. **모바일 테스트**: 실제 모바일 기기에서 테스트 필수

모든 에이전트는 이 가이드를 먼저 읽고 해당 프로젝트의 개별 프롬프트를 따라 구현을 진행하세요! 🚀