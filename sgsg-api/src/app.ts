import Fastify from 'fastify';
import { FastifyError } from 'fastify';
import pino from 'pino';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import "dotenv/config";
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import client from 'prom-client';
import authPlugin from './plugins/auth';
import authRoutes from './routes/v1/auth';
import expertRoutes from './routes/v1/experts';
import userRoutes from './routes/v1/users';
import uploadRoutes from './routes/v1/upload';
import notificationRoutes from './routes/v1/notifications';
import serviceRoutes from './routes/v1/services';
import orderRoutes from './routes/v1/orders';
import paymentRoutes from './routes/v1/payments';
import reviewRoutes from './routes/v1/reviews';
import adminRoutes from './routes/v1/admin';
import dashboardRoutes from './routes/v1/dashboard';
import websocketRoutes from './routes/websocket';
import path from 'path';

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    metrics: client.Registry;
    authenticate: (request: any, reply: any) => Promise<void>;
    optionalAuthenticate: (request: any, reply: any) => Promise<void>;
    authorize: (roles: string[]) => (request: any, reply: any) => Promise<void>;
  }
}

// Fastify 앱 생성
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined,
    file: process.env.LOG_FILE || './logs/app.log'
  }
});

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

  // Prometheus 메트릭 설정
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  // Fastify 인스턴스에 메트릭 레지스트리 주입
  app.decorate('metrics', register);

  // CORS 설정
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  // 보안 헤더 설정
  await app.register(helmet);

  // Swagger OpenAPI 문서화
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'SGSG API Documentation',
        description: 'Service Platform API with Fastify and TypeScript',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 4000}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management' },
        { name: 'services', description: 'Service catalog' },
        { name: 'orders', description: 'Order management' },
        { name: 'payments', description: 'Payment processing' },
        { name: 'uploads', description: 'File uploads' },
        { name: 'experts', description: 'Expert management' },
        { name: 'reviews', description: 'Review system' },
        { name: 'notifications', description: 'Notifications' },
        { name: 'dashboard', description: 'Dashboard statistics' }
      ]
    }
  });

  // Swagger UI 설정
  await app.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // 인증 플러그인 등록
  await app.register(authPlugin);

  // Validation Error Handler - Schema 검증 오류 처리
  app.setErrorHandler(async (error: FastifyError, request, reply) => {
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
  });

  // WebSocket 플러그인 등록 (실시간 알림용)
  await app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576 // 1MB
    }
  });

  // 정적 파일 서빙 (업로드 파일 접근)
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await app.register(fastifyStatic, {
    root: path.resolve(uploadDir),
    prefix: '/uploads/',
    decorateReply: false, // reply.sendFile 사용 안 함
  });

  // API 라우트 등록
  app.register(async (api) => {
    // 인증 라우트 (핵심)
    api.register(authRoutes, { prefix: '/auth' });
    // 사용자 라우트 (핵심)
    api.register(userRoutes, { prefix: '/users' });
    // 파일 업로드 라우트 (핵심)
    api.register(uploadRoutes, { prefix: '/upload' });
    // 결제 관리 라우트 (핵심)
    api.register(paymentRoutes, { prefix: '/payments' });
    // 서비스 카탈로그 라우트 (핵심)
    api.register(serviceRoutes, { prefix: '/services' });
    // 주문 관리 라우트 (핵심)
    api.register(orderRoutes, { prefix: '/orders' });
    
    // TODO: 스키마 불일치 문제 해결 후 아래 라우트들 재활성화
    // api.register(expertRoutes, { prefix: '/experts' });
    // api.register(notificationRoutes, { prefix: '/notifications' });
    // api.register(reviewRoutes, { prefix: '/reviews' });
    // api.register(adminRoutes, { prefix: '/admin' });
    // api.register(dashboardRoutes, { prefix: '/dashboard' });
  }, { prefix: '/api/v1' });

  // WebSocket 라우트 등록 (인증 라이트 외부에서)
  app.register(websocketRoutes);

  // 헬스 체크 라우트
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Prometheus 메트릭 라우트
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
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