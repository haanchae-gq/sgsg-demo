import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

export class ExpertPerformanceService {
  private prisma: PrismaClient

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma
  }

  /**
   * 최적화된 전문가 스케줄 조회 (인덱스 활용)
   */
  async getOptimizedSchedules(expertId: string, options: {
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { date, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // 복합 인덱스 활용을 위한 조건 순서 최적화
    const where: any = { expertId };
    
    // 날짜 조건 (인덱스 최적화)
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);
      where.scheduledDate = { gte: targetDate, lt: nextDate };
    }
    
    // 상태 조건 (부분 인덱스 활용)
    if (status) {
      where.status = status;
    }

    // 병렬로 개수와 데이터 조회
    const [schedules, total] = await Promise.all([
      this.prisma.serviceSchedule.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          expertId: true,
          scheduledDate: true,
          startTime: true,
          endTime: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          // 관련 데이터 선택적 로딩
          order: {
            select: {
              id: true,
              orderNumber: true,
              serviceItem: {
                select: { name: true }
              },
              customer: {
                select: {
                  user: {
                    select: { name: true, phone: true }
                  }
                }
              },
              address: {
                select: {
                  addressLine1: true,
                  addressLine2: true,
                  city: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { scheduledDate: 'asc' }
      }),
      this.prisma.serviceSchedule.count({ where })
    ])

    return {
      schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 최적화된 서브 계정 조회
   */
  async getOptimizedSubAccounts(masterAccountId: string, options: {
    activeStatus?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { activeStatus, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { masterAccountId };
    if (activeStatus) where.activeStatus = activeStatus;

    // 선택적 필드 로딩으로 성능 최적화
    const [subAccounts, total] = await Promise.all([
      this.prisma.subAccount.findMany({
        where,
        select: {
          id: true,
          masterAccountId: true,
          userId: true,
          accountType: true,
          approvalStatus: true,
          activeStatus: true,
          permissions: true,
          assignedWorkerId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.subAccount.count({ where })
    ])

    return { subAccounts, total }
  }

  /**
   * 최적화된 배정 이력 조회
   */
  async getOptimizedAssignmentHistory(expertId: string, options: {
    startDate?: string;
    endDate?: string;
    assignmentType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { startDate, endDate, assignmentType, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { assignedMasterId: expertId };
    
    // 날짜 범위 조건 (인덱스 최적화)
    if (startDate && endDate) {
      where.assignedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    if (assignmentType) where.assignmentType = assignmentType;
    if (status) where.assignmentResultStatus = status;

    const [assignments, total] = await Promise.all([
      this.prisma.assignmentHistory.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          assignedMasterId: true,
          assignedWorkerId: true,
          assignmentType: true,
          assignmentResultStatus: true,
          isMembershipAssignment: true,
          membershipSlotCountAtTime: true,
          weightAtTime: true,
          serviceMidAtTime: true,
          regionGroupAtTime: true,
          assignedAt: true,
          respondedAt: true,
          // 관련 데이터 
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              serviceItem: {
                select: { name: true }
              },
              customer: {
                select: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          assignedWorker: {
            select: {
              id: true,
              user: {
                select: { name: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' }
      }),
      this.prisma.assignmentHistory.count({ where })
    ])

    return { assignments, total }
  }

  /**
   * 캐시된 전문가 통계 조회
   */
  async getCachedExpertStatistics(expertId: string) {
    // 이번 달 시작과 끝
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // 오늘 시작과 끝
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    // 전문가 기본 정보 (이미 캐시된 정보 활용)
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        totalCompletedOrders: true,
        totalEarnings: true,
        rating: true
      }
    });

    if (!expert) {
      throw {
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }
    }

    // 병렬로 통계 데이터 조회 (인덱스 활용)
    const [thisMonthOrders, pendingOrders, totalReviews, todaySchedules] = await Promise.all([
      // 이번 달 주문 수 (인덱스: orders_expert_month)
      this.prisma.order.count({
        where: {
          expertId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      // 대기 중인 주문 수 (인덱스: orders_expert_status_date)
      this.prisma.order.count({
        where: {
          expertId,
          status: { in: ['new', 'schedule_pending', 'schedule_confirmed'] }
        }
      }),
      // 총 리뷰 수 (인덱스: reviews_expert_stats)
      this.prisma.review.count({
        where: { expertId, isApproved: true }
      }),
      // 오늘 스케줄 수
      this.prisma.serviceSchedule.count({
        where: {
          expertId,
          scheduledDate: { gte: startOfDay, lt: endOfDay }
        }
      })
    ]);

    return {
      totalOrders: expert.totalCompletedOrders,
      completedOrders: expert.totalCompletedOrders,
      totalEarnings: expert.totalEarnings,
      averageRating: expert.rating || 0,
      totalReviews,
      thisMonthOrders,
      thisMonthEarnings: 0, // TODO: 실제 이번 달 수익 계산 최적화
      pendingOrders,
      todaySchedules,
      // 캐시 정보
      cachedAt: new Date().toISOString(),
      dataSource: 'optimized_query'
    };
  }

  /**
   * 전문가 대시보드 데이터 한 번에 조회 (JOIN 최적화)
   */
  async getExpertDashboardData(expertId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // 오늘 날짜 범위
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(startOfToday.getDate() + 1);

    // 한 번의 복잡한 쿼리로 모든 대시보드 데이터 조회
    const [
      expertInfo,
      monthlyStats,
      todaySchedules,
      recentAssignments,
      activePenalties,
      membershipInfo
    ] = await Promise.all([
      // 전문가 기본 정보
      this.prisma.expert.findUnique({
        where: { id: expertId },
        select: {
          totalCompletedOrders: true,
          totalEarnings: true,
          rating: true,
          membershipEnabled: true,
          membershipSlotCount: true
        }
      }),
      
      // 이번 달 통계
      this.prisma.order.aggregate({
        _count: { id: true },
        where: {
          expertId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      }),

      // 오늘 스케줄 (상위 5개만)
      this.prisma.serviceSchedule.findMany({
        where: {
          expertId,
          scheduledDate: { gte: startOfToday, lt: endOfToday }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          order: {
            select: {
              orderNumber: true,
              serviceItem: { select: { name: true } },
              customer: { select: { user: { select: { name: true } } } }
            }
          }
        },
        take: 5,
        orderBy: { startTime: 'asc' }
      }),

      // 최근 배정 이력 (상위 3개만)
      this.prisma.assignmentHistory.findMany({
        where: { assignedMasterId: expertId },
        select: {
          id: true,
          assignmentType: true,
          assignmentResultStatus: true,
          assignedAt: true,
          order: {
            select: {
              orderNumber: true,
              serviceItem: { select: { name: true } }
            }
          }
        },
        take: 3,
        orderBy: { assignedAt: 'desc' }
      }),

      // 활성 패널티 수
      this.prisma.penaltyHistory.count({
        where: {
          masterAccountId: expertId,
          penaltyStatus: 'ACTIVE',
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ]
        }
      }),

      // 멤버십 및 서브 계정 정보
      this.prisma.subAccount.count({
        where: {
          masterAccountId: expertId,
          activeStatus: 'ACTIVE'
        }
      })
    ]);

    return {
      expert: expertInfo,
      monthlyOrderCount: monthlyStats._count.id,
      todaySchedules,
      recentAssignments,
      activePenaltiesCount: activePenalties,
      activeSubAccountCount: membershipInfo,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * 배치 성능 최적화 - 다중 전문가 통계 조회
   */
  async getBatchExpertStatistics(expertIds: string[]) {
    // IN 쿼리로 한 번에 여러 전문가 데이터 조회
    const experts = await this.prisma.expert.findMany({
      where: { id: { in: expertIds } },
      select: {
        id: true,
        userId: true,
        totalCompletedOrders: true,
        totalEarnings: true,
        rating: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // 주문 통계 배치 조회
    const orderStats = await this.prisma.order.groupBy({
      by: ['expertId'],
      where: {
        expertId: { in: expertIds },
        status: { in: ['paid', 'as_requested'] }
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // 결과 매핑
    const results = experts.map(expert => {
      const stats = orderStats.find(stat => stat.expertId === expert.id);
      return {
        expertId: expert.id,
        expertName: expert.user.name,
        email: expert.user.email,
        totalOrders: expert.totalCompletedOrders,
        totalEarnings: expert.totalEarnings,
        rating: expert.rating,
        monthlyOrders: stats?._count.id || 0,
        monthlyEarnings: stats?._sum.totalAmount || 0
      };
    });

    return results;
  }

  /**
   * 실시간 성능 모니터링을 위한 메트릭스
   */
  async getPerformanceMetrics() {
    const [
      activeExpertsCount,
      todaySchedulesCount,
      pendingAssignmentsCount,
      unreadNotificationsCount
    ] = await Promise.all([
      this.prisma.expert.count({
        where: { activeStatus: 'ACTIVE' }
      }),
      
      this.prisma.serviceSchedule.count({
        where: {
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),

      this.prisma.assignmentHistory.count({
        where: { assignmentResultStatus: 'SENT' }
      }),

      this.prisma.notification.count({
        where: { isRead: false }
      })
    ]);

    return {
      activeExperts: activeExpertsCount,
      todaySchedules: todaySchedulesCount,
      pendingAssignments: pendingAssignmentsCount,
      unreadNotifications: unreadNotificationsCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 데이터베이스 연결 풀 상태 조회
   */
  async getDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // 간단한 쿼리로 응답 시간 측정
      await this.prisma.$queryRaw`SELECT 1`;
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 활성 연결 수 조회 (PostgreSQL 특화)
      const activeConnections = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active' AND datname = current_database();
      `;

      return {
        responseTime: `${responseTime}ms`,
        activeConnections: activeConnections[0]?.count || 0,
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        responseTime: 'error',
        activeConnections: 0,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 전문가별 성능 점수 계산
   */
  async calculateExpertPerformanceScore(expertId: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        rating: true,
        totalCompletedOrders: true
      }
    });

    if (!expert) {
      throw { code: 'EXPERT_001', message: '전문가를 찾을 수 없습니다.' }
    }

    // 최근 30일 배정 통계
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [acceptanceStats, timeoutStats] = await Promise.all([
      this.prisma.assignmentHistory.count({
        where: {
          assignedMasterId: expertId,
          assignedAt: { gte: thirtyDaysAgo },
          assignmentResultStatus: 'ACCEPTED'
        }
      }),
      this.prisma.assignmentHistory.count({
        where: {
          assignedMasterId: expertId,
          assignedAt: { gte: thirtyDaysAgo },
          assignmentResultStatus: 'TIMEOUT'
        }
      })
    ]);

    const totalAssignments = acceptanceStats + timeoutStats;
    const acceptanceRate = totalAssignments > 0 ? acceptanceStats / totalAssignments : 1;
    const timeoutRate = totalAssignments > 0 ? timeoutStats / totalAssignments : 0;

    // 성능 점수 계산 (0-100점)
    const ratingScore = (expert.rating || 0) * 20; // 최대 100점 (5점 만점)
    const acceptanceScore = acceptanceRate * 30; // 최대 30점
    const experienceScore = Math.min(expert.totalCompletedOrders * 0.5, 20); // 최대 20점
    const timeoutPenalty = timeoutRate * 30; // 최대 -30점

    const totalScore = Math.max(0, Math.min(100, 
      ratingScore + acceptanceScore + experienceScore - timeoutPenalty
    ));

    return {
      totalScore: Math.round(totalScore),
      breakdown: {
        rating: { score: Math.round(ratingScore), weight: '40%' },
        acceptance: { score: Math.round(acceptanceScore), weight: '30%' },
        experience: { score: Math.round(experienceScore), weight: '20%' },
        timeout: { penalty: Math.round(timeoutPenalty), weight: '-30%' }
      },
      stats: {
        totalAssignments,
        acceptanceRate: Math.round(acceptanceRate * 100),
        timeoutRate: Math.round(timeoutRate * 100)
      },
      calculatedAt: new Date().toISOString()
    };
  }
}