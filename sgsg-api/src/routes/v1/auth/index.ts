import { FastifyInstance } from 'fastify'
import * as handler from './handler'
import * as schema from './schema'

export default async function authRoutes(fastify: FastifyInstance) {
  // 회원가입
  fastify.post('/register', {
    schema: schema.RegisterSchema,
    handler: handler.registerHandler
  })

  // 로그인
  fastify.post('/login', {
    schema: schema.LoginSchema,
    handler: handler.loginHandler
  })

  // 토큰 갱신
  fastify.post('/refresh', {
    schema: schema.RefreshTokenSchema,
    handler: handler.refreshTokenHandler
  })

  // 비밀번호 재설정 요청
  fastify.post('/forgot-password', {
    schema: schema.ForgotPasswordSchema,
    handler: handler.forgotPasswordHandler
  })

  // 비밀번호 재설정 확인
  fastify.post('/reset-password', {
    schema: schema.ResetPasswordSchema,
    handler: handler.resetPasswordHandler
  })

  // 이메일 인증
  fastify.post('/verify-email', {
    schema: schema.VerifyEmailSchema,
    handler: handler.verifyEmailHandler
  })

  // 휴대폰 인증
  fastify.post('/verify-phone', {
    schema: schema.VerifyPhoneSchema,
    handler: handler.verifyPhoneHandler
  })

  // 로그아웃 (인증 필요)
  fastify.post('/logout', {
    schema: schema.LogoutSchema,
    preHandler: fastify.authenticate,
    handler: handler.logoutHandler
  })
}