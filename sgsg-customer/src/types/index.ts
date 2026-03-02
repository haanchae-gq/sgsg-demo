// 공통 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'expert' | 'admin';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

// 서비스 관련
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  category?: ServiceCategory;
  name: string;
  description: string;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 전문가 관련
export interface Expert {
  id: string;
  userId: string;
  user?: User;
  businessName?: string;
  description?: string;
  profileImage?: string;
  rating: number;
  reviewCount: number;
  completedOrderCount: number;
  isVerified: boolean;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ExpertService {
  id: string;
  expertId: string;
  serviceItemId: string;
  serviceItem?: ServiceItem;
  price: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// 주문 관련
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  expertId?: string;
  serviceItemId: string;
  serviceItem?: ServiceItem;
  expert?: Expert;
  addressId: string;
  requestedDate: string;
  scheduledDate?: string;
  status: 'pending' | 'confirmed' | 'expert_assigned' | 'schedule_pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'as_requested';
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  customerNotes?: string;
  expertNotes?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 결제 관련
export interface Payment {
  id: string;
  orderId: string;
  order?: Order;
  paymentType: 'deposit' | 'balance' | 'full_payment';
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'mobile_payment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  pgTransactionId?: string;
  pgResponse?: any;
  refundAmount?: number;
  refundReason?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 리뷰 관련
export interface Review {
  id: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customer?: User;
  expertId: string;
  expert?: Expert;
  rating: number;
  title?: string;
  content: string;
  images: string[];
  expertReply?: string;
  expertRepliedAt?: string;
  isHelpful: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// 주소 관련
export interface Address {
  id: string;
  userId: string;
  name: string;
  address: string;
  addressDetail: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  contactName?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
  };
}

// 페이지네이션
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 검색 및 필터
export interface SearchParams {
  search?: string;
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius?: number;
  };
  sort?: 'popular' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

// 네비게이션
export interface NavigationItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

// 알림
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}