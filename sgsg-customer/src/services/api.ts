import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Vite 프록시 통해 백엔드 연결
  timeout: 30000,
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      
      const refreshToken = localStorage.getItem('customerRefreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('customerAccessToken', accessToken);
          
          return api(originalRequest);
        } catch {
          localStorage.removeItem('customerAccessToken');
          localStorage.removeItem('customerRefreshToken');
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;