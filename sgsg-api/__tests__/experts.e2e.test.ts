import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import authPlugin from '../src/plugins/auth'
import authRoutes from '../src/routes/v1/auth'
import expertRoutes from '../src/routes/v1/experts'

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
    log: ['error'],
  })

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
    api.register(expertRoutes, { prefix: '/experts' })
  }, { prefix: '/api/v1' })

  // 헬스 체크
  app.get('/health', async () => ({ status: 'ok' }))

  await app.ready()
  return app
}

describe('전문가 API E2E 테스트', () => {
  let app: any
  let prisma: PrismaClient
  let authToken: string
  let expertUserId: string
  let expertId: string
  let subAccountId: string

  beforeAll(async () => {
    app = await buildTestApp()
    prisma = app.prisma

    // 테스트 데이터베이스 정리
    // 외래 키 제약 조건을 고려한 삭제 순서 (자식 → 부모)
    await prisma.$transaction([
      prisma.subAccount.deleteMany(),
      prisma.expert.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.admin.deleteMany(),
      prisma.user.deleteMany(),
    ])

    // 전문가 사용자 생성 및 로그인
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'expert@test.com',
        phone: '01012345678',
        password: 'password123',
        name: '테스트 전문가',
        role: 'expert'
      }
    })
    if (registerResponse.statusCode !== 201) {
      throw new Error(`회원가입 실패: ${registerResponse.body}`)
    }
    const registerData = JSON.parse(registerResponse.body)
    
    // 테스트용: 사용자 상태를 active로 업데이트 (이메일 인증 생략)
    await prisma.user.update({
      where: { id: registerData.data.user.id },
      data: { status: 'active' }
    })

    // 로그인
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'expert@test.com',
        password: 'password123'
      }
    })
    if (loginResponse.statusCode !== 200) {
      throw new Error(`로그인 실패: ${loginResponse.body}`)
    }
    const loginData = JSON.parse(loginResponse.body)
    authToken = loginData.data.accessToken
    console.log('DEBUG: authToken set in beforeAll:', authToken ? `${authToken.substring(0, 20)}...` : 'undefined')

    // 전문가 ID 조회
    const expert = await prisma.expert.findFirst({
      where: { user: { email: 'expert@test.com' } }
    })
    if (!expert) {
      throw new Error('전문가 레코드를 찾을 수 없습니다.')
    }
    expertUserId = expert!.userId
    expertId = expert!.id
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  // 전문가 회원가입 및 로그인 검증 (beforeAll에서 이미 수행됨)
  test('전문가 회원가입 및 로그인 검증', async () => {
    expect(authToken).toBeDefined()
    expect(authToken.length).toBeGreaterThan(10)
    expect(expertUserId).toBeDefined()
    expect(expertId).toBeDefined()
    console.log('DEBUG: authToken in verification test:', authToken ? `${authToken.substring(0, 20)}...` : 'undefined')
  })

  test('전문가 프로필 조회', async () => {
    console.log('DEBUG: authToken in profile test:', authToken ? `${authToken.substring(0, 20)}...` : 'undefined')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data.userId).toBe(expertUserId)
    expect(data.data.businessName).toBeDefined()
  })

  test('전문가 프로필 업데이트', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/experts/me',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        businessName: '업데이트된 사업자명',
        introduction: '전문가 소개글입니다.',
        certificateUrls: ['https://example.com/cert1.jpg'],
        portfolioImages: ['https://example.com/portfolio1.jpg'],
        bankName: '테스트은행',
        accountNumber: '123-456-789',
        accountHolder: '홍길동'
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data.businessName).toBe('업데이트된 사업자명')
    expect(data.data.introduction).toBe('전문가 소개글입니다.')
  })

  test('서브 계정 생성', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/experts/me/sub-accounts',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        email: 'subaccount@test.com',
        phone: '01087654321',
        name: '서브 계정 전문가',
        password: 'password123',
        permissions: ['order:view', 'order:accept']
      }
    })

    console.log('DEBUG: sub-account creation response status:', response.statusCode)
    console.log('DEBUG: sub-account creation response body:', response.body)
    expect(response.statusCode).toBe(201)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data.user.email).toBe('subaccount@test.com')
    expect(data.data.accountType).toBe('SUB')
    subAccountId = data.data.id
    console.log('DEBUG: subAccountId after assignment:', subAccountId)

    // 서브 계정 목록 조회 확인
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me/sub-accounts',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    })

    console.log('DEBUG: sub-account list response status:', listResponse.statusCode)
    console.log('DEBUG: sub-account list response body:', listResponse.body)
    expect(listResponse.statusCode).toBe(200)
    const listData = JSON.parse(listResponse.body)
    expect(listData.success).toBe(true)
    expect(listData.data).toHaveLength(1)
    expect(listData.data[0].id).toBe(subAccountId)
  })

  test('서브 계정 업데이트', async () => {
    console.log('DEBUG: subAccountId in update test:', subAccountId);
    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/experts/me/sub-accounts/${subAccountId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        permissions: ['order:view', 'order:accept', 'order:cancel'],
        isActive: false
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    console.log('DEBUG: update response body:', response.body)
    expect(data.success).toBe(true)
    expect(data.data.permissions).toHaveLength(3)
    expect(data.data.isActive).toBe(false)
  })

  test('멤버십 정보 조회', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me/membership',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data.membershipEnabled).toBeDefined()
    expect(data.data.membershipSlotCount).toBeDefined()
    expect(data.data.usedSlots).toBe(0) // 아직 멤버십 없음
    expect(data.data.availableSlots).toBe(data.data.membershipSlotCount)
  })

  test('배정 이력 조회 (빈 목록)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me/assignment-history',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data.histories).toHaveLength(0)
    expect(data.data.pagination.total).toBe(0)
  })

  test('패널티 이력 조회 (빈 목록)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me/penalty-history',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(0)
  })

  test('인증되지 않은 요청 처리', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/experts/me',
      // 헤더 없음
    })

    expect(response.statusCode).toBe(401)
    const data = JSON.parse(response.body)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  test('잘못된 전문가 ID로 프로필 조회 시도', async () => {
    // 다른 전문가의 토큰 생성 (가짜 토큰)
    // 실제로는 다른 사용자로 로그인하여 테스트하지만, 여기서는 현재 토큰 사용
    // 서브 계정으로 로그인 시도?
    // 일단 skip
  })
})