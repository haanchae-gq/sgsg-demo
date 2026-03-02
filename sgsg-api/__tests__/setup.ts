// 테스트 설정 파일
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 로드 (프로젝트 루트의 .env 파일)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
// Prisma가 DB_URL 대신 DATABASE_URL을 사용하도록 설정
if (process.env.DB_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
}

// Create l function mock globally before any imports
const mockLFunction = (e: any, t?: any, n?: any): number => {
  // Mock string encoding behavior for WASM
  if (typeof e === 'string') {
    return 42;
  }
  if (e && typeof e.slice === 'function') {
    return e.length;
  }
  return 42;
};

// Set l function globally
(global as any).l = mockLFunction;

// Mock @prisma/internals to avoid ESM issues
jest.mock('@prisma/internals', () => ({}));

// Jest 전역 설정
global.beforeAll(() => {
  // 테스트 시작 전 실행
  console.log('테스트 환경 설정 중...');
  
  // Ensure l function is available globally
  (global as any).l = mockLFunction;
});

global.afterAll(() => {
  // 테스트 종료 후 실행
  console.log('테스트 완료.');
});

// Build function for creating test app instance (services 테스트용)
export async function build() {
  const Fastify = require('fastify');
  const cors = require('@fastify/cors');
  const helmet = require('@fastify/helmet');
  const { PrismaClient } = require('../src/generated/prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pg = require('pg');
  const authPlugin = require('../src/plugins/auth').default;
  const serviceRoutes = require('../src/routes/v1/services').default;

  // Create Fastify instance
  const app = Fastify({ 
    logger: false, // Disable logging for tests
  });

  // Prisma Client 인스턴스 생성 with adapter
  const connectionString = process.env.DB_URL;
  if (!connectionString) {
    throw new Error('DB_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: ['error'], // Only log errors in tests
  });

  // Prisma Client를 Fastify 인스턴스에 주입
  app.decorate('prisma', prisma);

  // 서버 종료 시 Prisma 연결 정리
  app.addHook('onClose', async (instance: any) => {
    await instance.prisma.$disconnect();
  });

  // CORS 설정
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // 보안 헤더 설정
  await app.register(helmet);

  // 인증 플러그인 등록
  await app.register(authPlugin);

  // API 라우트 등록
  app.register(async (api: any) => {
    api.register(serviceRoutes, { prefix: '/services' });
  }, { prefix: '/api/v1' });

  return app;
}

// createTestApp function for comprehensive testing (리뷰 테스트용)
export async function createTestApp() {
  const Fastify = require('fastify');
  const cors = require('@fastify/cors');
  const helmet = require('@fastify/helmet');
  const { PrismaClient } = require('../src/generated/prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pg = require('pg');
  const authPlugin = require('../src/plugins/auth').default;
  const authRoutes = require('../src/routes/v1/auth').default;
  const userRoutes = require('../src/routes/v1/users').default;
  const expertRoutes = require('../src/routes/v1/experts').default;
  const serviceRoutes = require('../src/routes/v1/services').default;
  const reviewRoutes = require('../src/routes/v1/reviews').default;

  // Create Fastify instance
  const app = Fastify({ 
    logger: false, // Disable logging for tests
  });

  // Prisma Client 인스턴스 생성 with adapter
  const connectionString = process.env.DB_URL;
  if (!connectionString) {
    throw new Error('DB_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: ['error'], // Only log errors in tests
  });

  // Prisma Client를 Fastify 인스턴스에 주입
  app.decorate('prisma', prisma);

  // 서버 종료 시 Prisma 연결 정리
  app.addHook('onClose', async (instance: any) => {
    await instance.prisma.$disconnect();
  });

  // CORS 설정
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // 보안 헤더 설정
  await app.register(helmet);

  // 인증 플러그인 등록
  await app.register(authPlugin);

  // API 라우트 등록
  app.register(async (api: any) => {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(userRoutes, { prefix: '/users' });
    api.register(expertRoutes, { prefix: '/experts' });
    api.register(serviceRoutes, { prefix: '/services' });
    api.register(reviewRoutes, { prefix: '/reviews' });
  }, { prefix: '/api/v1' });

  return app;
}