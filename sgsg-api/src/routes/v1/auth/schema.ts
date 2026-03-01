import { Type } from '@sinclair/typebox'
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  RefreshTokenRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  UserSchema
} from '../../../types/schemas'

// 회원가입 요청 스키마
export const RegisterSchema = {
  body: RegisterRequestSchema,
  response: {
    201: SuccessResponseSchema(AuthResponseSchema),
    400: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 로그인 요청 스키마
export const LoginSchema = {
  body: LoginRequestSchema,
  response: {
    200: SuccessResponseSchema(AuthResponseSchema),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 토큰 갱신 요청 스키마
export const RefreshTokenSchema = {
  body: RefreshTokenRequestSchema,
  response: {
    200: SuccessResponseSchema(Type.Object({
      accessToken: Type.String(),
      refreshToken: Type.String()
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 비밀번호 재설정 요청 스키마
export const ForgotPasswordSchema = {
  body: ForgotPasswordRequestSchema,
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 비밀번호 재설정 확인 스키마
export const ResetPasswordSchema = {
  body: ResetPasswordRequestSchema,
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    400: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 로그아웃 스키마 (토큰 무효화)
export const LogoutSchema = {
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 이메일 인증 확인 스키마
export const VerifyEmailSchema = {
  body: Type.Object({
    token: Type.String()
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    400: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 휴대폰 인증 확인 스키마
export const VerifyPhoneSchema = {
  body: Type.Object({
    phone: Type.String({ pattern: '^01[0-9]{8,9}$' }),
    code: Type.String({ pattern: '^[0-9]{6}$' })
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    400: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}