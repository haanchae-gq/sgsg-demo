import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import authPlugin from '../src/plugins/auth'
import authRoutes from '../src/routes/v1/auth'

// 테스트용 Fastify 앱 생성 함수
async function buildTestApp() {
  const app = Fastify({ logger: false })

  // Prisma Client 생성 (테스트용)
  const prisma = new PrismaClient()

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

  // 라우트 등록
  app.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' })
  }, { prefix: '/api/v1' })

  // 헬스 체크
  app.get('/health', async () => ({ status: 'ok' }))

  await app.ready()
  return app
}

describe('인증 API E2E 테스트', () => {
  let app: any
  let prisma: PrismaClient

  beforeAll(async () => {
    app = await buildTestApp()
    prisma = app.prisma
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    // 테스트 간 데이터 정리 (외래 키 제약 조건 준수)
    await prisma.$transaction([
      prisma.subAccount.deleteMany(),
      prisma.expert.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.admin.deleteMany(),
      prisma.user.deleteMany(),
    ])
  })

  test('POST /api/v1/auth/register - 회원가입 성공', async () => {
    const registerData = {
      email: 'test@example.com',
      phone: '01012345678',
      password: 'password123',
      name: '테스트 사용자',
      role: 'customer' as const,
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: registerData,
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(true)
    expect(body.data.user).toMatchObject({
      email: registerData.email,
      phone: registerData.phone,
      name: registerData.name,
      role: registerData.role,
      status: 'pending',
    })
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()

    // 데이터베이스에 사용자 생성 확인
    const user = await prisma.user.findUnique({
      where: { email: registerData.email },
    })
    expect(user).not.toBeNull()
    expect(user?.email).toBe(registerData.email)
  })

  test('POST /api/v1/auth/register - 중복 이메일로 회원가입 실패', async () => {
    // 첫 번째 사용자 생성
    const firstUser = await prisma.user.create({
      data: {
        email: 'duplicate@example.com',
        phone: '01011111111',
        passwordHash: 'hashed',
        name: '첫 번째 사용자',
        role: 'customer',
        status: 'active',
      },
    })

    const registerData = {
      email: 'duplicate@example.com', // 중복 이메일
      phone: '01022222222',
      password: 'password123',
      name: '두 번째 사용자',
      role: 'customer' as const,
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: registerData,
    })

    expect(response.statusCode).toBe(409)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_001')
  })

  test('POST /api/v1/auth/login - 로그인 성공', async () => {
    // 테스트 사용자 생성 (비밀번호 해싱)
    const passwordHash = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        email: 'login@example.com',
        phone: '01033333333',
        passwordHash,
        name: '로그인 테스트',
        role: 'customer',
        status: 'active',
      },
    })

    const loginData = {
      email: 'login@example.com',
      password: 'password123',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: loginData,
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(true)
    expect(body.data.user.email).toBe(loginData.email)
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
  })

  test('POST /api/v1/auth/login - 잘못된 비밀번호로 로그인 실패', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        email: 'login2@example.com',
        phone: '01044444444',
        passwordHash,
        name: '로그인 테스트2',
        role: 'customer',
        status: 'active',
      },
    })

    const loginData = {
      email: 'login2@example.com',
      password: 'wrongpassword',
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: loginData,
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('AUTH_001')
  })

  test('POST /api/v1/auth/refresh - 토큰 갱신 성공', async () => {
    // 사용자 생성 및 리프레시 토큰 발급
    const passwordHash = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        email: 'refresh@example.com',
        phone: '01055555555',
        passwordHash,
        name: '토큰 갱신 테스트',
        role: 'customer',
        status: 'active',
      },
    })

    // 먼저 로그인하여 리프레시 토큰 획득
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'refresh@example.com',
        password: 'password123',
      },
    })
    const loginBody = JSON.parse(loginResponse.payload)
    const refreshToken = loginBody.data.refreshToken

    // 토큰 갱신 요청
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(true)
    expect(body.data.accessToken).toBeDefined()
    expect(body.data.refreshToken).toBeDefined()
    // 새로 발급된 토큰은 기존과 달라야 함
    expect(body.data.refreshToken).not.toBe(refreshToken)
  })

  test('POST /api/v1/auth/logout - 로그아웃 (인증 필요)', async () => {
    // 사용자 생성 및 로그인
    const passwordHash = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        email: 'logout@example.com',
        phone: '01066666666',
        passwordHash,
        name: '로그아웃 테스트',
        role: 'customer',
        status: 'active',
      },
    })

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'logout@example.com',
        password: 'password123',
      },
    })
    const loginBody = JSON.parse(loginResponse.payload)
    const accessToken = loginBody.data.accessToken

    // 로그아웃 요청 (인증 헤더 포함)
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(true)
    expect(body.data.message).toBeDefined()
  })

  test('POST /api/v1/auth/logout - 인증 없이 로그아웃 시도 시 실패', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.payload)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('AUTH_001')
  })
})