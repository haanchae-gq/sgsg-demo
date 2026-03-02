import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../../../services/user.service'
import { AppError } from '../../../types/errors.js'

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
    case 'NOT_FOUND':
      return 404 // Not Found
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

// 현재 사용자 프로필 조회 핸들러
export async function getProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    console.log('getProfileHandler called with userId:', request.user.userId)
    const userService = new UserService(request.server)
    const result = await userService.getProfile(request.user.userId)
    console.log('getProfileHandler result:', result)
    
    const response = formatSuccessResponse(result)
    console.log('getProfileHandler response:', response)
    return reply.status(200).send(response)
  } catch (error: any) {
    console.log('getProfileHandler caught error:', error)
    console.log('Error code:', error.code)
    console.log('Error message:', error.message)
    const statusCode = mapErrorCodeToStatusCode(error.code)
    console.log('Mapped status code:', statusCode)
    const formattedError = formatErrorResponse(error)
    console.log('Formatted error:', formattedError)
    return reply.status(statusCode).send(formattedError)
  }
}

// 현재 사용자 프로필 수정 핸들러
export async function updateProfileHandler(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.updateProfile(request.user.userId, request.body)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 사용자 주소록 조회 핸들러
export async function getAddressesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.getAddresses(request.user.userId)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 주소 추가 핸들러
export async function addAddressHandler(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.addAddress(request.user.userId, request.body)
    
    return reply.status(201).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 주소 수정 핸들러
export async function updateAddressHandler(
  request: FastifyRequest<{ Params: { addressId: string }; Body: any }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.updateAddress(
      request.user.userId,
      request.params.addressId,
      request.body
    )
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 주소 삭제 핸들러
export async function deleteAddressHandler(
  request: FastifyRequest<{ Params: { addressId: string } }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.deleteAddress(
      request.user.userId,
      request.params.addressId
    )
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 알림 목록 조회 핸들러
export async function getNotificationsHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.getNotifications(
      request.user.userId,
      request.query.page,
      request.query.limit
    )
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 알림 읽음 표시 핸들러
export async function markNotificationAsReadHandler(
  request: FastifyRequest<{ Params: { notificationId: string } }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new AppError('AUTH_001', '인증이 필요합니다.', 401)
    }
    const userService = new UserService(request.server)
    const result = await userService.markNotificationAsRead(
      request.user.userId,
      request.params.notificationId
    )
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}