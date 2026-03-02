import axios, { AxiosInstance } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for global error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard APIs
  async getDashboardMetrics() {
    const response = await this.client.get('/dashboard/metrics');
    return response.data;
  }

  async getRevenueData(days: number = 30) {
    const response = await this.client.get(`/dashboard/revenue?days=${days}`);
    return response.data;
  }

  async getOrderStatusDistribution() {
    const response = await this.client.get('/dashboard/order-status-distribution');
    return response.data;
  }

  async getRecentOrders(limit: number = 10) {
    const response = await this.client.get(`/dashboard/recent-orders?limit=${limit}`);
    return response.data;
  }

  async getPendingReviews(limit: number = 5) {
    const response = await this.client.get(`/dashboard/pending-reviews?limit=${limit}`);
    return response.data;
  }

  // Customer APIs
  async getCustomers(params: any = {}) {
    const response = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomer(id: string) {
    const response = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async updateCustomerStatus(id: string, status: string) {
    const response = await this.client.patch(`/customers/${id}/status`, { status });
    return response.data;
  }

  // Expert APIs
  async getExperts(params: any = {}) {
    const response = await this.client.get('/experts', { params });
    return response.data;
  }

  async getExpert(id: string) {
    const response = await this.client.get(`/experts/${id}`);
    return response.data;
  }

  async approveExpert(id: string, notes?: string) {
    const response = await this.client.post(`/experts/${id}/approve`, { notes });
    return response.data;
  }

  async rejectExpert(id: string, reason: string) {
    const response = await this.client.post(`/experts/${id}/reject`, { reason });
    return response.data;
  }

  // Order APIs
  async getOrders(params: any = {}) {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: string, status: string) {
    const response = await this.client.patch(`/orders/${id}/status`, { status });
    return response.data;
  }

  // Payment APIs
  async getPayments(params: any = {}) {
    const response = await this.client.get('/payments', { params });
    return response.data;
  }

  async refundPayment(id: string, amount: number, reason: string) {
    const response = await this.client.post(`/payments/${id}/refund`, { amount, reason });
    return response.data;
  }

  // Review APIs
  async getReviews(params: any = {}) {
    const response = await this.client.get('/reviews', { params });
    return response.data;
  }

  async approveReview(id: string) {
    const response = await this.client.post(`/reviews/${id}/approve`);
    return response.data;
  }

  async rejectReview(id: string, reason: string) {
    const response = await this.client.post(`/reviews/${id}/reject`, { reason });
    return response.data;
  }

  // Service Categories APIs
  async getServiceCategories() {
    const response = await this.client.get('/service-categories');
    return response.data;
  }

  async createServiceCategory(data: any) {
    const response = await this.client.post('/service-categories', data);
    return response.data;
  }

  async updateServiceCategory(id: string, data: any) {
    const response = await this.client.patch(`/service-categories/${id}`, data);
    return response.data;
  }

  async deleteServiceCategory(id: string) {
    const response = await this.client.delete(`/service-categories/${id}`);
    return response.data;
  }

  // Service Items APIs
  async getServiceItems(params: any = {}) {
    const response = await this.client.get('/service-items', { params });
    return response.data;
  }

  async createServiceItem(data: any) {
    const response = await this.client.post('/service-items', data);
    return response.data;
  }

  async updateServiceItem(id: string, data: any) {
    const response = await this.client.patch(`/service-items/${id}`, data);
    return response.data;
  }

  async deleteServiceItem(id: string) {
    const response = await this.client.delete(`/service-items/${id}`);
    return response.data;
  }

  // Notification APIs
  async getNotifications(params: any = {}) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  // Auth APIs
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await this.client.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }
}

export default new ApiService();