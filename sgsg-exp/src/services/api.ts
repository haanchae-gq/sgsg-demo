import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Vite 프록시 사용
  timeout: 30000,
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('sgsg-auth');
  if (authData) {
    try {
      const { accessToken } = JSON.parse(authData);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Failed to parse auth data:', error);
    }
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
      
      const authData = localStorage.getItem('sgsg-auth');
      if (authData) {
        try {
          const { refreshToken } = JSON.parse(authData);
          if (refreshToken) {
            const response = await axios.post('/api/v1/auth/refresh', {
              refreshToken
            });
            
            const { accessToken } = response.data.data;
            const updatedAuthData = { 
              ...JSON.parse(authData), 
              accessToken 
            };
            localStorage.setItem('sgsg-auth', JSON.stringify(updatedAuthData));
            
            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('sgsg-auth');
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;