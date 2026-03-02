import { PrismaClient } from '@prisma/client';
import { AppError } from '../types/errors.js';
import { ReportReason, ReportStatus } from '@prisma/client';
import { NotificationService } from './notification.service.js';

export interface AdminReviewFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  expertId?: string;
  customerId?: string;
  rating?: number;
  reportCount?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'helpfulCount' | 'reportCount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReviewApprovalData {
  action: 'approve' | 'reject';
  reason?: string;
  adminNote?: string;
}

export interface BulkActionData {
  reviewIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
  adminNote?: string;
}

export interface AdminReviewWithDetails {
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
  approvedById: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  adminNote: string | null;
  helpfulCount: number;
  reportCount?: number;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    user: {
      name: string;
      email: string;
      phone: string;
      avatarUrl: string | null;
    };
  };
  expert: {
    id: string;
    businessName: string;
    rating: number | null;
    user: {
      name: string;
      email: string;
      phone: string;
      avatarUrl: string | null;
    };
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    serviceItem: {
      name: string;
      category: {
        name: string;
      };
    };
  };
  reports?: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: Date;
    reporter: {
      name: string;
      email: string;
    };
  }[];
}

export class AdminReviewService {
  private notificationService: NotificationService;

  constructor(private prisma: PrismaClient) {
    this.notificationService = new NotificationService(prisma);
  }

  /**
   * 관리자용 리뷰 목록 조회 (상세 정보 포함)
   */
  async getReviewsForAdmin(filters: AdminReviewFilters): Promise<{
    reviews: AdminReviewWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    statistics: {
      pending: number;
      approved: number;
      rejected: number;
      totalReports: number;
      averageRating: number | null;
      reportedReviews: number;
    };
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};

    // 승인 상태 필터
    if (filters.status === 'pending') {
      where.isApproved = false;
      where.rejectedAt = null;
    } else if (filters.status === 'approved') {
      where.isApproved = true;
    } else if (filters.status === 'rejected') {
      where.rejectedAt = { not: null };
    }
    // 'all'인 경우 조건 추가하지 않음

    if (filters.expertId) {
      where.expertId = filters.expertId;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.rating) {
      where.rating = filters.rating;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        // 종료일은 해당 날짜의 끝까지 포함
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // 신고 수 필터
    if (filters.reportCount) {
      where.reports = {
        _count: {
          gte: filters.reportCount
        }
      };
    }

    // 정렬 조건
    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    if (sortBy === 'reportCount') {
      orderBy._count = { reports: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // 리뷰 조회 (신고 수 포함)
    const [reviews, total, statistics] = await Promise.all([
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
                  email: true,
                  phone: true,
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
                  email: true,
                  phone: true,
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
          },
          reports: {
            include: {
              reporter: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              reports: true
            }
          }
        }
      }),
      this.prisma.review.count({ where }),
      this.getReviewStatistics()
    ]);

    // 리뷰에 신고 수 추가
    const reviewsWithReportCount = reviews.map(review => ({
      ...review,
      reportCount: (review as any)._count.reports
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      reviews: reviewsWithReportCount,
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
   * 리뷰 상세 조회 (관리자용)
   */
  async getReviewByIdForAdmin(reviewId: string): Promise<AdminReviewWithDetails> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
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
                email: true,
                phone: true,
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
        },
        reports: {
          include: {
            reporter: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    return {
      ...review,
      reportCount: (review as any)._count.reports
    };
  }

  /**
   * 리뷰 승인/거부
   */
  async approveOrRejectReview(
    reviewId: string,
    adminId: string,
    data: ReviewApprovalData
  ): Promise<AdminReviewWithDetails> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { expert: true }
    });

    if (!review) {
      throw new AppError('NOT_FOUND_002', '리뷰를 찾을 수 없습니다.', 404);
    }

    const updateData: any = {
      adminNote: data.adminNote
    };

    if (data.action === 'approve') {
      updateData.isApproved = true;
      updateData.approvedAt = new Date();
      updateData.approvedById = adminId;
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    } else {
      updateData.isApproved = false;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = data.reason;
      updateData.approvedAt = null;
      updateData.approvedById = null;
    }

    // 리뷰 업데이트
    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
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
                email: true,
                phone: true,
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
        },
        reports: {
          include: {
            reporter: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // 승인된 경우 전문가 평점 업데이트 및 알림 발송
    if (data.action === 'approve') {
      await this.updateExpertRating(review.expertId);
      await this.notificationService.notifyReviewApproval(reviewId);
    } else {
      // 거부된 경우 고객에게 알림 발송
      await this.notificationService.notifyReviewRejection(
        reviewId,
        data.reason
      );
    }

    return {
      ...updatedReview,
      reportCount: updatedReview.reports?.length || 0
    };
  }

  /**
   * 일괄 승인/거부
   */
  async bulkApproveOrReject(
    adminId: string,
    data: BulkActionData
  ): Promise<{
    totalRequested: number;
    successful: number;
    failed: number;
    results: Array<{
      reviewId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const results: Array<{
      reviewId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const reviewId of data.reviewIds) {
      try {
        await this.approveOrRejectReview(reviewId, adminId, {
          action: data.action,
          reason: data.reason,
          adminNote: data.adminNote
        });
        results.push({ reviewId, success: true });
      } catch (error) {
        results.push({
          reviewId,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      totalRequested: data.reviewIds.length,
      successful,
      failed,
      results
    };
  }

  /**
   * 리뷰 신고
   */
  async reportReview(
    reviewId: string,
    reporterId: string,
    reason: ReportReason,
    description?: string
  ): Promise<void> {
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
    await this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason,
        description,
        status: ReportStatus.PENDING
      }
    });
  }

  /**
   * 리뷰 통계 조회
   */
  private async getReviewStatistics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    totalReports: number;
    averageRating: number | null;
    reportedReviews: number;
  }> {
    const [pendingCount, approvedCount, rejectedCount, totalReports, avgRating, reportedReviewsCount] = await Promise.all([
      this.prisma.review.count({
        where: { isApproved: false, rejectedAt: null }
      }),
      this.prisma.review.count({
        where: { isApproved: true }
      }),
      this.prisma.review.count({
        where: { rejectedAt: { not: null } }
      }),
      this.prisma.reviewReport.count(),
      this.prisma.review.aggregate({
        _avg: { rating: true },
        where: { isApproved: true }
      }),
      this.prisma.review.count({
        where: {
          reports: {
            some: {}
          }
        }
      })
    ]);

    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      totalReports,
      averageRating: avgRating._avg.rating,
      reportedReviews: reportedReviewsCount
    };
  }

  /**
   * 전문가 평점 업데이트 (승인된 리뷰만 반영)
   */
  private async updateExpertRating(expertId: string): Promise<void> {
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

    const newRating = result._avg.rating || 0;

    await this.prisma.expert.update({
      where: { id: expertId },
      data: {
        rating: newRating
      }
    });

    // 전문가에게 평점 업데이트 알림 발송
    if (result._count._all > 0) {
      await this.notificationService.notifyExpertAboutRatingUpdate(
        expertId,
        newRating,
        result._count._all
      );
    }
  }
}