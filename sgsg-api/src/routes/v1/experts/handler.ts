import { FastifyRequest, FastifyReply } from 'fastify'
import { ExpertService } from '../../../services/expert.service'
import {
  ExpertProfileUpdateRequest,
  SubAccountCreateRequest,
  SubAccountUpdateRequest
} from '../../../types/schemas'

// 에러 코드를 HTTP 상태 코드로 매핑하는 헬퍼 함수
function mapErrorCodeToStatusCode(code: string): number {
  switch (code) {
    case 'EXPERT_001':
    case 'EXPERT_002':
    case 'EXPERT_003':
      return 404 // Not Found
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

// 전문가 프로필 조회 핸들러
export async function getExpertProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    console.log('HANDLER: jwtPayload:', request.jwtPayload)
    console.log('HANDLER: user:', request.user)
    const userId = request.jwtPayload?.userId
    console.log('HANDLER: userId:', userId)
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.getExpertProfile(userId)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 전문가 프로필 업데이트 핸들러
export async function updateExpertProfileHandler(
  request: FastifyRequest<{ Body: ExpertProfileUpdateRequest }>,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.updateExpertProfile(userId, request.body)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서브 계정 목록 조회 핸들러
export async function getSubAccountsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.getSubAccounts(expert.id)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서브 계정 생성 핸들러
export async function createSubAccountHandler(
  request: FastifyRequest<{ Body: SubAccountCreateRequest }>,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.createSubAccount(expert.id, request.body)
    
    console.log('HANDLER: createSubAccount result:', result)
    const response = formatSuccessResponse(result)
    console.log('HANDLER: formatted response:', response)
    
    return reply.status(201).send(response)
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서브 계정 업데이트 핸들러
export async function updateSubAccountHandler(
  request: FastifyRequest<{ 
    Params: { subAccountId: string },
    Body: SubAccountUpdateRequest 
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    const subAccountId = request.params.subAccountId
    
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.updateSubAccount(subAccountId, expert.id, request.body)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 멤버십 정보 조회 핸들러
export async function getMembershipInfoHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.getMembershipInfo(expert.id)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 배정 이력 조회 핸들러
export async function getAssignmentHistoryHandler(
  request: FastifyRequest<{ 
    Querystring: { page?: number; limit?: number } 
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    const page = request.query.page || 1
    const limit = request.query.limit || 20
    
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.getAssignmentHistory(expert.id, page, limit)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 패널티 이력 조회 핸들러
export async function getPenaltyHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.jwtPayload?.userId
    if (!userId) {
      return reply.status(401).send(formatErrorResponse({
        code: 'AUTH_001',
        message: '인증이 필요합니다.'
      }))
    }

    // 사용자 ID로 전문가 ID 조회
    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.getPenaltyHistory(expert.id)
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}