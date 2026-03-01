import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import "dotenv/config";
import authPlugin from './plugins/auth';
import authRoutes from './routes/v1/auth';
import expertRoutes from './routes/v1/experts';
import userRoutes from './routes/v1/users';

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: any, reply: any) => Promise<void>;
    authorize: (roles: string[]) => (request: any, reply: any) => Promise<void>;
  }
}

// Fastify 앱 생성
const app = Fastify({ logger: true });

// 서버 시작
const start = async () => {
  // Prisma Client 인스턴스 생성 with adapter
  const connectionString = process.env.DB_URL;
  if (!connectionString) {
    throw new Error('DB_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Prisma Client를 Fastify 인스턴스에 주입
  app.decorate('prisma', prisma);

  // 서버 종료 시 Prisma 연결 정리
  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });

  // CORS 설정
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  // 보안 헤더 설정
  await app.register(helmet);

  // 인증 플러그인 등록
  await app.register(authPlugin);

  // API 라우트 등록
  app.register(async (api) => {
    // 인증 라우트
    api.register(authRoutes, { prefix: '/auth' });
    // 사용자 라우트
    api.register(userRoutes, { prefix: '/users' });
    // 전문가 라우트
    api.register(expertRoutes, { prefix: '/experts' });
  }, { prefix: '/api/v1' });

  // 헬스 체크 라우트
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  try {
    const port = parseInt(process.env.PORT || '4000');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();