const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv/config');

// Fastify 앱 생성
const app = Fastify({ logger: true });

// 서버 시작
const start = async () => {
    try {
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

        // 기본 에러 핸들러
        app.setErrorHandler(async (error, request, reply) => {
            request.log.error(error);
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '서버 내부 오류가 발생했습니다.'
                }
            });
        });

        // 헬스 체크 라우트
        app.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // 기본 API 응답
        app.get('/api/v1/status', async () => {
            return { 
                success: true, 
                message: 'SGSG API is running', 
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };
        });

        // 총 서비스 개수 API - 데이터베이스 연결 테스트
        app.get('/api/v1/services/count', async (request, reply) => {
            try {
                const serviceCount = await prisma.serviceCategory.count();
                const itemCount = await prisma.serviceItem.count();
                return {
                    success: true,
                    data: {
                        categories: serviceCount,
                        items: itemCount,
                        total: serviceCount + itemCount
                    }
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'DATABASE_ERROR',
                        message: '데이터베이스 연결 오류입니다.'
                    }
                });
            }
        });

        // 서비스 카테고리 목록 API
        app.get('/api/v1/services/categories', async (request, reply) => {
            try {
                const categories = await prisma.serviceCategory.findMany({
                    include: {
                        items: {
                            take: 5  // 최대 5개 아이템만
                        }
                    }
                });
                return {
                    success: true,
                    data: categories
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'DATABASE_ERROR',
                        message: '서비스 카테고리를 불러올 수 없습니다.'
                    }
                });
            }
        });

        const port = parseInt(process.env.PORT || '4000');
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();