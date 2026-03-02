// Common types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'expert' | 'customer';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  status: 'active' | 'inactive' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expert {
  id: string;
  name: string;
  businessName: string;
  businessNumber: string;
  email: string;
  phone?: string;
  profileImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  operatingStatus: 'online' | 'offline' | 'busy';
  rating: number;
  completedOrders: number;
  totalEarnings: number;
  portfolio: PortfolioItem[];
  createdAt: string;
  approvedAt?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  completedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: ServiceCategory[];
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  category?: ServiceCategory;
  basePrice: number;
  estimatedDuration: number; // in minutes
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  expertId?: string;
  expert?: Expert;
  serviceId: string;
  service?: ServiceItem;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  depositAmount?: number;
  balanceAmount?: number;
  notes?: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'expert_assigned'
  | 'schedule_pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'as_requested';

export type PaymentStatus = 
  | 'unpaid'
  | 'deposit_paid'
  | 'balance_paid'
  | 'refunded'
  | 'partially_refunded';

export interface Payment {
  id: string;
  orderId: string;
  order?: Order;
  amount: number;
  type: 'deposit' | 'balance' | 'full' | 'refund';
  method: 'card' | 'transfer' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customer?: Customer;
  expertId: string;
  expert?: Expert;
  rating: number;
  title?: string;
  content?: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  moderatorNotes?: string;
  createdAt: string;
  moderatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// Dashboard specific types
export interface DashboardMetrics {
  totalOrders: number;
  ordersTrend: number;
  totalRevenue: number;
  revenueTrend: number;
  activeCustomers: number;
  customersTrend: number;
  totalExperts: number;
  expertsTrend: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  count: number;
  percentage: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface CustomerFilterForm {
  search?: string;
  status?: Customer['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpertFilterForm {
  search?: string;
  status?: Expert['status'];
  operatingStatus?: Expert['operatingStatus'];
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderFilterForm {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  expertId?: string;
  customerId?: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  permissions: string[];
}

// Store types
export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface UIState {
  sidebarCollapsed: boolean;
  loading: boolean;
  currentModal: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}