import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import authPlugin from '../src/plugins/auth'
import authRoutes from '../src/routes/v1/auth'
import userRoutes from '../src/routes/v1/users'

// 테스트용 Fastify 앱 생성 함수
async function buildTestApp() {
  const app = Fastify({ logger: false })

  // Prisma Client 생성 (테스트용) with adapter
  const connectionString = process.env.DB_URL
  if (!connectionString) {
    throw new Error('DB_URL environment variable is not set')
  }
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({
    adapter,
  })

  // Prisma Client 주입
  app.decorate('prisma', prisma)

  // JWT 비밀키 설정 (테스트용)
  app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'test-secret-key'
  })

  // 서버 종료 시 연결 정리
  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })

  // CORS 설정 (테스트용 단순화)
  await app.register(cors, { origin: '*' })
  await app.register(helmet)
  await app.register(authPlugin)

  // Error handler for validation errors
  app.setErrorHandler(async (error: any, request, reply) => {
    if (error.validation) {
      // Fastify 스키마 검증 오류를 400으로 처리
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '요청 데이터가 유효하지 않습니다.',
          details: error.validation
        }
      })
    }
    
    if (error.statusCode === 400) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message || '잘못된 요청입니다.'
        }
      })
    }

    // 기타 에러는 500으로 처리
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 내부 오류가 발생했습니다.'
      }
    })
  })

  // 라우트 등록
  app.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' })
    api.register(userRoutes, { prefix: '/users' })
  }, { prefix: '/api/v1' })

  // 헬스 체크
  app.get('/health', async () => ({ status: 'ok' }))

  await app.ready()
  return app
}

describe('사용자 관리 API E2E 테스트', () => {
  let app: any
  let prisma: PrismaClient
  let testUser: any
  let testToken: string
  let testAddressId: string
  let testNotificationId: string

  beforeAll(async () => {
    app = await buildTestApp()
    prisma = app.prisma

    // 테스트용 사용자 생성
    const passwordHash = await bcrypt.hash('password123', 10)
    testUser = await prisma.user.create({
      data: {
        email: 'user.test@example.com',
        phone: '01012345678',
        passwordHash,
        name: '테스트 사용자',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
      }
    })

    // 테스트용 고객 정보 생성
    await prisma.customer.create({
      data: {
        userId: testUser.id,
        totalSpent: 0,
        totalOrders: 0,
        favoriteCategories: [],
        preferences: { language: 'ko', marketing: true, notifications: true }
      }
    })

    // JWT 토큰 생성
    testToken = app.jwt.sign({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
      type: 'access'
    })

    // 테스트용 알림 생성
    const notification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        type: 'system',
        title: '테스트 알림',
        message: '테스트 알림 메시지',
        data: {}
      }
    })
    testNotificationId = notification.id
  })

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.notification.deleteMany({ where: { userId: testUser.id } })
    await prisma.address.deleteMany({ where: { userId: testUser.id } })
    await prisma.customer.deleteMany({ where: { userId: testUser.id } })
    await prisma.user.deleteMany({ where: { id: testUser.id } })
    await app.close()
  })

  describe('GET /api/v1/users/me - 현재 사용자 프로필 조회', () => {
    test('인증된 사용자는 자신의 프로필을 조회할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })
      
      console.log('Response payload:', response.payload)
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.user).toBeDefined()
      expect(result.data.user.id).toBe(testUser.id)
      expect(result.data.user.email).toBe(testUser.email)
      expect(result.data.user.name).toBe(testUser.name)
      expect(result.data.user.role).toBe(testUser.role)
      expect(result.data.defaultAddress).toBeDefined()
    })

    test('인증되지 않은 사용자는 프로필을 조회할 수 없다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me'
        // 헤더에 토큰 없음
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /api/v1/users/me - 현재 사용자 프로필 수정', () => {
    test('인증된 사용자는 자신의 프로필을 수정할 수 있다', async () => {
      const updateData = {
        name: '수정된 이름',
        avatarUrl: 'https://example.com/new-avatar.jpg'
      }

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: updateData
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.user.name).toBe('수정된 이름')
      expect(result.data.user.avatarUrl).toBe('https://example.com/new-avatar.jpg')
    })

    test('유효하지 않은 데이터로는 프로필을 수정할 수 없다', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: {} // 빈 데이터
      })

      expect(response.statusCode).toBe(409) // VALIDATION_001 -> 409
    })
  })

  describe('GET /api/v1/users/me/addresses - 사용자 주소록 조회', () => {
    beforeEach(async () => {
      // 각 테스트 전에 주소 데이터 정리
      await prisma.address.deleteMany({ where: { userId: testUser.id } })
    })

    test('인증된 사용자는 자신의 주소록을 조회할 수 있다', async () => {
      // 테스트 주소 생성
      await prisma.address.create({
        data: {
          userId: testUser.id,
          label: '집',
          addressLine1: '서울특별시 강남구 테헤란로 123',
          city: '서울특별시',
          state: '강남구',
          postalCode: '06123',
          country: 'South Korea',
          isDefault: true
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/addresses',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(1)
      expect(result.data[0].label).toBe('집')
      expect(result.data[0].isDefault).toBe(true)
    })

    test('주소가 없으면 빈 배열을 반환한다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/addresses',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data.length).toBe(0)
    })
  })

  describe('POST /api/v1/users/me/addresses - 주소 추가', () => {
    beforeEach(async () => {
      await prisma.address.deleteMany({ where: { userId: testUser.id } })
    })

    test('인증된 사용자는 새로운 주소를 추가할 수 있다', async () => {
      const addressData = {
        label: '회사',
        addressLine1: '서울특별시 서초구 서초대로 456',
        addressLine2: '101호',
        city: '서울특별시',
        state: '서초구',
        postalCode: '06677',
        country: 'South Korea',
        isDefault: true
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users/me/addresses',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: addressData
      })

      expect(response.statusCode).toBe(201)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.label).toBe('회사')
      expect(result.data.isDefault).toBe(true)
      expect(result.data.id).toBeDefined()

      // 생성된 주소 ID 저장
      testAddressId = result.data.id
    })

    test('필수 필드가 누락된 경우 주소를 추가할 수 없다', async () => {
      const invalidData = {
        label: '회사'
        // 필수 필드 누락
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users/me/addresses',
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: invalidData
      })

      expect(response.statusCode).toBe(400) // Fastify schema validation error
    })
  })

  describe('PUT /api/v1/users/me/addresses/:addressId - 주소 수정', () => {
    beforeEach(async () => {
      await prisma.address.deleteMany({ where: { userId: testUser.id } })
      // 테스트 주소 생성
      const address = await prisma.address.create({
        data: {
          userId: testUser.id,
          label: '회사',
          addressLine1: '서울특별시 서초구 서초대로 456',
          city: '서울특별시',
          state: '서초구',
          postalCode: '06677',
          country: 'South Korea',
          isDefault: false
        }
      })
      testAddressId = address.id
    })

    test('인증된 사용자는 자신의 주소를 수정할 수 있다', async () => {
      const updateData = {
        label: '수정된 회사',
        isDefault: true
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/me/addresses/${testAddressId}`,
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: updateData
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.label).toBe('수정된 회사')
      expect(result.data.isDefault).toBe(true)
    })

    test('다른 사용자의 주소는 수정할 수 없다', async () => {
      // 다른 사용자 생성
      const otherUser = await prisma.user.create({
        data: {
          email: 'other.user@example.com',
          phone: '01087654321',
          passwordHash: await bcrypt.hash('password123', 10),
          name: '다른 사용자',
          role: 'customer',
          status: 'active'
        }
      })

      const otherAddress = await prisma.address.create({
        data: {
          userId: otherUser.id,
          label: '다른 사용자 주소',
          addressLine1: '다른 주소',
          city: '서울',
          state: '강남',
          postalCode: '12345',
          country: 'South Korea'
        }
      })

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/me/addresses/${otherAddress.id}`,
        headers: {
          authorization: `Bearer ${testToken}`,
          'content-type': 'application/json'
        },
        payload: { label: '수정 시도' }
      })

      expect(response.statusCode).toBe(404) // NOT_FOUND

      // 정리
      await prisma.address.deleteMany({ where: { userId: otherUser.id } })
      await prisma.user.deleteMany({ where: { id: otherUser.id } })
    })
  })

  describe('DELETE /api/v1/users/me/addresses/:addressId - 주소 삭제', () => {
    beforeEach(async () => {
      await prisma.address.deleteMany({ where: { userId: testUser.id } })
      // 테스트 주소 생성 (기본 주소 아님)
      const address = await prisma.address.create({
        data: {
          userId: testUser.id,
          label: '삭제할 주소',
          addressLine1: '삭제할 주소 1',
          city: '서울',
          state: '강남',
          postalCode: '12345',
          country: 'South Korea',
          isDefault: false
        }
      })
      testAddressId = address.id
    })

    test('인증된 사용자는 자신의 주소를 삭제할 수 있다', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/me/addresses/${testAddressId}`,
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.success).toBe(true)
    })

    test('기본 주소는 삭제할 수 없다', async () => {
      // 기본 주소 생성
      const defaultAddress = await prisma.address.create({
        data: {
          userId: testUser.id,
          label: '기본 주소',
          addressLine1: '기본 주소 1',
          city: '서울',
          state: '강남',
          postalCode: '12345',
          country: 'South Korea',
          isDefault: true
        }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/users/me/addresses/${defaultAddress.id}`,
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(409) // VALIDATION_001 -> 409
    })
  })

  describe('GET /api/v1/users/me/notifications - 알림 목록 조회', () => {
    beforeEach(async () => {
      await prisma.notification.deleteMany({ where: { userId: testUser.id } })
      // 테스트 알림 생성
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser.id,
            type: 'system',
            title: '알림 1',
            message: '메시지 1',
            data: {}
          },
          {
            userId: testUser.id,
            type: 'order',
            title: '알림 2',
            message: '메시지 2',
            data: {}
          }
        ]
      })
    })

    test('인증된 사용자는 자신의 알림 목록을 조회할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/notifications',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.notifications).toBeDefined()
      expect(result.data.pagination).toBeDefined()
      expect(Array.isArray(result.data.notifications)).toBe(true)
      expect(result.data.notifications.length).toBe(2)
    })

    test('페이지네이션 파라미터를 사용할 수 있다', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/notifications?page=1&limit=1',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.notifications.length).toBe(1)
      expect(result.data.pagination.page).toBe(1)
      expect(result.data.pagination.limit).toBe(1)
    })
  })

  describe('PUT /api/v1/users/me/notifications/:notificationId/read - 알림 읽음 표시', () => {
    beforeEach(async () => {
      // 테스트 알림 생성
      const notification = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'system',
          title: '읽음 테스트 알림',
          message: '이 알림은 읽음 테스트용입니다.',
          data: {}
        }
      })
      testNotificationId = notification.id
    })

    test('인증된 사용자는 알림을 읽음 상태로 표시할 수 있다', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/users/me/notifications/${testNotificationId}/read`,
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.payload)
      expect(result.success).toBe(true)
      expect(result.data.isRead).toBe(true)
      expect(result.data.readAt).toBeDefined()
    })

    test('존재하지 않는 알림은 읽음 상태로 표시할 수 없다', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/notifications/invalid-notification-id/read',
        headers: {
          authorization: `Bearer ${testToken}`
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })
})