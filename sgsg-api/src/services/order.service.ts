import { PrismaClient, AuthorType } from '@prisma/client';

export interface CreateOrderData {
  serviceItemId: string;
  addressId: string;
  requestedDate: string;
  customerNotes?: string;
  metadata?: any;
}

export interface UpdateOrderData {
  requestedDate?: string;
  customerNotes?: string;
  expertNotes?: string;
  metadata?: any;
}

export interface OrderFilter {
  status?: string;
  paymentStatus?: string;
  expertId?: string;
  customerId?: string;
  serviceItemId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  // 주문 번호 생성
  private generateOrderNumber(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const time = Date.now().toString().slice(-6); // 마지막 6자리
    
    return `ORD-${year}${month}${day}-${time}`;
  }

  // 주문 생성
  async createOrder(customerId: string, orderData: CreateOrderData) {
    // 서비스 항목 정보 조회
    const serviceItem = await this.prisma.serviceItem.findUnique({
      where: { id: orderData.serviceItemId },
      include: {
        category: true,
      },
    });

    if (!serviceItem) {
      throw {
        code: 'ORDER_001',
        message: '서비스 항목을 찾을 수 없습니다.',
      };
    }

    // 주소 정보 조회 및 권한 확인
    const address = await this.prisma.address.findFirst({
      where: {
        id: orderData.addressId,
        userId: customerId, // 고객의 주소인지 확인
      },
    });

    if (!address) {
      throw {
        code: 'ORDER_002',
        message: '주소를 찾을 수 없거나 접근 권한이 없습니다.',
      };
    }

    // 고객 정보 조회
    const customer = await this.prisma.customer.findFirst({
      where: { userId: customerId },
    });

    if (!customer) {
      throw {
        code: 'ORDER_003',
        message: '고객 정보를 찾을 수 없습니다.',
      };
    }

    const orderNumber = this.generateOrderNumber();
    const basePrice = serviceItem.basePrice;
    const depositAmount = Math.floor(basePrice * 0.2); // 20% 예약금
    const totalAmount = basePrice;

    // 주문 생성
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        serviceItemId: orderData.serviceItemId,
        addressId: orderData.addressId,
        requestedDate: new Date(orderData.requestedDate),
        basePrice,
        depositAmount,
        totalAmount,
        customerNotes: orderData.customerNotes,
        metadata: orderData.metadata || {},
        status: 'new',
        paymentStatus: 'pending',
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        address: true,
      },
    });

    return this.formatOrder(order);
  }

  // 주문 목록 조회
  async getOrders(
    pagination: PaginationOptions,
    filter: OrderFilter = {},
    userId?: string,
    userRole?: string
  ) {
    const { page, limit } = pagination;
    const { status, paymentStatus, expertId, customerId, serviceItemId, dateFrom, dateTo } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 사용자 권한에 따른 필터링
    if (userRole === 'customer' && userId) {
      const customer = await this.prisma.customer.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (customer) {
        where.customerId = customer.id;
      }
    } else if (userRole === 'expert' && userId) {
      const expert = await this.prisma.expert.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (expert) {
        where.expertId = expert.id;
      }
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (expertId) {
      where.expertId = expertId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (serviceItemId) {
      where.serviceItemId = serviceItemId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          serviceItem: {
            include: {
              category: true,
            },
          },
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          expert: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(order => this.formatOrder(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 주문 상세 조회
  async getOrderById(orderId: string, userId?: string, userRole?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        address: true,
      },
    });

    if (!order) {
      throw {
        code: 'ORDER_004',
        message: '주문을 찾을 수 없습니다.',
      };
    }

    // 권한 확인 (본인 주문 또는 관련 전문가만)
    if (userId && userRole !== 'admin') {
      if (userRole === 'customer') {
        const customer = await this.prisma.customer.findFirst({
          where: { userId },
          select: { id: true },
        });
        if (!customer || customer.id !== order.customerId) {
          throw {
            code: 'ORDER_005',
            message: '해당 주문에 접근할 권한이 없습니다.',
          };
        }
      } else if (userRole === 'expert') {
        const expert = await this.prisma.expert.findFirst({
          where: { userId },
          select: { id: true },
        });
        if (!expert || expert.id !== order.expertId) {
          throw {
            code: 'ORDER_005',
            message: '해당 주문에 접근할 권한이 없습니다.',
          };
        }
      }
    }

    return this.formatOrder(order);
  }

  // 주문 수정
  async updateOrder(orderId: string, updateData: UpdateOrderData, userId: string, userRole: string) {
    const order = await this.getOrderById(orderId, userId, userRole);

    // 수정 가능한 상태인지 확인
    if (order.status !== 'new' && order.status !== 'consult_required') {
      throw {
        code: 'ORDER_006',
        message: '현재 주문 상태에서는 수정할 수 없습니다.',
      };
    }

    const updateFields: any = {};
    
    if (updateData.requestedDate) {
      updateFields.requestedDate = new Date(updateData.requestedDate);
    }
    
    if (updateData.customerNotes !== undefined) {
      updateFields.customerNotes = updateData.customerNotes;
    }
    
    if (updateData.expertNotes !== undefined) {
      updateFields.expertNotes = updateData.expertNotes;
    }
    
    if (updateData.metadata !== undefined) {
      updateFields.metadata = updateData.metadata;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateFields,
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        address: true,
      },
    });

    return this.formatOrder(updated);
  }

  // 주문 취소
  async cancelOrder(orderId: string, cancellationReason: string, userId: string, userRole: string) {
    const order = await this.getOrderById(orderId, userId, userRole);

    // 취소 가능한 상태인지 확인
    if (order.status === 'cancelled' || order.status === 'as_requested') {
      throw {
        code: 'ORDER_007',
        message: '이미 완료되었거나 취소된 주문입니다.',
      };
    }

    const cancelled = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason,
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        expert: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        address: true,
      },
    });

    return this.formatOrder(cancelled);
  }

  // 주문 메모 관련
  async createOrderNote(orderId: string, authorId: string, authorType: AuthorType, content: string, isInternal = false) {
    const note = await this.prisma.orderNote.create({
      data: {
        orderId,
        authorId,
        authorType,
        content,
        isInternal,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...note,
      createdAt: note.createdAt.toISOString(),
    };
  }

  async getOrderNotes(orderId: string, userId: string, userRole: string) {
    // 주문 접근 권한 확인
    await this.getOrderById(orderId, userId, userRole);

    const notes = await this.prisma.orderNote.findMany({
      where: {
        orderId,
        // 내부 메모는 관리자와 전문가만 볼 수 있음
        ...(userRole === 'customer' ? { isInternal: false } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    }));
  }

  // 주문 첨부파일 관련
  async getOrderAttachments(orderId: string, userId: string, userRole: string) {
    // 주문 접근 권한 확인
    await this.getOrderById(orderId, userId, userRole);

    const attachments = await this.prisma.orderAttachment.findMany({
      where: { orderId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map(attachment => ({
      ...attachment,
      createdAt: attachment.createdAt.toISOString(),
    }));
  }

  // 데이터 포맷팅
  private formatOrder(order: any) {
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      requestedDate: order.requestedDate.toISOString(),
      confirmedDate: order.confirmedDate?.toISOString(),
      startedAt: order.startedAt?.toISOString(),
      completedAt: order.completedAt?.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString(),
      serviceItem: order.serviceItem ? {
        ...order.serviceItem,
        createdAt: order.serviceItem.createdAt.toISOString(),
        updatedAt: order.serviceItem.updatedAt.toISOString(),
        category: order.serviceItem.category ? {
          ...order.serviceItem.category,
          createdAt: order.serviceItem.category.createdAt.toISOString(),
          updatedAt: order.serviceItem.category.updatedAt.toISOString(),
        } : null,
      } : null,
      customer: order.customer ? {
        ...order.customer,
        user: order.customer.user,
      } : null,
      expert: order.expert ? {
        ...order.expert,
        user: order.expert.user,
      } : null,
      address: order.address ? {
        ...order.address,
        createdAt: order.address.createdAt.toISOString(),
        updatedAt: order.address.updatedAt.toISOString(),
      } : null,
    };
  }
}