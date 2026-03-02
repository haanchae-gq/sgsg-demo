import { PrismaClient } from '@prisma/client';
import { AppError } from '../types/errors.js';
import { OrderStatus, ReportReason, ReportStatus } from '@prisma/client';
import { NotificationService } from './notification.service.js';

export interface CreateReviewData {
  orderId: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  title?: string | null;
  content?: string;
  images?: string[];
}

export interface ReviewListFilters {
  page?: number;
  limit?: number;
  expertId?: string;
  customerId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  isApproved?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ReviewWithRelations {
  id: string;
  orderId: string;
  customerId: string;
  expertId: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  isVerified: boolean;
  isApproved: boolean;
  approvedAt: Date | null;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    user: {
      name: string;
      avatarUrl: string | null;
    };
  };
  expert?: {
    id: string;
    businessName: string;
    rating: number | null;
    user: {
      name: string;
      avatarUrl: string | null;
    };
  };
  order?: {
    id: string;
    orderNumber: string;
    serviceItem: {
      name: string;
      category: {
        name: string;
      };
    };
  };
  isHelpfulByCurrentUser?: boolean;
}

export class ReviewService {
  private notificationService: NotificationService;

  constructor(private prisma: PrismaClient) {
    this.notificationService = new NotificationService(prisma);
  }

  /**
   * 리뷰 작성 (주문 완료된 고객만 가능)
   */
  async createReview(customerId: string, data: CreateReviewData): Promise<ReviewWithRelations> {
    // 주문 정보 확인
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        customer: true,
        expert: true,
        serviceItem: {
          include: {
            category: true
          }
        }
      }
    });

    if (!order) {
      throw new AppError('NOT_FOUND_003', '주문을 찾을 수 없습니다.', 404);
    }

    // 주문의 고객인지 확인
    if (order.customerId !== customerId) {
      throw new AppError('FORBIDDEN_003', '해당 주문의 고객이 아닙니다.', 403);
    }

    // 주문이 완료되었는지 확인
    if (order.status !== OrderStatus.as_requested) {
      throw new AppError('VALIDATION_004', '완료된 주문에 대해서만 리뷰를 작성할 수 있습니다.', 400);
    }

    // 리뷰 작성 기간 확인 (주문 완료 후 30일 이내)
    if (order.completedAt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (order.completedAt < thirtyDaysAgo) {
        throw new AppError('VALIDATION_005', '주문 완료 후 30일 이내에만 리뷰를 작성할 수 있습니다.', 400);
      }
    }

    // 이미 리뷰가 있는지 확인
    const existingReview = await this.prisma.review.findUnique({
      where: { orderId: data.orderId }
    });

    if (existingReview) {
      throw new AppError('VALIDATION_006', '이미 해당 주문에 대한 리뷰가 존재합니다.', 400);
    }

    // 리뷰 생성
    const review = await this.prisma.review.create({
      data: {
        orderId: data.orderId,
        customerId: customerId,
        expertId: order.expertId!,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images || [],
        isVerified: true,
        isApproved: false // 관리자 승인 필요
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        expert: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        order: {
          include: {
            serviceItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // 전문가 평점 업데이트
    await this.updateExpertRating(order.expertId!);

    // 전문가에게 새 리뷰 알림 발송
    await this.notificationService.notifyExpertAboutNewReview(
      order.expertId!,
      data.orderId,
      review.customer.user.name,
      data.rating
    );

    return review;
  }

  /**
   * 리뷰 목록 조회
   */
  async getReviews(filters: ReviewListFilters, currentUserId?: string): Promise<{
    reviews: ReviewWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    statistics?: {
      averageRating: number | null;
      totalReviews: number;
      ratingDistribution: Record<number, number>;
    };
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};

    if (filters.expertId) {
      where.expertId = filters.expertId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.rating) {
      where.rating = filters.rating;
    }

    if (filters.minRating || filters.maxRating) {
      where.rating = {};
      if (filters.minRating) {
        where.rating.gte = filters.minRating;
      }
      if (filters.maxRating) {
        where.rating.lte = filters.maxRating;
      }
    }

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // 정렬 조건
    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    // 리뷰 조회
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          expert: {
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true
                }
              }
            }
          },
          order: {
            include: {
              serviceItem: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      }),
      this.prisma.review.count({ where })
    ]);

    // 현재 사용자의 도움됨 표시 상태 조회
    let helpfulByCurrentUser: Record<string, boolean> = {};
    if (currentUserId && reviews.length > 0) {
      const reviewIds = reviews.map(r => r.id);
      const helpfulMarks = await this.prisma.reviewHelpful.findMany({
        where: {
          reviewId: { in: reviewIds },
          userId: currentUserId
        }
      });

      helpfulByCurrentUser = helpfulMarks.reduce((acc, mark) => {
        acc[mark.reviewId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // 리뷰에 도움됨 표시 상태 추가
    const reviewsWithHelpful = reviews.map(review => ({
      ...review,
      isHelpfulByCurrentUser: helpfulByCurrentUser[review.id] || false
    }));

    // 전문가별 통계 (expertId 필터가 있는 경우만)
    let statistics;
    if (filters.expertId) {
      const statsData = await this.prisma.review.aggregate({
        where: { expertId: filters.expertId, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true }
      });

      const ratingDistribution = await this.prisma.review.groupBy({
        by: ['rating'],
        where: { expertId: filters.expertId, isApproved: true },
        _count: { _all: true }
      });

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingDistribution.forEach(item => {
        distribution[item.rating] = item._count._all;
      });

      statistics = {
        averageRating: statsData._avg.rating,
        totalReviews: statsData._count._all,
        ratingDistribution: distribution
      };
    }

    const totalPages = Math.ceil(total / limit);

    return {
      reviews: reviewsWithHelpful,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics
    };
  }

  /**
   * 리뷰 상세 조회
   */
  async getReviewById(reviewId: string, currentUserId?: string): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        expert: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        order: {
          include: {
            serviceItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    // 현재 사용자의 도움됨 표시 상태 확인
    let isHelpfulByCurrentUser = false;
    if (currentUserId) {
      const helpfulMark = await this.prisma.reviewHelpful.findUnique({
        where: {
          reviewId_userId: {
            reviewId: reviewId,
            userId: currentUserId
          }
        }
      });
      isHelpfulByCurrentUser = !!helpfulMark;
    }

    return {
      ...review,
      isHelpfulByCurrentUser
    };
  }

  /**
   * 리뷰 수정 (작성자 본인만, 작성 후 7일 이내)
   */
  async updateReview(reviewId: string, customerId: string, data: UpdateReviewData): Promise<ReviewWithRelations> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        order: {
          include: {
            expert: true
          }
        }
      }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    // 작성자 본인인지 확인
    if (review.customerId !== customerId) {
      throw new AppError('FORBIDDEN_004', '본인이 작성한 리뷰만 수정할 수 있습니다.', 403);
    }

    // 수정 기간 확인 (작성 후 7일 이내)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (review.createdAt < sevenDaysAgo) {
      throw new AppError('VALIDATION_007', '리뷰 작성 후 7일 이내에만 수정할 수 있습니다.', 400);
    }

    // 리뷰 수정
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...data,
        isApproved: false // 수정 시 재승인 필요
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        expert: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        order: {
          include: {
            serviceItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // 평점이 변경된 경우 전문가 평점 업데이트
    if (data.rating !== undefined && data.rating !== review.rating) {
      await this.updateExpertRating(review.expertId);
    }

    return updatedReview;
  }

  /**
   * 리뷰 삭제 (작성자 본인만)
   */
  async deleteReview(reviewId: string, customerId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    // 작성자 본인인지 확인
    if (review.customerId !== customerId) {
      throw new AppError('FORBIDDEN_005', '본인이 작성한 리뷰만 삭제할 수 있습니다.', 403);
    }

    // 리뷰 삭제 (cascade로 도움됨 표시도 함께 삭제됨)
    await this.prisma.review.delete({
      where: { id: reviewId }
    });

    // 전문가 평점 업데이트
    await this.updateExpertRating(review.expertId);
  }

  /**
   * 도움됨 표시/취소
   */
  async toggleHelpful(reviewId: string, userId: string): Promise<{
    reviewId: string;
    helpfulCount: number;
    isHelpful: boolean;
  }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    // 기존 도움됨 표시 확인
    const existingHelpful = await this.prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId
        }
      }
    });

    let isHelpful: boolean;
    let helpfulCount: number;

    if (existingHelpful) {
      // 도움됨 표시 취소
      await this.prisma.reviewHelpful.delete({
        where: { id: existingHelpful.id }
      });

      // helpfulCount 감소
      const updatedReview = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1
          }
        }
      });

      isHelpful = false;
      helpfulCount = updatedReview.helpfulCount;
    } else {
      // 도움됨 표시 추가
      await this.prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId
        }
      });

      // helpfulCount 증가
      const updatedReview = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1
          }
        }
      });

      isHelpful = true;
      helpfulCount = updatedReview.helpfulCount;

      // 리뷰 작성자에게 도움됨 표시 알림 발송
      await this.notificationService.notifyReviewHelpful(reviewId, userId);
    }

    return {
      reviewId,
      helpfulCount,
      isHelpful
    };
  }

  /**
   * 리뷰 신고
   */
  async reportReview(
    reviewId: string,
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<string> {
    // 리뷰 존재 확인
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    // 자신의 리뷰는 신고할 수 없음
    if (review.customerId === reporterId) {
      throw new AppError('VALIDATION_002', '자신의 리뷰는 신고할 수 없습니다.', 400);
    }

    // 중복 신고 확인
    const existingReport = await this.prisma.reviewReport.findUnique({
      where: {
        reviewId_reporterId: {
          reviewId,
          reporterId
        }
      }
    });

    if (existingReport) {
      throw new AppError('VALIDATION_003', '이미 신고한 리뷰입니다.', 400);
    }

    // 신고 생성
    const report = await this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason: reason as ReportReason,
        description,
        status: ReportStatus.PENDING
      }
    });

    // 신고자 정보 조회
    const reporter = await this.prisma.user.findUnique({
      where: { id: reporterId }
    });

    if (reporter) {
      // 관리자들에게 신고 알림 발송
      await this.notificationService.notifyAdminsAboutReviewReport(
        reviewId,
        reason,
        reporter.name
      );

      // 신고 수 확인하여 다중 신고 알림 발송 (3개 이상 시)
      const reportCount = await this.prisma.reviewReport.count({
        where: { reviewId }
      });

      if (reportCount >= 3) {
        await this.notificationService.notifyAdminsAboutMultipleReports(
          reviewId,
          reportCount
        );
      }
    }

    return report.id;
  }

  /**
   * 전문가 평점 업데이트
   */
  private async updateExpertRating(expertId: string): Promise<void> {
    // 승인된 리뷰들의 평점 평균 계산
    const result = await this.prisma.review.aggregate({
      where: {
        expertId,
        isApproved: true
      },
      _avg: {
        rating: true
      },
      _count: {
        _all: true
      }
    });

    // 전문가 테이블 업데이트
    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        rating: result._avg.rating || 0,
        totalCompletedOrders: result._count._all
      }
    });
  }
}