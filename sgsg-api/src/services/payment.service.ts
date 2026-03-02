import { PrismaClient } from '@prisma/client';
import { HectoClient, HectoWebhookPayload, HectoApiError } from '../clients/hecto.client';

export interface InitializePaymentData {
  orderId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  method?: 'credit_card' | 'virtual_account' | 'simple_payment' | 'cash';
}

export interface CompletePaymentData {
  paymentId: string;
  pgTransactionId: string;
  pgResponse: any;
  paidAt?: string;
}

export interface RefundPaymentData {
  amount: number;
  reason: string;
}

export class PaymentService {
  private hectoClient: HectoClient;

  constructor(private prisma: PrismaClient) {
    // 헥토 클라이언트 초기화
    this.hectoClient = new HectoClient({
      baseUrl: process.env.HECTO_API_URL || 'https://dev-api.hecto.co.kr',
      mid: process.env.HECTO_MID || 'devsgsgcare',
      apiKey: process.env.HECTO_API_KEY || 'dev-api-key',
      secretKey: process.env.HECTO_SECRET_KEY || 'dev-secret-key',
    });
  }

  // 결제 번호 생성
  private generatePaymentNumber(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const time = Date.now().toString().slice(-6);
    
    return `PAY-${year}${month}${day}-${time}`;
  }

  // 결제 초기화
  async initializePayment(userId: string, paymentData: InitializePaymentData) {
    // 주문 정보 조회 및 권한 확인
    const order = await this.prisma.order.findUnique({
      where: { id: paymentData.orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw {
        code: 'PAYMENT_001',
        message: '주문을 찾을 수 없습니다.',
      };
    }

    // 고객 권한 확인
    if (order.customer.user.id !== userId) {
      throw {
        code: 'PAYMENT_002',
        message: '해당 주문에 결제할 권한이 없습니다.',
      };
    }

    // 결제 가능한 상태인지 확인
    if (order.status === 'cancelled' || order.paymentStatus === 'balance_paid') {
      throw {
        code: 'PAYMENT_003',
        message: '현재 주문 상태에서는 결제할 수 없습니다.',
      };
    }

    // 결제 금액 계산
    let amount: number;
    switch (paymentData.paymentType) {
      case 'deposit':
        amount = order.depositAmount;
        break;
      case 'balance':
        amount = order.totalAmount - order.paidAmount;
        break;
      case 'full':
        amount = order.totalAmount;
        break;
      default:
        throw {
          code: 'PAYMENT_004',
          message: '유효하지 않은 결제 타입입니다.',
        };
    }

    if (amount <= 0) {
      throw {
        code: 'PAYMENT_005',
        message: '결제할 금액이 없습니다.',
      };
    }

    const paymentNumber = this.generatePaymentNumber();

    // 헥토 결제 요청 생성
    let hectoResponse;
    try {
      hectoResponse = await this.hectoClient.createPayment({
        orderId: paymentData.orderId,
        amount,
        customerName: order.customer.user.name || '고객',
        customerEmail: order.customer.user.email,
        customerPhone: order.customer.user.phone || '',
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/complete`,
        callbackUrl: `${process.env.API_BASE_URL || 'http://localhost:4000'}/api/v1/payments/webhook`,
        timestamp: Date.now().toString(),
      });
    } catch (error) {
      console.error('헥토 결제 요청 실패:', error);
      
      // 개발 환경에서는 모의 응답 생성
      if (process.env.NODE_ENV === 'development' || !process.env.HECTO_API_KEY) {
        hectoResponse = {
          paymentId: `mock_${paymentNumber}`,
          redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/mock?paymentNumber=${paymentNumber}`,
          status: 'pending',
          message: '개발 환경 모의 결제',
        };
      } else {
        throw {
          code: 'PAYMENT_003',
          message: '결제 시스템 연결에 실패했습니다.',
          details: error instanceof HectoApiError ? error.message : '알 수 없는 오류',
        };
      }
    }

    // 결제 정보 생성
    const payment = await this.prisma.payment.create({
      data: {
        orderId: paymentData.orderId,
        paymentNumber,
        paymentType: paymentData.paymentType,
        method: paymentData.method,
        amount,
        status: 'pending',
        pgProvider: 'hecto',
        pgTransactionId: hectoResponse.paymentId,
      },
    });

    return {
      ...payment,
      redirectUrl: hectoResponse.redirectUrl,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      paidAt: payment.paidAt?.toISOString(),
      refundedAt: payment.refundedAt?.toISOString(),
    };
  }

  // 결제 완료 처리
  async completePayment(paymentData: CompletePaymentData) {
    const { paymentId, pgTransactionId, pgResponse, paidAt } = paymentData;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw {
        code: 'PAYMENT_006',
        message: '결제 정보를 찾을 수 없습니다.',
      };
    }

    if (payment.status !== 'pending') {
      throw {
        code: 'PAYMENT_007',
        message: '이미 처리된 결제입니다.',
      };
    }

    // 트랜잭션으로 결제 완료 및 주문 상태 업데이트
    const result = await this.prisma.$transaction(async (prisma) => {
      // 결제 상태 업데이트
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          pgTransactionId,
          pgResponse,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      });

      // 주문 결제 상태 및 금액 업데이트
      const newPaidAmount = payment.order.paidAmount + payment.amount;
      let newPaymentStatus = payment.order.paymentStatus;
      let newOrderStatus = payment.order.status;

      if (payment.paymentType === 'deposit') {
        newPaymentStatus = 'deposit_paid';
        newOrderStatus = 'schedule_pending';
      } else if (payment.paymentType === 'balance' || payment.paymentType === 'full') {
        newPaymentStatus = 'balance_paid';
        newOrderStatus = 'paid';
      }

      const updatedOrder = await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: newPaymentStatus,
          status: newOrderStatus,
          paidAmount: newPaidAmount,
        },
      });

      return { payment: updatedPayment, order: updatedOrder };
    });

    return {
      ...result.payment,
      createdAt: result.payment.createdAt.toISOString(),
      updatedAt: result.payment.updatedAt.toISOString(),
      paidAt: result.payment.paidAt?.toISOString(),
      refundedAt: result.payment.refundedAt?.toISOString(),
    };
  }

  // 결제 정보 조회
  async getPaymentById(paymentId: string, userId?: string, userRole?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
            expert: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw {
        code: 'PAYMENT_008',
        message: '결제 정보를 찾을 수 없습니다.',
      };
    }

    // 권한 확인
    if (userId && userRole !== 'admin') {
      if (userRole === 'customer' && payment.order.customer.user.id !== userId) {
        throw {
          code: 'PAYMENT_009',
          message: '해당 결제 정보에 접근할 권한이 없습니다.',
        };
      } else if (userRole === 'expert' && payment.order.expert?.user.id !== userId) {
        throw {
          code: 'PAYMENT_009',
          message: '해당 결제 정보에 접근할 권한이 없습니다.',
        };
      }
    }

    return {
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      paidAt: payment.paidAt?.toISOString(),
      refundedAt: payment.refundedAt?.toISOString(),
    };
  }

  // 결제 환불
  async refundPayment(paymentId: string, refundData: RefundPaymentData) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw {
        code: 'PAYMENT_008',
        message: '결제 정보를 찾을 수 없습니다.',
      };
    }

    if (payment.status !== 'completed') {
      throw {
        code: 'PAYMENT_010',
        message: '완료된 결제만 환불할 수 있습니다.',
      };
    }

    if (refundData.amount > payment.amount - payment.refundAmount) {
      throw {
        code: 'PAYMENT_011',
        message: '환불 금액이 결제 금액을 초과할 수 없습니다.',
      };
    }

    const refunded = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: refundData.amount === payment.amount ? 'refunded' : 'completed',
        refundAmount: payment.refundAmount + refundData.amount,
        refundReason: refundData.reason,
        refundedAt: new Date(),
      },
    });

    return {
      ...refunded,
      createdAt: refunded.createdAt.toISOString(),
      updatedAt: refunded.updatedAt.toISOString(),
      paidAt: refunded.paidAt?.toISOString(),
      refundedAt: refunded.refundedAt?.toISOString(),
    };
  }

  // 헥토 웹훅 처리
  async processHectoWebhook(webhookData: HectoWebhookPayload): Promise<boolean> {
    try {
      // 1. 서명 검증
      if (!this.hectoClient.verifyWebhookSignature(webhookData)) {
        console.error('헥토 웹훅 서명 검증 실패:', webhookData);
        return false;
      }

      // 2. 결제 정보 조회
      const payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { id: webhookData.paymentId },
            { pgTransactionId: webhookData.paymentId },
          ],
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        console.error('웹훅 처리: 결제 정보를 찾을 수 없음:', webhookData.paymentId);
        return false;
      }

      // 3. 이미 처리된 웹훅인지 확인
      if (payment.status !== 'pending') {
        console.log('이미 처리된 결제:', payment.id, payment.status);
        return true;
      }

      // 4. 결제 상태에 따른 처리
      const updateData: any = {
        pgTransactionId: webhookData.pgTransactionId,
        updatedAt: new Date(),
      };

      let orderStatus: string | undefined;

      switch (webhookData.status) {
        case 'success':
          updateData.status = 'completed';
          updateData.paidAt = new Date(webhookData.paidAt);
          
          // 결제 타입에 따른 주문 상태 업데이트
          if (payment.paymentType === 'deposit') {
            orderStatus = 'confirmed';
          } else if (payment.paymentType === 'balance' || payment.paymentType === 'full') {
            orderStatus = 'service_scheduled';
          }
          break;

        case 'failed':
          updateData.status = 'failed';
          orderStatus = 'payment_failed';
          break;

        case 'cancelled':
          updateData.status = 'cancelled';
          orderStatus = 'cancelled';
          break;

        default:
          console.error('알 수 없는 결제 상태:', webhookData.status);
          return false;
      }

      // 5. 트랜잭션으로 결제 및 주문 상태 업데이트
      await this.prisma.$transaction(async (prisma) => {
        // 결제 상태 업데이트
        await prisma.payment.update({
          where: { id: payment.id },
          data: updateData,
        });

        // 주문 상태 업데이트 (필요한 경우)
        if (orderStatus && payment.order) {
          const orderUpdateData: any = {
            status: orderStatus,
            updatedAt: new Date(),
          };

          // 결제 완료 시 금액 정보 업데이트
          if (webhookData.status === 'success') {
            orderUpdateData.paidAmount = payment.order.paidAmount + payment.amount;
          }

          await prisma.order.update({
            where: { id: payment.order.id },
            data: orderUpdateData,
          });
        }
      });

      console.log('헥토 웹훅 처리 완료:', {
        paymentId: payment.id,
        status: webhookData.status,
        amount: webhookData.amount,
        orderId: payment.orderId,
      });

      return true;
    } catch (error) {
      console.error('헥토 웹훅 처리 실패:', error);
      return false;
    }
  }

  // PG 결제 상태 동기화 (배치 작업용)
  async syncPaymentStatus(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || !payment.pgTransactionId) {
        return false;
      }

      // 헥토에서 결제 상태 조회
      const hectoStatus = await this.hectoClient.getPaymentStatus(payment.pgTransactionId);

      // 상태가 다른 경우 업데이트
      if (payment.status !== hectoStatus.status) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: hectoStatus.status === 'success' ? 'completed' : hectoStatus.status,
            pgTransactionId: hectoStatus.pgTransactionId || payment.pgTransactionId,
            paidAt: hectoStatus.paidAt ? new Date(hectoStatus.paidAt) : payment.paidAt,
            updatedAt: new Date(),
          },
        });

        console.log('결제 상태 동기화 완료:', {
          paymentId,
          oldStatus: payment.status,
          newStatus: hectoStatus.status,
        });
      }

      return true;
    } catch (error) {
      console.error('결제 상태 동기화 실패:', error);
      return false;
    }
  }
}