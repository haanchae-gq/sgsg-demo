import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../../../services/auth.service'
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../../../types/schemas'

// 에러 코드를 HTTP 상태 코드로 매핑하는 헬퍼 함수
function mapErrorCodeToStatusCode(code: string): number {
  switch (code) {
    case 'VALIDATION_001':
    case 'VALIDATION_002':
      return 409 // Conflict
    case 'AUTH_001':
    case 'AUTH_003':
    case 'AUTH_004':
      return 401 // Unauthorized
    case 'AUTH_002':
      return 403 // Forbidden
    default:
      return 500 // Internal Server Error
  }
}

// 에러 응답 형식화
function formatErrorResponse(error: any) {
  return {
    success: false as const,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || '서버 내부 오류가 발생했습니다.',
      details: error.details || undefined
    }
  }
}

// 성공 응답 형식화
function formatSuccessResponse(data: any, meta?: any) {
  return {
    success: true as const,
    data,
    ...(meta && { meta })
  }
}

// 회원가입 핸들러
export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.register(request.body)
    
    return reply.status(201).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 로그인 핸들러
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.login(request.body)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 토큰 갱신 핸들러
export async function refreshTokenHandler(
  request: FastifyRequest<{ Body: RefreshTokenRequest }>,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.refreshToken(request.body.refreshToken)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 비밀번호 재설정 요청 핸들러
export async function forgotPasswordHandler(
  request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.forgotPassword(request.body.email)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 비밀번호 재설정 확인 핸들러
export async function resetPasswordHandler(
  request: FastifyRequest<{ Body: ResetPasswordRequest }>,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.resetPassword(
      request.body.token,
      request.body.newPassword
    )
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 로그아웃 핸들러
export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authService = new AuthService(request.server)
    const result = await authService.logout()
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 이메일 인증 확인 핸들러 (TODO: 실제 구현 필요)
export async function verifyEmailHandler(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply
) {
  try {
    // TODO: 이메일 인증 토큰 검증 및 사용자 상태 업데이트 구현
    return reply.status(200).send(formatSuccessResponse({
      message: '이메일 인증이 완료되었습니다.'
    }))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 휴대폰 인증 확인 핸들러 (TODO: 실제 구현 필요)
export async function verifyPhoneHandler(
  request: FastifyRequest<{ Body: { phone: string; code: string } }>,
  reply: FastifyReply
) {
  try {
    // TODO: 휴대폰 인증 코드 검증 및 사용자 상태 업데이트 구현
    return reply.status(200).send(formatSuccessResponse({
      message: '휴대폰 인증이 완료되었습니다.'
    }))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}