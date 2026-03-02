import { Type } from '@sinclair/typebox';

export const DashboardMetricsSchema = Type.Object({
  totalOrders: Type.Number(),
  ordersTrend: Type.Number(),
  totalRevenue: Type.Number(),
  revenueTrend: Type.Number(),
  activeCustomers: Type.Number(),
  customersTrend: Type.Number(),
  totalExperts: Type.Number(),
  expertsTrend: Type.Number()
});

export const RevenueDataSchema = Type.Object({
  date: Type.String(),
  revenue: Type.Number(),
  orders: Type.Number()
});

export const OrderStatusDistributionSchema = Type.Object({
  status: Type.String(),
  count: Type.Number(),
  percentage: Type.Number()
});

export const RecentOrderSchema = Type.Object({
  id: Type.String(),
  orderNumber: Type.String(),
  customer: Type.Object({
    id: Type.String(),
    name: Type.String(),
    profileImage: Type.Optional(Type.String())
  }),
  expert: Type.Optional(Type.Object({
    id: Type.String(),
    name: Type.String()
  })),
  service: Type.Object({
    id: Type.String(),
    name: Type.String()
  }),
  totalAmount: Type.Number(),
  status: Type.String(),
  createdAt: Type.String()
});

export const PendingReviewSchema = Type.Object({
  id: Type.String(),
  customer: Type.Object({
    id: Type.String(),
    name: Type.String(),
    profileImage: Type.Optional(Type.String())
  }),
  expert: Type.Object({
    id: Type.String(),
    name: Type.String()
  }),
  rating: Type.Number(),
  content: Type.Optional(Type.String()),
  status: Type.String(),
  createdAt: Type.String()
});