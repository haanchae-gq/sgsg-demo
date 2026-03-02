import fp from 'fastify-plugin'
import fjwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload } from '../types/schemas'

// AuthUser type represents the user object attached to requests
type AuthUser = JwtPayload & {
  admin?: { id: string };
  customer?: { id: string };
  expert?: { id: string };
  id?: string;
  adminId?: string;
  customerId?: string;
  expertId?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload?: JwtPayload & { type?: string }
    user: AuthUser | undefined
  }
  interface FastifyInstance {
    optionalAuthenticate: (request: any, reply: any) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: AuthUser | undefined
  }
}

export default fp(async (fastify, options) => {
  // JWT 플러그인 등록 (이미 등록되지 않은 경우에만)
  if (!fastify.hasDecorator('jwt')) {
    await fastify.register(fjwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      sign: {
        expiresIn: '7d', // 액세스 토큰 만료 시간
      },
      verify: {
        maxAge: '7d',
      },
    })
  }

  // JWT 페이로드를 요청에 추가하는 데코레이터 (존재하지 않을 때만)
  if (!fastify.hasRequestDecorator('jwtPayload')) {
    fastify.decorateRequest('jwtPayload', null as any)
  }

  // 인증 미들웨어 (토큰 검증)
  if (!fastify.hasDecorator('authenticate')) {
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      let token: string | undefined
      // 1. Authorization 헤더에서 토큰 추출 (Bearer 토큰)
      const authHeader = request.headers.authorization
      console.log('AUTH: authorization header:', authHeader)
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '')
      }
      // 2. 쿼리 파라미터에서 토큰 추출 (WebSocket 연결용)
      if (!token && request.query && typeof request.query === 'object' && 'token' in request.query) {
        token = request.query.token as string
        console.log('AUTH: token from query parameter')
      }
      // 3. 쿠키에서 토큰 추출 (선택사항, 필요시 구현)
      
      console.log('AUTH: token extracted:', token ? `${token.substring(0, 20)}...` : 'empty')
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'AUTH_001',
            message: '인증 토큰이 필요합니다.',
          },
        })
      }

      const decoded = await request.server.jwt.verify<FastifyJWT['payload']>(token)
      console.log('AUTH: decoded userId:', decoded.userId)
      // Build user object with optional role-specific IDs
      const userObj: any = { ...decoded, id: decoded.userId }
      // Add nested objects if role-specific IDs exist
      if (decoded.adminId) {
        userObj.admin = { id: decoded.adminId }
        userObj.adminId = decoded.adminId
      }
      if (decoded.customerId) {
        userObj.customer = { id: decoded.customerId }
        userObj.customerId = decoded.customerId
      }
      if (decoded.expertId) {
        userObj.expert = { id: decoded.expertId }
        userObj.expertId = decoded.expertId
      }
      request.user = userObj
      request.jwtPayload = decoded as JwtPayload
      console.log('AUTH: jwtPayload set:', request.jwtPayload)
    } catch (err) {
      console.log('AUTH: jwtVerify error:', err)
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTH_002',
          message: '유효하지 않거나 만료된 토큰입니다.',
        },
      })
    }
    })
  }

  // 역할 기반 접근 제어 (RBAC) 미들웨어
  if (!fastify.hasDecorator('authorize')) {
    fastify.decorate('authorize', (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.jwtPayload
      if (!payload) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'AUTH_003',
            message: '인증 정보가 없습니다.',
          },
        })
      }

      if (!roles.includes(payload.role)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN_001',
            message: '이 작업을 수행할 권한이 없습니다.',
          },
        })
      }

      // 서브 계정 검증 (전문가 역할인 경우)
      if (payload.role === 'expert') {
        // 마스터 계정 ID 확인 (서브 계정인 경우)
        if (payload.isSubAccount && !payload.masterAccountId) {
          return reply.status(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN_002',
              message: '서브 계정은 마스터 계정이 필요합니다.',
            },
          })
        }
      }
    }
    })
  }

  // 선택적 인증 미들웨어 (토큰이 없어도 계속 진행)
  if (!fastify.hasDecorator('optionalAuthenticate')) {
    fastify.decorate('optionalAuthenticate', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        let token: string | undefined
        // 1. Authorization 헤더에서 토큰 추출 (Bearer 토큰)
        const authHeader = request.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '')
        }
        // 2. 쿼리 파라미터에서 토큰 추출 (WebSocket 연결용)
        if (!token && request.query && typeof request.query === 'object' && 'token' in request.query) {
          token = request.query.token as string
        }
        
        // 토큰이 없어도 에러 발생시키지 않음
        if (!token) {
          return; // 인증 정보 없이 계속 진행
        }

        const decoded = await request.server.jwt.verify<FastifyJWT['payload']>(token)
        // Build user object with optional role-specific IDs
        const userObj: any = { ...decoded, id: decoded.userId }
        // Add nested objects if role-specific IDs exist
        if (decoded.adminId) {
          userObj.admin = { id: decoded.adminId }
          userObj.adminId = decoded.adminId
        }
        if (decoded.customerId) {
          userObj.customer = { id: decoded.customerId }
          userObj.customerId = decoded.customerId
        }
        if (decoded.expertId) {
          userObj.expert = { id: decoded.expertId }
          userObj.expertId = decoded.expertId
        }
        request.user = userObj
        request.jwtPayload = decoded as JwtPayload
      } catch (err) {
        // 토큰 검증 실패해도 에러 발생시키지 않음
        console.log('Optional AUTH: token verification failed:', err)
        return; // 인증 정보 없이 계속 진행
      }
    })
  }
}, {
  name: 'auth-plugin',
  dependencies: []
})

