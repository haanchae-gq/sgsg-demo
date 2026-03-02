import { PrismaClient } from '@prisma/client';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private connectedClients: Map<string, any> = new Map()

  constructor(private prisma: PrismaClient) {}

  // WebSocket 클라이언트 연결 관리
  addClient(userId: string, connection: any) {
    this.connectedClients.set(userId, connection)
    console.log(`[WebSocket] Client connected: ${userId}`)
  }

  removeClient(userId: string) {
    this.connectedClients.delete(userId)
    console.log(`[WebSocket] Client disconnected: ${userId}`)
  }

  // 실시간 알림 전송
  private async sendRealTimeNotification(userId: string, notification: any) {
    const connection = this.connectedClients.get(userId)
    if (connection) {
      try {
        connection.send(JSON.stringify({
          type: 'notification',
          data: notification
        }))
        return true
      } catch (error) {
        console.error('Failed to send real-time notification:', error)
        this.connectedClients.delete(userId) // 연결이 끊어진 클라이언트 제거
      }
    }
    return false
  }

  /**
   * 알림 생성
   */
  async createNotification(data: NotificationData) {
    try {
      // 데이터베이스에 알림 저장
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          isRead: false
        }
      })

      // 실시간으로 클라이언트에 전송
      await this.sendRealTimeNotification(data.userId, notification)

      return notification
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error)
      throw error
    }
  }

  /**
   * 여러 사용자에게 알림 생성
   */
  async createNotifications(notifications: NotificationData[]): Promise<void> {
    await this.prisma.notification.createMany({
      data: notifications.map(notification => ({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        isRead: false
      }))
    });
  }

  /**
   * 리뷰 작성 알림 (전문가에게)
   */
  async notifyExpertAboutNewReview(
    expertId: string,
    orderId: string,
    customerName: string,
    rating: number
  ): Promise<void> {
    // 전문가의 사용자 ID 조회
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      include: { user: true }
    });

    if (!expert) return;

    await this.createNotification({
      userId: expert.userId,
      type: 'review_created',
      title: '새 리뷰가 등록되었습니다',
      message: `${customerName}님이 ${rating}점 리뷰를 작성했습니다.`,
      data: {
        expertId,
        orderId,
        customerName,
        rating,
        reviewStatus: 'pending_approval'
      }
    });
  }

  /**
   * 리뷰 승인 알림 (전문가와 고객에게)
   */
  async notifyReviewApproval(reviewId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: { include: { user: true } },
        expert: { include: { user: true } },
        order: { include: { serviceItem: true } }
      }
    });

    if (!review) return;

    // 고객에게 알림
    await this.createNotification({
      userId: review.customer.userId,
      type: 'review_approved',
      title: '리뷰가 승인되었습니다',
      message: `${review.order.serviceItem.name} 서비스에 대한 리뷰가 승인되어 공개되었습니다.`,
      data: {
        reviewId,
        orderId: review.orderId,
        expertId: review.expertId,
        serviceName: review.order.serviceItem.name
      }
    });

    // 전문가에게 알림
    await this.createNotification({
      userId: review.expert.userId,
      type: 'review_approved',
      title: '리뷰가 승인되었습니다',
      message: `${review.customer.user.name}님의 리뷰가 승인되어 공개되었습니다.`,
      data: {
        reviewId,
        orderId: review.orderId,
        customerId: review.customerId,
        rating: review.rating
      }
    });
  }

  /**
   * 리뷰 거부 알림 (고객에게)
   */
  async notifyReviewRejection(
    reviewId: string,
    rejectionReason?: string
  ): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: { include: { user: true } },
        order: { include: { serviceItem: true } }
      }
    });

    if (!review) return;

    await this.createNotification({
      userId: review.customer.userId,
      type: 'review_rejected',
      title: '리뷰가 거부되었습니다',
      message: `${review.order.serviceItem.name} 서비스에 대한 리뷰가 검토 결과 거부되었습니다.`,
      data: {
        reviewId,
        orderId: review.orderId,
        serviceName: review.order.serviceItem.name,
        rejectionReason
      }
    });
  }

  /**
   * 도움됨 표시 알림 (리뷰 작성자에게)
   */
  async notifyReviewHelpful(
    reviewId: string,
    helperUserId: string
  ): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: { include: { user: true } }
      }
    });

    if (!review || !review.isApproved) return;

    const helper = await this.prisma.user.findUnique({
      where: { id: helperUserId }
    });

    if (!helper) return;

    await this.createNotification({
      userId: review.customer.userId,
      type: 'review_helpful',
      title: '리뷰가 도움이 되었어요',
      message: `${helper.name}님이 회원님의 리뷰를 도움이 된다고 표시했습니다.`,
      data: {
        reviewId,
        helperUserId,
        helperName: helper.name
      }
    });
  }

  /**
   * 리뷰 신고 알림 (관리자들에게)
   */
  async notifyAdminsAboutReviewReport(
    reviewId: string,
    reportReason: string,
    reporterName: string
  ): Promise<void> {
    // 관리자들 조회
    const admins = await this.prisma.admin.findMany({
      include: { user: true }
    });

    const notifications: NotificationData[] = admins.map(admin => ({
      userId: admin.userId,
      type: 'review_reported',
      title: '리뷰 신고가 접수되었습니다',
      message: `${reporterName}님이 부적절한 리뷰를 신고했습니다. (사유: ${this.translateReportReason(reportReason)})`,
      data: {
        reviewId,
        reportReason,
        reporterName,
        requiresAction: true
      }
    }));

    if (notifications.length > 0) {
      await this.createNotifications(notifications);
    }
  }

  /**
   * 다중 신고 알림 (관리자들에게) - 심각한 리뷰에 대한 긴급 알림
   */
  async notifyAdminsAboutMultipleReports(
    reviewId: string,
    reportCount: number
  ): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        customer: { include: { user: true } },
        expert: { include: { user: true } }
      }
    });

    if (!review) return;

    // 관리자들 조회
    const admins = await this.prisma.admin.findMany({
      include: { user: true }
    });

    const notifications: NotificationData[] = admins.map(admin => ({
      userId: admin.userId,
      type: 'review_multiple_reports',
      title: '리뷰 다중 신고 - 긴급 검토 필요',
      message: `리뷰가 ${reportCount}번 신고되어 긴급 검토가 필요합니다.`,
      data: {
        reviewId,
        reportCount,
        customerName: review.customer.user.name,
        expertName: review.expert.user.name,
        urgentAction: true
      }
    }));

    if (notifications.length > 0) {
      await this.createNotifications(notifications);
    }
  }

  /**
   * 전문가 평점 업데이트 알림 (전문가에게)
   */
  async notifyExpertAboutRatingUpdate(
    expertId: string,
    newRating: number,
    reviewCount: number
  ): Promise<void> {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      include: { user: true }
    });

    if (!expert || newRating === expert.rating) return;

    const isImprovement = newRating > (expert.rating || 0);
    const emoji = isImprovement ? '🎉' : '📈';

    await this.createNotification({
      userId: expert.userId,
      type: 'rating_updated',
      title: `${emoji} 평점이 업데이트되었습니다`,
      message: `새로운 평점: ${newRating.toFixed(1)}점 (총 ${reviewCount}개 리뷰)`,
      data: {
        expertId,
        oldRating: expert.rating,
        newRating,
        reviewCount,
        improvement: isImprovement
      }
    });
  }

  /**
   * 신고 사유 번역
   */
  private translateReportReason(reason: string): string {
    const translations: { [key: string]: string } = {
      'INAPPROPRIATE_CONTENT': '부적절한 내용',
      'SPAM': '스팸',
      'FALSE_INFORMATION': '허위 정보',
      'HARASSMENT': '괴롭힘',
      'COPYRIGHT_VIOLATION': '저작권 침해',
      'OTHER': '기타'
    };

    return translations[reason] || reason;
  }

  // ========== 전문가 관련 알림 ========== 

  /**
   * 스케줄 생성 알림
   */
  async notifyScheduleCreated(expertUserId: string, scheduleData: {
    scheduleId: string;
    orderId: string;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    serviceItem: string;
    address: string;
  }) {
    return this.createNotification({
      userId: expertUserId,
      type: 'schedule_created',
      title: '새 스케줄 등록됨',
      message: `${scheduleData.customerName}님의 ${scheduleData.serviceItem} 스케줄이 ${scheduleData.scheduleDate} ${scheduleData.startTime}에 등록되었습니다.`,
      data: scheduleData
    })
  }

  /**
   * 스케줄 업데이트 알림
   */
  async notifyScheduleUpdated(expertUserId: string, scheduleData: any) {
    return this.createNotification({
      userId: expertUserId,
      type: 'schedule_updated',
      title: '스케줄 변경됨',
      message: `${scheduleData.customerName}님의 스케줄이 ${scheduleData.scheduleDate} ${scheduleData.startTime}로 변경되었습니다.`,
      data: scheduleData
    })
  }

  /**
   * 새 배정 알림
   */
  async notifyNewAssignment(expertUserId: string, assignmentData: {
    assignmentId: string;
    orderId: string;
    orderNumber: string;
    serviceName: string;
    customerName: string;
    requestedDate: string;
    deadline: string;
  }) {
    return this.createNotification({
      userId: expertUserId,
      type: 'new_assignment',
      title: '새 작업 배정',
      message: `${assignmentData.customerName}님의 ${assignmentData.serviceName} 작업이 배정되었습니다. (${assignmentData.deadline}까지 응답)`,
      data: assignmentData
    })
  }

  /**
   * 배정 마감 임박 알림
   */
  async notifyAssignmentDeadline(expertUserId: string, assignmentData: any) {
    return this.createNotification({
      userId: expertUserId,
      type: 'assignment_deadline',
      title: '응답 마감 임박',
      message: `${assignmentData.orderNumber} 배정 응답 마감이 30분 남았습니다.`,
      data: assignmentData
    })
  }

  /**
   * 멤버십 만료 예정 알림
   */
  async notifyMembershipExpiring(expertUserId: string, daysLeft: number) {
    return this.createNotification({
      userId: expertUserId,
      type: 'membership_expiring',
      title: '멤버십 만료 예정',
      message: `멤버십이 ${daysLeft}일 후 만료됩니다. 갱신을 고려해주세요.`,
      data: { daysLeft }
    })
  }

  /**
   * 슬롯 한도 도달 알림
   */
  async notifySlotLimitReached(expertUserId: string) {
    return this.createNotification({
      userId: expertUserId,
      type: 'slot_limit_reached',
      title: '서브 계정 슬롯 한도 도달',
      message: '서브 계정 슬롯이 모두 사용되었습니다. 추가 계정 생성을 위해서는 멤버십 업그레이드가 필요합니다.',
      data: {}
    })
  }

  /**
   * 패널티 적용 알림
   */
  async notifyPenaltyApplied(expertUserId: string, penaltyType: string, reasonDetail: string) {
    return this.createNotification({
      userId: expertUserId,
      type: 'penalty_applied',
      title: '패널티 적용됨',
      message: `${penaltyType} 패널티가 적용되었습니다: ${reasonDetail}`,
      data: { penaltyType, reasonDetail }
    })
  }

  /**
   * 일일 배정 한도 도달 알림
   */
  async notifyDailyLimitReached(expertUserId: string) {
    return this.createNotification({
      userId: expertUserId,
      type: 'daily_limit_reached',
      title: '일일 배정 한도 도달',
      message: '오늘의 일일 배정 한도에 도달했습니다.',
      data: {}
    })
  }

  /**
   * 알림 목록 조회
   */
  async getNotifications(userId: string, options: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  } = {}) {
    const { page = 1, limit = 20, isRead, type } = options
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (isRead !== undefined) where.isRead = isRead
    if (type) where.type = type

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notification.count({ where })
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId }
    })

    if (!notification) {
      throw {
        code: 'NOTIFICATION_001',
        message: '알림을 찾을 수 없습니다.'
      }
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  /**
   * 읽지 않은 알림 수 조회
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false }
    })
  }
}