const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const fastifyJwt = require('@fastify/jwt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const crypto = require('crypto');
require('dotenv/config');

// Fastify 앱 생성
const app = Fastify({ logger: true });

// 서버 시작
const start = async () => {
    try {
        // PostgreSQL 직접 연결 (Prisma 대신)
        const connectionString = process.env.DB_URL;
        if (!connectionString) {
            throw new Error('DB_URL environment variable is not set');
        }
        const pool = new pg.Pool({ 
            connectionString,
            // 프로덕션 연결 풀 최적화
            min: parseInt(process.env.DB_POOL_MIN || '2'),
            max: parseInt(process.env.DB_POOL_MAX || '10'),
            idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000'),
            connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000'),
            // 연결 유지 설정
            keepAlive: true,
            keepAliveInitialDelayMillis: 0,
        });

        // PostgreSQL Pool을 Fastify 인스턴스에 주입
        app.decorate('db', pool);

        // 서버 종료 시 연결 정리
        app.addHook('onClose', async (instance) => {
            await instance.db.end();
        });

        // CORS 설정
        await app.register(cors, {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
            credentials: true,
        });

        // 보안 헤더 설정
        await app.register(helmet);

        // JWT 플러그인 등록 (메인 토큰만 - 리프레시는 수동 처리)
        await app.register(fastifyJwt, {
            secret: process.env.JWT_SECRET,
            sign: {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        });

        // 인증 미들웨어
        app.decorate('authenticate', async function(request, reply) {
            try {
                const token = await request.jwtVerify();
                
                // 토큰 블랙리스트 확인
                const blacklistedToken = await pool.query(
                    'SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > NOW()',
                    [request.headers.authorization?.replace('Bearer ', '')]
                );
                
                if (blacklistedToken.rows.length > 0) {
                    return reply.status(401).send({
                        success: false,
                        error: { code: 'TOKEN_BLACKLISTED', message: '토큰이 무효화되었습니다.' }
                    });
                }
                
                request.user = token;
            } catch (err) {
                return reply.status(401).send({
                    success: false,
                    error: { code: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다.' }
                });
            }
        });

        // 기본 에러 핸들러
        app.setErrorHandler(async (error, request, reply) => {
            request.log.error(error);
            return reply.status(500).send({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: '서버 내부 오류가 발생했습니다.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                }
            });
        });

        // 헬스 체크 라우트
        app.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // API 상태 체크 (직접 SQL 사용)
        app.get('/api/v1/status', async (request, reply) => {
            try {
                // 데이터베이스 연결 테스트 (직접 SQL)
                const categoriesResult = await pool.query('SELECT COUNT(*) as count FROM service_categories');
                const itemsResult = await pool.query('SELECT COUNT(*) as count FROM service_items');
                
                return { 
                    success: true, 
                    message: 'SGSG API is running', 
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    database: {
                        connected: true,
                        categories: parseInt(categoriesResult.rows[0].count),
                        items: parseInt(itemsResult.rows[0].count)
                    }
                };
            } catch (error) {
                return {
                    success: true, 
                    message: 'SGSG API is running (DB connection failed)', 
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    database: {
                        connected: false,
                        error: error.message
                    }
                };
            }
        });

        // 서비스 카테고리 목록 API (직접 SQL 사용)
        app.get('/api/v1/services/categories', async (request, reply) => {
            try {
                const result = await pool.query(`
                    SELECT id, name, slug, description, icon_url, display_order, is_active, created_at, updated_at 
                    FROM service_categories 
                    WHERE is_active = true 
                    ORDER BY display_order ASC
                `);
                
                return {
                    success: true,
                    data: result.rows,
                    count: result.rows.length
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'DATABASE_ERROR',
                        message: '서비스 카테고리를 불러올 수 없습니다.',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    }
                });
            }
        });

        // 서비스 아이템 목록 API (직접 SQL 사용)
        app.get('/api/v1/services/items', async (request, reply) => {
            try {
                const result = await pool.query(`
                    SELECT id, category_id, name, description, base_price, estimated_time, 
                           requirements, images, is_active, display_order, created_at, updated_at 
                    FROM service_items 
                    WHERE is_active = true 
                    ORDER BY display_order ASC
                `);
                
                return {
                    success: true,
                    data: result.rows,
                    count: result.rows.length
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'DATABASE_ERROR', 
                        message: '서비스 아이템을 불러올 수 없습니다.',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    }
                });
            }
        });

        // 강화된 로그인 시스템
        app.post('/api/v1/auth/login', async (request, reply) => {
            try {
                const { email, password } = request.body || {};
                
                if (!email || !password) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'MISSING_CREDENTIALS', message: '이메일과 비밀번호를 입력해주세요.' }
                    });
                }
                
                // 임시 테스트 계정들
                const testAccounts = [
                    { email: 'go@sgsgcare.com', password: 'Admin@123456', role: 'admin', name: '관리자' },
                    { email: 'expert@sgsg.com', password: 'Expert@123456', role: 'expert', name: '전문가' },
                    { email: 'customer@sgsg.com', password: 'Customer@123456', role: 'customer', name: '고객' }
                ];
                
                const user = testAccounts.find(acc => acc.email === email && acc.password === password);
                
                if (!user) {
                    return reply.status(401).send({
                        success: false,
                        error: { code: 'AUTH_FAILED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
                    });
                }
                
                // Access Token 생성 (24시간)
                const accessToken = app.jwt.sign({ 
                    id: crypto.randomUUID(),
                    email: user.email, 
                    role: user.role,
                    name: user.name,
                    type: 'access'
                });
                
                // 임시: 간단한 리프레시 토큰 (문자열)
                const refreshToken = crypto.randomBytes(32).toString('hex');
                
                // 리프레시 토큰을 데이터베이스에 저장
                const refreshTokenId = crypto.randomUUID();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료
                
                // 기존 리프레시 토큰 삭제 후 새로 생성 (실제 user id 사용)
                const userId = user.email === 'go@sgsgcare.com' ? 'admin1' : 
                              user.email === 'expert@sgsg.com' ? 'expert1' : 'customer1';
                await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
                await pool.query(
                    `INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)`,
                    [refreshTokenId, userId, refreshToken, expiresAt]
                );
                
                return {
                    success: true,
                    message: '로그인 성공',
                    data: {
                        accessToken,
                        refreshToken,
                        user: { 
                            email: user.email, 
                            role: user.role, 
                            name: user.name 
                        },
                        expiresIn: 24 * 60 * 60 // 24시간 (초 단위)
                    }
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: { code: 'LOGIN_ERROR', message: '로그인 처리 중 오류가 발생했습니다.' }
                });
            }
        });

        // 리프레시 토큰 API
        app.post('/api/v1/auth/refresh', async (request, reply) => {
            try {
                const { refreshToken } = request.body || {};
                
                if (!refreshToken) {
                    return reply.status(400).send({
                        success: false,
                        error: { code: 'MISSING_REFRESH_TOKEN', message: '리프레시 토큰이 필요합니다.' }
                    });
                }
                
                // 데이터베이스에서 리프레시 토큰 확인 (간소화)
                const tokenRecord = await pool.query(
                    'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW() AND is_revoked = false',
                    [refreshToken]
                );
                
                if (tokenRecord.rows.length === 0) {
                    return reply.status(401).send({
                        success: false,
                        error: { code: 'INVALID_REFRESH_TOKEN', message: '유효하지 않은 리프레시 토큰입니다.' }
                    });
                }
                
                const userEmail = tokenRecord.rows[0].user_id;
                
                // 새로운 Access Token 생성
                const newAccessToken = app.jwt.sign({
                    id: crypto.randomUUID(),
                    email: userEmail,
                    role: 'CUSTOMER', // 임시
                    name: 'User', // 임시
                    type: 'access'
                });
                
                return {
                    success: true,
                    message: '토큰 갱신 성공',
                    data: {
                        accessToken: newAccessToken,
                        expiresIn: 24 * 60 * 60 // 24시간
                    }
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(401).send({
                    success: false,
                    error: { code: 'REFRESH_FAILED', message: '토큰 갱신에 실패했습니다.' }
                });
            }
        });

        // 로그아웃 API (토큰 무효화)
        app.post('/api/v1/auth/logout', { preHandler: app.authenticate }, async (request, reply) => {
            try {
                const authHeader = request.headers.authorization;
                const token = authHeader?.replace('Bearer ', '');
                
                if (token) {
                    // Access Token을 블랙리스트에 추가
                    const tokenId = crypto.randomUUID();
                    const decodedToken = app.jwt.decode(token);
                    const expiresAt = new Date(decodedToken.exp * 1000); // JWT exp는 Unix timestamp
                    
                    await pool.query(
                        'INSERT INTO token_blacklist (id, token, user_id, reason, expires_at) VALUES ($1, $2, $3, $4, $5)',
                        [tokenId, token, request.user.email, 'user_logout', expiresAt]
                    );
                    
                    // 해당 사용자의 리프레시 토큰 무효화
                    await pool.query(
                        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
                        [request.user.email]
                    );
                }
                
                return {
                    success: true,
                    message: '로그아웃 성공'
                };
            } catch (error) {
                request.log.error(error);
                return reply.status(500).send({
                    success: false,
                    error: { code: 'LOGOUT_ERROR', message: '로그아웃 처리 중 오류가 발생했습니다.' }
                });
            }
        });

        // 보호된 라우트 예시
        app.get('/api/v1/auth/profile', { preHandler: app.authenticate }, async (request, reply) => {
            return {
                success: true,
                message: '프로필 조회 성공',
                data: {
                    user: request.user,
                    timestamp: new Date().toISOString()  
                }
            };
        });

        const port = parseInt(process.env.PORT || '4000');
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${port}`);
        console.log('Available endpoints:');
        console.log('  GET /health');
        console.log('  GET /api/v1/status');
        console.log('  GET /api/v1/services/categories');
        console.log('  GET /api/v1/services/items');
        console.log('  POST /api/v1/auth/login');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();