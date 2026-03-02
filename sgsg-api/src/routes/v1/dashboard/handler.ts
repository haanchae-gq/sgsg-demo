import { FastifyReply, FastifyRequest } from 'fastify';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export const getDashboardMetrics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    // Current period (last 30 days)
    const [
      currentOrders,
      currentRevenue,
      currentActiveCustomers,
      currentExperts
    ] = await Promise.all([
      // Total orders in last 30 days
      request.server.prisma.order.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Total revenue in last 30 days
      request.server.prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Active customers (ordered in last 30 days)
      request.server.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Total experts
      request.server.prisma.expert.count({
        where: {
          approvalStatus: 'APPROVED'
        }
      })
    ]);

    // Previous period (31-60 days ago)
    const [
      previousOrders,
      previousRevenue,
      previousActiveCustomers
    ] = await Promise.all([
      request.server.prisma.order.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      request.server.prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      request.server.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    // Calculate trends
    const ordersTrend = previousOrders > 0 ? 
      ((currentOrders - previousOrders) / previousOrders * 100) : 0;
    
    const currentRevenueValue = currentRevenue._sum.amount || 0;
    const previousRevenueValue = previousRevenue._sum.amount || 0;
    const revenueTrend = previousRevenueValue > 0 ? 
      ((currentRevenueValue - previousRevenueValue) / previousRevenueValue * 100) : 0;
    
    const currentActiveCustomersCount = currentActiveCustomers.length;
    const previousActiveCustomersCount = previousActiveCustomers.length;
    const customersTrend = previousActiveCustomersCount > 0 ? 
      ((currentActiveCustomersCount - previousActiveCustomersCount) / previousActiveCustomersCount * 100) : 0;

    reply.send({
      success: true,
      data: {
        totalOrders: currentOrders,
        ordersTrend: Math.round(ordersTrend * 100) / 100,
        totalRevenue: currentRevenueValue,
        revenueTrend: Math.round(revenueTrend * 100) / 100,
        activeCustomers: currentActiveCustomersCount,
        customersTrend: Math.round(customersTrend * 100) / 100,
        totalExperts: currentExperts,
        expertsTrend: 0 // Simplification for now
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'DASHBOARD_METRICS_ERROR',
        message: '대시보드 지표를 조회하는데 실패했습니다.'
      }
    });
  }
};

export const getRevenueData = async (
  request: FastifyRequest<{ Querystring: { days?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const days = parseInt(request.query.days || '30');
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Generate date range
    const dateRange = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i);
      dateRange.push({
        date: format(date, 'yyyy-MM-dd'),
        startOfDay: startOfDay(date),
        endOfDay: endOfDay(date)
      });
    }

    // Get daily revenue and order counts
    const revenueData = await Promise.all(
      dateRange.map(async ({ date, startOfDay: dayStart, endOfDay: dayEnd }) => {
        const [revenue, orders] = await Promise.all([
          request.server.prisma.payment.aggregate({
            where: {
              status: 'completed',
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            },
            _sum: {
              amount: true
            }
          }),
          
          request.server.prisma.order.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          })
        ]);

        return {
          date,
          revenue: revenue._sum.amount || 0,
          orders
        };
      })
    );

    reply.send({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Revenue data error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'REVENUE_DATA_ERROR',
        message: '매출 데이터를 조회하는데 실패했습니다.'
      }
    });
  }
};

export const getOrderStatusDistribution = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const orderStats = await request.server.prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalOrders = orderStats.reduce((sum, stat) => sum + stat._count.status, 0);

    const distribution = orderStats.map(stat => ({
      status: stat.status,
      count: stat._count.status,
      percentage: totalOrders > 0 ? (stat._count.status / totalOrders * 100) : 0
    }));

    reply.send({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Order status distribution error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'ORDER_STATUS_ERROR',
        message: '주문 상태 분포를 조회하는데 실패했습니다.'
      }
    });
  }
};

export const getRecentOrders = async (
  request: FastifyRequest<{ Querystring: { limit?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const limit = parseInt(request.query.limit || '10');

    const orders = await request.server.prisma.order.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        expert: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        serviceItem: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.user.name,
        profileImage: order.customer.user.avatarUrl
      } : null,
      expert: order.expert ? {
        id: order.expert.id,
        name: order.expert.user.name
      } : null,
      service: order.serviceItem,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    }));

    reply.send({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Recent orders error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'RECENT_ORDERS_ERROR',
        message: '최근 주문을 조회하는데 실패했습니다.'
      }
    });
  }
};

export const getPendingReviews = async (
  request: FastifyRequest<{ Querystring: { limit?: string } }>, 
  reply: FastifyReply
) => {
  try {
    const limit = parseInt(request.query.limit || '5');

    const reviews = await request.server.prisma.review.findMany({
      where: {
        isApproved: false,
        rejectedAt: null
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    avatarUrl: true
                  }
                }
              }
            },
            expert: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      customer: review.order.customer ? {
        id: review.order.customer.id,
        name: review.order.customer.user.name,
        profileImage: review.order.customer.user.avatarUrl
      } : null,
      expert: review.order.expert ? {
        id: review.order.expert.id,
        name: review.order.expert.user.name
      } : null,
      rating: review.rating,
      content: review.content,
      status: review.isApproved ? 'approved' : (review.rejectedAt ? 'rejected' : 'pending'),
      createdAt: review.createdAt.toISOString()
    }));

    reply.send({
      success: true,
      data: formattedReviews
    });
  } catch (error) {
    console.error('Pending reviews error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'PENDING_REVIEWS_ERROR',
        message: '대기 중인 리뷰를 조회하는데 실패했습니다.'
      }
    });
  }
};