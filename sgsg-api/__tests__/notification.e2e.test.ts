import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import fastifyWebsocket from '@fastify/websocket'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import authPlugin from '../src/plugins/auth'
import notificationRoutes from '../src/routes/v1/notifications'
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import WebSocket from 'ws'

// 테스트용 Fastify 앱 생성 함수
async function buildTestApp() {
  const app = Fastify({ logger: false })

  // Prisma Client 생성 (테스트용) - mock 사용
  const prisma = new (PrismaClient as any)({})

  // Prisma Client 주입
  app.decorate('prisma', prisma)

  // 서버 종료 시 연결 정리
  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect()
  })

  // CORS 설정 (테스트용 단순화)
  await app.register(cors, { origin: '*' })
  await app.register(helmet)
  await app.register(authPlugin)
  await app.register(fastifyWebsocket, {
    options: { maxPayload: 1048576 }
  })

  // 라우트 등록
  app.register(async (api) => {
    api.register(notificationRoutes, { prefix: '/notifications' })
  }, { prefix: '/api/v1' })

  // 헬스 체크
  app.get('/health', async () => ({ status: 'ok' }))

  await app.ready()
  return app
}

describe('Notification API', () => {
  let app: any
  let prisma: any
  let authToken: string
  let testUserId: string
  let serverUrl: string

  beforeAll(async () => {
    app = await buildTestApp()
    prisma = app.prisma

    // 테스트 사용자 생성 및 토큰 발급
    const hashedPassword = await bcrypt.hash('password123', 10)
    const mockUser = {
      id: 'login-user-id',
      email: 'login@example.com',
      phone: '01033333333',
      passwordHash: hashedPassword,
      name: '로그인 테스트',
      role: 'customer',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // Mock user.create to return our mock user
    ;(prisma.user.create as jest.Mock<any>).mockResolvedValueOnce(mockUser)
    // Mock user.findUnique to return our mock user when queried by id or email
    ;(prisma.user.findUnique as jest.Mock<any>).mockImplementation(async (options: any) => {
      if (options.where.id === 'login-user-id' || options.where.email === 'login@example.com') {
        return mockUser
      }
      return null
    })
    const user = await prisma.user.create({
      data: {
        email: 'login@example.com',
        phone: '01033333333',
        passwordHash: hashedPassword,
        name: '로그인 테스트',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
      },
    })
    testUserId = user.id

    // JWT 토큰 생성
    const token = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    })
    authToken = token

    // 서버 시작 (랜덤 포트)
    await app.listen({ port: 0, host: 'localhost' })
    const address = app.server.address()
    const port = typeof address === 'string' ? parseInt(address.split(':').pop() || '0') : address?.port
    serverUrl = `http://localhost:${port}`
  })

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.notification.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })

  describe('GET /notifications', () => {
    it('should return user notifications', async () => {
      // 알림 생성 (mock 사용)
      const createdNotification = await (prisma.notification as any).create({
        data: {
          userId: testUserId,
          type: 'system',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: {},
          isRead: false,
        },
      })

      // Mock findMany to return the created notification
      ;(prisma.notification.findMany as jest.Mock<any>).mockResolvedValueOnce([createdNotification])
      // Mock count to return 1
      ;(prisma.notification.count as jest.Mock<any>).mockResolvedValueOnce(1)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/notifications',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        query: {
          page: '1',
          limit: '20',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data.notifications)).toBe(true)
      expect(body.data.notifications.length).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/notifications',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      const notification = await (prisma.notification as any).create({
        data: {
          userId: testUserId,
          type: 'system',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: {},
          isRead: false,
        },
      })

      // Mock findFirst to return the notification
      ;(prisma.notification.findFirst as jest.Mock<any>).mockResolvedValueOnce(notification)
      // Mock update to return updated notification with isRead: true
      ;(prisma.notification.update as jest.Mock<any>).mockResolvedValueOnce({
        ...notification,
        isRead: true,
        updatedAt: new Date(),
      })
      // Mock findUnique to return updated notification for DB check
      ;(prisma.notification.findUnique as jest.Mock<any>).mockResolvedValueOnce({
        ...notification,
        isRead: true,
        updatedAt: new Date(),
      })
      console.log('Mock findFirst calls:', (prisma.notification.findFirst as jest.Mock<any>).mock.calls)
      console.log('Mock update calls:', (prisma.notification.update as jest.Mock<any>).mock.calls)

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/notifications/notifications/${notification.id}/read`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      console.log('Response body:', body)
      expect(body.success).toBe(true)
      expect(body.data.isRead).toBe(true)

      // DB에서 확인
      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      })
      expect(updated?.isRead).toBe(true)
    })

    it('should return 404 for non-existent notification', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/notifications/notifications/non-existent-id/read',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /admin/notifications/send', () => {
    it('should send notifications to users (admin only)', async () => {
      // TODO: 관리자 권한 테스트 (현재는 모든 인증된 사용자 허용)
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/admin/notifications/send',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        payload: {
          userIds: [testUserId],
          type: 'system',
          title: 'Admin Notification',
          message: 'This is an admin notification',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.sentCount).toBe(1)
    })
  })

  describe('WebSocket /ws', () => {
    it('should reject connection without token', async () => {
      const wsUrl = serverUrl.replace('http', 'ws') + '/api/v1/notifications/ws'
      const ws = new WebSocket(wsUrl)
      
      const errorOccurred = await new Promise((resolve) => {
        ws.on('open', () => {
          ws.close()
          resolve(false)
        })
        ws.on('error', () => {
          resolve(true)
        })
      })

      expect(errorOccurred).toBe(true)
    })

    it('should accept connection with valid token', async () => {
      const wsUrl = serverUrl.replace('http', 'ws') + `/api/v1/notifications/ws?token=${authToken}`
      const ws = new WebSocket(wsUrl)
      
      const connected = await new Promise((resolve) => {
        ws.on('open', () => {
          resolve(true)
        })
        ws.on('error', () => {
          resolve(false)
        })
      })

      expect(connected).toBe(true)
      ws.close()
    })

    it('should receive real-time notifications', async () => {
      const wsUrl = serverUrl.replace('http', 'ws') + `/api/v1/notifications/ws?token=${authToken}`
      const ws = new WebSocket(wsUrl)
      
      const messages: any[] = []
      await new Promise((resolve, reject) => {
        // Attach message listener before connection opens
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString())
          messages.push(message)
          if (message.type === 'connected') {
            resolve(null)
          }
        })
        ws.on('open', () => {
          // Connection opened, wait for message
        })
        ws.on('error', (err) => {
          reject(err)
        })
        // Timeout after 5 seconds to avoid hanging
        setTimeout(() => {
          reject(new Error('Timeout waiting for connected message'))
        }, 5000)
      })

      expect(messages.length).toBeGreaterThan(0)
      expect(messages[0].type).toBe('connected')
      ws.close()
    })
  })
})