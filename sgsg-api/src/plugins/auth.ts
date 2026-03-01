import fp from 'fastify-plugin'
import fjwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'
import { JwtPayload } from '../types/schemas'

declare module 'fastify' {
  interface FastifyRequest {
    jwtPayload?: JwtPayload & { type?: string }
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
  }
}

export default fp(async (fastify, options) => {
  // JWT 플러그인 등록
  await fastify.register(fjwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    sign: {
      expiresIn: '7d', // 액세스 토큰 만료 시간
    },
    verify: {
      maxAge: '7d',
    },
  })

  // JWT 페이로드를 요청에 추가하는 데코레이터
  fastify.decorateRequest('jwtPayload', null as any)

  // 인증 미들웨어 (토큰 검증)
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization
      console.log('AUTH: authorization header:', authHeader)
      const token = authHeader?.replace('Bearer ', '')
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

      const decoded = await request.jwtVerify<FastifyJWT['payload']>()
      console.log('AUTH: decoded userId:', decoded.userId)
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

  // 역할 기반 접근 제어 (RBAC) 미들웨어
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
}, {
  name: 'auth-plugin',
  dependencies: []
})

