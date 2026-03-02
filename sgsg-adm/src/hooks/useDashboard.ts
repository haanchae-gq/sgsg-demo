import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { 
  DashboardMetrics, 
  RevenueData, 
  OrderStatusDistribution,
  Order,
  Review
} from '../types';

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusDistribution[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        metricsResponse,
        revenueResponse,
        orderStatusResponse,
        ordersResponse,
        reviewsResponse
      ] = await Promise.allSettled([
        apiService.getDashboardMetrics(),
        apiService.getRevenueData(30),
        apiService.getOrderStatusDistribution(),
        apiService.getRecentOrders(10),
        apiService.getPendingReviews(5)
      ]);

      if (metricsResponse.status === 'fulfilled') {
        setMetrics(metricsResponse.value.data);
      }

      if (revenueResponse.status === 'fulfilled') {
        setRevenueData(revenueResponse.value.data);
      }

      if (orderStatusResponse.status === 'fulfilled') {
        setOrderStatusData(orderStatusResponse.value.data);
      }

      if (ordersResponse.status === 'fulfilled') {
        setRecentOrders(ordersResponse.value.data.items || ordersResponse.value.data);
      }

      if (reviewsResponse.status === 'fulfilled') {
        setPendingReviews(reviewsResponse.value.data.items || reviewsResponse.value.data);
      }

    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || '대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    try {
      await apiService.approveReview(reviewId);
      setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (err: any) {
      console.error('Review approval error:', err);
      throw new Error('리뷰 승인에 실패했습니다.');
    }
  };

  const rejectReview = async (reviewId: string, reason: string = '관리자 검토 결과 부적절한 내용') => {
    try {
      await apiService.rejectReview(reviewId, reason);
      setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (err: any) {
      console.error('Review rejection error:', err);
      throw new Error('리뷰 거부에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    // Data
    metrics,
    revenueData,
    orderStatusData,
    recentOrders,
    pendingReviews,
    
    // States
    loading,
    error,
    
    // Actions
    refreshData: fetchDashboardData,
    approveReview,
    rejectReview
  };
};