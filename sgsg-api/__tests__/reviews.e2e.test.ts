import { describe, beforeAll, afterAll, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
const MockPrismaClient = require('./mocks/prisma-client.js');
import { createTestApp } from './setup';

describe('Reviews E2E Tests', () => {
  let app: FastifyInstance;
  let prisma: any;
  let customerToken: string;
  let expertToken: string;
  let adminToken: string;
  let testCustomerId: string;
  let testExpertId: string;
  let testOrderId: string;
  let testReviewId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new MockPrismaClient();
    console.log('Review test prisma instance:', Object.keys(prisma));
    console.log('Has reviewHelpful?', !!prisma.reviewHelpful);
    console.log('Has review?', !!prisma.review);

    // 테스트 사용자 생성
    const testUsers = await createTestUsers();
    customerToken = testUsers.customerToken;
    expertToken = testUsers.expertToken;
    adminToken = testUsers.adminToken;
    testCustomerId = testUsers.customerId;
    testExpertId = testUsers.expertId;

    // 테스트 주문 생성
    testOrderId = await createTestOrder();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 리뷰 데이터 정리
    await prisma.reviewHelpful.deleteMany({});
    await prisma.review.deleteMany({});
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    await prisma.reviewHelpful.deleteMany({});
    await prisma.review.deleteMany({});
  });

  // 테스트 사용자 생성 헬퍼
  async function createTestUsers() {
    // 기존 테스트 데이터 삭제
    await prisma.review.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({});

    // 고객 생성
    const customerUser = await prisma.user.create({
      data: {
        email: 'customer@test.com',
        phone: '01012341234',
        name: '테스트 고객',
        role: 'customer',
        passwordHash: 'hashed_password'
      }
    });

    const customer = await prisma.customer.create({
      data: {
        userId: customerUser.id,
        totalSpent: 0,
        totalOrders: 0
      }
    });

    // 전문가 생성
    const expertUser = await prisma.user.create({
      data: {
        email: 'expert@test.com',
        phone: '01012341235',
        name: '테스트 전문가',
        role: 'expert',
        passwordHash: 'hashed_password'
      }
    });

    const expert = await prisma.expert.create({
      data: {
        userId: expertUser.id,
        businessName: '테스트 비즈니스',
        businessNumber: '123-45-67890',
        businessType: 'individual',
        rating: 0
      }
    });

    // 관리자 생성
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        phone: '01012341236',
        name: '테스트 관리자',
        role: 'admin',
        passwordHash: 'hashed_password'
      }
    });

    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        permissions: ['reviews:approve']
      }
    });

    // JWT 토큰 생성 (필수 필드 포함)
    const now = Math.floor(Date.now() / 1000);
    const customerPayload = {
      userId: customerUser.id,
      email: customerUser.email,
      role: 'customer' as const,
      iat: now,
      exp: now + 3600, // 1 hour
      customer: { id: customer.id }
    };

    const expertPayload = {
      userId: expertUser.id,
      email: expertUser.email,
      role: 'expert' as const,
      iat: now,
      exp: now + 3600, // 1 hour
      expert: { id: expert.id }
    };

    const adminPayload = {
      userId: adminUser.id,
      email: adminUser.email,
      role: 'admin' as const,
      iat: now,
      exp: now + 3600 // 1 hour
    };

    return {
      customerToken: app.jwt.sign(customerPayload),
      expertToken: app.jwt.sign(expertPayload),
      adminToken: app.jwt.sign(adminPayload),
      customerId: customer.id,
      expertId: expert.id
    };
  }

  // 테스트 주문 생성 헬퍼
  async function createTestOrder() {
    // 서비스 카테고리 및 아이템 생성
    const category = await prisma.serviceCategory.create({
      data: {
        name: '테스트 카테고리',
        slug: 'test-category'
      }
    });

    const serviceItem = await prisma.serviceItem.create({
      data: {
        categoryId: category.id,
        name: '테스트 서비스',
        basePrice: 100000
      }
    });

    // 주소 생성
    const address = await prisma.address.create({
      data: {
        userId: (await prisma.customer.findUnique({ where: { id: testCustomerId } }))!.userId,
        label: '테스트 주소',
        addressLine1: '서울시 강남구',
        city: '서울',
        state: '서울',
        postalCode: '12345'
      }
    });

    // 완료된 주문 생성
    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-ORDER-001',
        customerId: testCustomerId,
        expertId: testExpertId,
        serviceItemId: serviceItem.id,
        addressId: address.id,
        status: 'as_requested', // 완료 상태
        paymentStatus: 'balance_paid',
        requestedDate: new Date(),
        completedAt: new Date(), // 완료 시간 설정
        basePrice: 100000,
        depositAmount: 50000,
        totalAmount: 100000
      }
    });

    return order.id;
  }

  // 테스트 데이터 정리 헬퍼
  async function cleanupTestData() {
    await prisma.reviewHelpful.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.serviceItem.deleteMany({});
    await prisma.serviceCategory.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({});
  }

  describe('POST /api/v1/reviews', () => {
    it('고객이 완료된 주문에 대해 리뷰를 작성할 수 있다', async () => {
      const reviewData = {
        orderId: testOrderId,
        rating: 5,
        title: '정말 만족스러운 서비스',
        content: '전문가님이 정말 친절하고 서비스 품질이 훌륭했습니다.',
        images: ['https://example.com/image1.jpg']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/reviews',
        headers: {
          authorization: `Bearer ${customerToken}`
        },
        payload: reviewData
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.rating).toBe(5);
      expect(body.data.title).toBe('정말 만족스러운 서비스');
      expect(body.data.content).toBe('전문가님이 정말 친절하고 서비스 품질이 훌륭했습니다.');
      expect(body.data.isApproved).toBe(false); // 승인 대기 상태

      testReviewId = body.data.id;
    });

    it('인증되지 않은 사용자는 리뷰를 작성할 수 없다', async () => {
      const reviewData = {
        orderId: testOrderId,
        rating: 5,
        content: '좋은 서비스였습니다.'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/reviews',
        payload: reviewData
      });

      expect(response.statusCode).toBe(401);
    });

    it('전문가나 관리자는 리뷰를 작성할 수 없다', async () => {
      const reviewData = {
        orderId: testOrderId,
        rating: 5,
        content: '좋은 서비스였습니다.'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/reviews',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: reviewData
      });

      expect(response.statusCode).toBe(403);
    });

    it('이미 리뷰가 있는 주문에는 중복 리뷰를 작성할 수 없다', async () => {
      // 첫 번째 리뷰 작성
      await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 4,
          content: '기존 리뷰'
        }
      });

      const reviewData = {
        orderId: testOrderId,
        rating: 5,
        content: '다시 작성하는 리뷰'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/reviews',
        headers: {
          authorization: `Bearer ${customerToken}`
        },
        payload: reviewData
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/reviews', () => {
    beforeEach(async () => {
      // 테스트 리뷰 생성
      testReviewId = (await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 5,
          title: '훌륭한 서비스',
          content: '정말 만족스러웠습니다.',
          isApproved: true
        }
      })).id;
    });

    it('리뷰 목록을 조회할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/reviews'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
    });

    it('전문가별로 리뷰를 필터링할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/reviews?expertId=${testExpertId}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.statistics).toBeDefined();
    });

    it('평점별로 리뷰를 필터링할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/reviews?rating=5'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.every((review: any) => review.rating === 5)).toBe(true);
    });
  });

  describe('GET /api/v1/reviews/:reviewId', () => {
    beforeEach(async () => {
      testReviewId = (await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 5,
          content: '상세 조회 테스트 리뷰'
        }
      })).id;
    });

    it('리뷰 상세 정보를 조회할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/reviews/${testReviewId}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testReviewId);
      expect(body.data.content).toBe('상세 조회 테스트 리뷰');
    });

    it('존재하지 않는 리뷰를 조회하면 404를 반환한다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/reviews/nonexistent-id'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/v1/reviews/:reviewId', () => {
    beforeEach(async () => {
      testReviewId = (await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 4,
          content: '수정 전 리뷰 내용',
          createdAt: new Date() // 최근 생성으로 설정
        }
      })).id;
    });

    it('작성자가 자신의 리뷰를 수정할 수 있다', async () => {
      const updateData = {
        rating: 5,
        content: '수정된 리뷰 내용'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/reviews/${testReviewId}`,
        headers: {
          authorization: `Bearer ${customerToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.rating).toBe(5);
      expect(body.data.content).toBe('수정된 리뷰 내용');
      expect(body.data.isApproved).toBe(false); // 재승인 필요
    });

    it('다른 사용자의 리뷰는 수정할 수 없다', async () => {
      const updateData = {
        content: '다른 사람이 수정하려는 내용'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/reviews/${testReviewId}`,
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: updateData
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/v1/reviews/:reviewId', () => {
    beforeEach(async () => {
      testReviewId = (await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 4,
          content: '삭제될 리뷰'
        }
      })).id;
    });

    it('작성자가 자신의 리뷰를 삭제할 수 있다', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/reviews/${testReviewId}`,
        headers: {
          authorization: `Bearer ${customerToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // 리뷰가 실제로 삭제되었는지 확인
      const deletedReview = await prisma.review.findUnique({
        where: { id: testReviewId }
      });
      expect(deletedReview).toBeNull();
    });

    it('다른 사용자의 리뷰는 삭제할 수 없다', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/reviews/${testReviewId}`,
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /api/v1/reviews/:reviewId/helpful', () => {
    beforeEach(async () => {
      testReviewId = (await prisma.review.create({
        data: {
          orderId: testOrderId,
          customerId: testCustomerId,
          expertId: testExpertId,
          rating: 5,
          content: '도움됨 테스트 리뷰',
          helpfulCount: 0
        }
      })).id;
    });

    it('인증된 사용자가 리뷰에 도움됨을 표시할 수 있다', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/reviews/${testReviewId}/helpful`,
        headers: {
          authorization: `Bearer ${expertToken}` // 전문가가 도움됨 표시
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.isHelpful).toBe(true);
      expect(body.data.helpfulCount).toBe(1);
    });

    it('이미 도움됨을 표시한 경우 취소할 수 있다', async () => {
      // 먼저 도움됨 표시
      await app.inject({
        method: 'POST',
        url: `/api/v1/reviews/${testReviewId}/helpful`,
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      // 다시 요청하여 취소
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/reviews/${testReviewId}/helpful`,
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.isHelpful).toBe(false);
      expect(body.data.helpfulCount).toBe(0);
    });

    it('인증되지 않은 사용자는 도움됨을 표시할 수 없다', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/reviews/${testReviewId}/helpful`
      });

      expect(response.statusCode).toBe(401);
    });
  });
});