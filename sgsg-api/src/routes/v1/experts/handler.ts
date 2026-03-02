import { FastifyRequest, FastifyReply } from 'fastify'
import { ExpertService } from '../../../services/expert.service'
import { ExpertProfileUpdateRequest } from '../../../types/schemas'
import * as bcrypt from 'bcrypt'

// 에러 코드를 HTTP 상태 코드로 매핑하는 헬퍼 함수
function mapErrorCodeToStatusCode(code: string): number {
  switch (code) {
    case 'EXPERT_001':
    case 'EXPERT_002':
    case 'EXPERT_003':
      return 404
    case 'VALIDATION_001':
    case 'VALIDATION_002':
      return 409
    case 'AUTH_001':
    case 'AUTH_003':
    case 'AUTH_004':
      return 401
    default:
      return 500
  }
}

// 성공 응답 헬퍼 함수
function formatSuccessResponse(data: any) {
  return {
    success: true,
    message: 'Operation successful',
    data
  }
}

// 에러 응답 헬퍼 함수
function formatErrorResponse(error: any) {
  return {
    success: false,
    message: error.message,
    error: error.code
  }
}

// 전문가 프로필 조회 핸들러
export async function getExpertProfileHandler(
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

// 서비스 매핑 조회 핸들러
export async function getServiceMappingsHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
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
    const { page = 1, limit = 20 } = request.query
    const result = await expertService.getServiceMappings(expert.id, { page, limit })
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get service mappings')
    reply.code(500).send({
      success: false,
      message: 'Failed to get service mappings',
      error: 'EXPERT_SERVICE_003'
    })
  }
}

// 서비스 매핑 생성 핸들러
export async function createServiceMappingHandler(
  request: FastifyRequest<{ Body: { serviceItemId: string; customPrice?: number; isAvailable?: boolean } }>,
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
    const result = await expertService.createServiceMapping(expert.id, request.body)
    
    return reply.status(201).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서비스 매핑 업데이트 핸들러
export async function updateServiceMappingHandler(
  request: FastifyRequest<{ Params: { mappingId: string }; Body: { customPrice?: number; isAvailable?: boolean } }>,
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

    const { mappingId } = request.params
    const { customPrice, isAvailable } = request.body

    // 해당 매핑이 전문가의 것인지 확인
    const existingMapping = await request.server.prisma.expertServiceMapping.findFirst({
      where: {
        id: mappingId,
        expertId: expert.id
      }
    })

    if (!existingMapping) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_002',
        message: '해당 서비스 매핑을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    const result = await expertService.updateServiceMapping(mappingId, { customPrice, isAvailable })
    
    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서비스 매핑 삭제 핸들러
export async function deleteServiceMappingHandler(
  request: FastifyRequest<{ Params: { mappingId: string } }>,
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

    const { mappingId } = request.params

    // 해당 매핑이 전문가의 것인지 확인
    const existingMapping = await request.server.prisma.expertServiceMapping.findFirst({
      where: {
        id: mappingId,
        expertId: expert.id
      }
    })

    if (!existingMapping) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_002',
        message: '해당 서비스 매핑을 찾을 수 없습니다.'
      }))
    }

    const expertService = new ExpertService(request.server)
    await expertService.deleteServiceMapping(mappingId)
    
    return reply.status(200).send(formatSuccessResponse({ message: '서비스 매핑이 삭제되었습니다.' }))
  } catch (error: any) {
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서브 계정 목록 조회 핸들러
export async function getSubAccountsHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>,
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

    const { page = 1, limit = 20, status } = request.query
    const skip = (page - 1) * limit

    // 조건 생성
    const where: any = { masterAccountId: expert.id }
    if (status) {
      where.activeStatus = status
    }

    const [subAccounts, total] = await Promise.all([
      request.server.prisma.subAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      request.server.prisma.subAccount.count({ where })
    ])

    const result = {
      data: subAccounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get sub accounts')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_007',
      message: '서브 계정 목록 조회에 실패했습니다.'
    }))
  }
}

// 서브 계정 생성 핸들러
export async function createSubAccountHandler(
  request: FastifyRequest<{ Body: { name: string; email: string; phone: string; password: string; permissions?: string[]; assignedWorkerId?: string } }>,
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

    const { name, email, phone, password, permissions = [], assignedWorkerId } = request.body

    // 이메일과 전화번호 중복 확인
    const existingUser = await request.server.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return reply.status(409).send(formatErrorResponse({
        code: 'EXPERT_008',
        message: '이미 사용 중인 이메일 또는 전화번호입니다.'
      }))
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 10)

    // 트랜잭션으로 사용자 생성 및 서브 계정 생성
    const result = await request.server.prisma.$transaction(async (tx) => {
      // 사용자 생성
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: 'expert',
          status: 'active',
          emailVerified: true,
          phoneVerified: true
        }
      })

      // 서브 계정 생성
      const subAccount = await tx.subAccount.create({
        data: {
          masterAccountId: expert.id,
          userId: user.id,
          accountType: 'SUB',
          approvalStatus: 'APPROVED',
          activeStatus: 'ACTIVE',
          permissions,
          assignedWorkerId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      return subAccount
    })

    return reply.status(201).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to create sub account')
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 서브 계정 업데이트 핸들러
export async function updateSubAccountHandler(
  request: FastifyRequest<{ Params: { subAccountId: string }; Body: { activeStatus?: string; permissions?: string[]; assignedWorkerId?: string } }>,
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

    const { subAccountId } = request.params
    const { activeStatus, permissions, assignedWorkerId } = request.body

    // 서브 계정이 해당 마스터 계정의 것인지 확인
    const subAccount = await request.server.prisma.subAccount.findFirst({
      where: {
        id: subAccountId,
        masterAccountId: expert.id
      }
    })

    if (!subAccount) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_009',
        message: '해당 서브 계정을 찾을 수 없습니다.'
      }))
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (activeStatus) updateData.activeStatus = activeStatus
    if (permissions) updateData.permissions = permissions
    if (assignedWorkerId !== undefined) updateData.assignedWorkerId = assignedWorkerId

    const updatedSubAccount = await request.server.prisma.subAccount.update({
      where: { id: subAccountId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    return reply.status(200).send(formatSuccessResponse(updatedSubAccount))
  } catch (error: any) {
    request.log.error(error, 'Failed to update sub account')
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

    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
      select: {
        id: true,
        membershipEnabled: true,
        membershipSlotCount: true,
        serviceCategoryMidAvailableList: true,
        regionGroups: true
      }
    })

    if (!expert) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }))
    }

    // 마스터 멤버십 정보 조회
    const masterMembership = await request.server.prisma.masterMembership.findUnique({
      where: { masterAccountId: expert.id }
    })

    // 현재 서브 계정 수 조회
    const currentSubAccountCount = await request.server.prisma.subAccount.count({
      where: {
        masterAccountId: expert.id,
        activeStatus: 'ACTIVE'
      }
    })

    // 다음 결제일 (마스터 멤버십이 있는 경우)
    const nextBillingDate = masterMembership?.endDate || null

    const membershipInfo = {
      membershipEnabled: expert.membershipEnabled,
      membershipSlotCount: masterMembership?.membershipSlotCount || expert.membershipSlotCount,
      serviceCategoryMidAvailableList: expert.serviceCategoryMidAvailableList,
      usedSlots: currentSubAccountCount,
      availableSlots: masterMembership ? Math.max(0, masterMembership.membershipSlotCount - currentSubAccountCount) : 0,
      masterMemberships: masterMembership ? [masterMembership] : []
    }

    return reply.status(200).send(formatSuccessResponse(membershipInfo))
  } catch (error: any) {
    request.log.error(error, 'Failed to get membership info')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_010',
      message: '멤버십 정보 조회에 실패했습니다.'
    }))
  }
}

// 배정 이력 조회 핸들러
export async function getAssignmentHistoryHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; startDate?: string; endDate?: string; assignmentType?: string; status?: string } }>,
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

    const { page = 1, limit = 20, startDate, endDate, assignmentType, status } = request.query
    const skip = (page - 1) * limit

    // 조건 생성
    const where: any = { assignedMasterId: expert.id }
    if (startDate && endDate) {
      where.assignedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    if (assignmentType) {
      where.assignmentType = assignmentType
    }
    if (status) {
      where.assignmentResultStatus = status
    }

    const [assignments, total] = await Promise.all([
      request.server.prisma.assignmentHistory.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              serviceItem: {
                select: {
                  name: true
                }
              },
              customer: {
                select: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          assignedWorker: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          assignedAt: 'desc'
        }
      }),
      request.server.prisma.assignmentHistory.count({ where })
    ])

    const result = {
      histories: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get assignment history')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_011',
      message: '배정 이력 조회에 실패했습니다.'
    }))
  }
}

// 패널티 이력 조회 핸들러
export async function getPenaltyHistoryHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string; penaltyType?: string } }>,
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

    const { page = 1, limit = 20, status, penaltyType } = request.query
    const skip = (page - 1) * limit

    // 조건 생성
    const where: any = { masterAccountId: expert.id }
    if (status) {
      where.penaltyStatus = status
    }
    if (penaltyType) {
      where.penaltyType = penaltyType
    }

    const [penalties, total, activePenalties] = await Promise.all([
      request.server.prisma.penaltyHistory.findMany({
        where,
        include: {
          appliedByAdmin: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      request.server.prisma.penaltyHistory.count({ where }),
      request.server.prisma.penaltyHistory.count({
        where: {
          masterAccountId: expert.id,
          penaltyStatus: 'ACTIVE',
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ]
        }
      })
    ])

    const result = {
      penalties,
      activePenaltiesCount: activePenalties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get penalty history')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_012',
      message: '패널티 이력 조회에 실패했습니다.'
    }))
  }
}

export async function getExpertOrdersHandler(request: any, reply: any) {
  reply.code(501).send({ success: false, message: 'Not implemented yet' })
}

export async function getSettlementsHandler(request: any, reply: any) {
  reply.code(501).send({ success: false, message: 'Not implemented yet' })
}

// 스케줄 조회 핸들러
export async function getScheduleHandler(
  request: FastifyRequest<{ Querystring: { page?: number; limit?: number; date?: string; status?: string } }>,
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

    const { page = 1, limit = 20, date, status } = request.query
    const skip = (page - 1) * limit

    // 조건 생성
    const where: any = { expertId: expert.id }
    if (date) {
      const targetDate = new Date(date)
      const nextDate = new Date(targetDate)
      nextDate.setDate(targetDate.getDate() + 1)
      where.scheduledDate = {
        gte: targetDate,
        lt: nextDate
      }
    }
    if (status) {
      where.status = status
    }

    const [schedules, total] = await Promise.all([
      request.server.prisma.serviceSchedule.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              serviceItem: {
                select: {
                  name: true
                }
              },
              customer: {
                select: {
                  user: {
                    select: {
                      name: true,
                      phone: true
                    }
                  }
                }
              },
              address: {
                select: {
                  addressLine1: true,
                  addressLine2: true,
                  city: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          scheduledDate: 'asc'
        }
      }),
      request.server.prisma.serviceSchedule.count({ where })
    ])

    const result = {
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get schedules')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_003',
      message: '스케줄 조회에 실패했습니다.'
    }))
  }
}

// 스케줄 생성 핸들러
export async function createScheduleHandler(
  request: FastifyRequest<{ Body: { orderId: string; scheduledDate: string; startTime: string; endTime: string; notes?: string } }>,
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

    const { orderId, scheduledDate, startTime, endTime, notes } = request.body

    // 주문이 해당 전문가에게 배정되어 있는지 확인
    const order = await request.server.prisma.order.findFirst({
      where: {
        id: orderId,
        expertId: expert.id,
        status: { in: ['new', 'schedule_pending'] }
      }
    })

    if (!order) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_004',
        message: '해당 주문을 찾을 수 없거나 스케줄링할 수 없는 상태입니다.'
      }))
    }

    // 이미 스케줄이 존재하는지 확인
    const existingSchedule = await request.server.prisma.serviceSchedule.findUnique({
      where: { orderId }
    })

    if (existingSchedule) {
      return reply.status(409).send(formatErrorResponse({
        code: 'EXPERT_005',
        message: '이미 스케줄이 등록된 주문입니다.'
      }))
    }

    // 트랜잭션으로 스케줄 생성 및 주문 상태 변경
    const result = await request.server.prisma.$transaction(async (tx) => {
      // 스케줄 생성
      const schedule = await tx.serviceSchedule.create({
        data: {
          orderId,
          expertId: expert.id,
          scheduledDate: new Date(scheduledDate),
          startTime,
          endTime,
          notes,
          status: 'scheduled'
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              serviceItem: { select: { name: true } }
            }
          }
        }
      })

      // 주문 상태 업데이트
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'schedule_confirmed',
          confirmedDate: new Date()
        }
      })

      return schedule
    })

    return reply.status(201).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to create schedule')
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 스케줄 업데이트 핸들러
export async function updateScheduleHandler(
  request: FastifyRequest<{ Params: { scheduleId: string }; Body: { scheduledDate?: string; startTime?: string; endTime?: string; notes?: string; status?: string } }>,
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

    const { scheduleId } = request.params
    const { scheduledDate, startTime, endTime, notes, status } = request.body

    // 스케줄이 해당 전문가의 것인지 확인
    const schedule = await request.server.prisma.serviceSchedule.findFirst({
      where: {
        id: scheduleId,
        expertId: expert.id
      }
    })

    if (!schedule) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_004',
        message: '해당 스케줄을 찾을 수 없습니다.'
      }))
    }

    // 업데이트할 데이터 준비
    const updateData: any = {}
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate)
    if (startTime) updateData.startTime = startTime
    if (endTime) updateData.endTime = endTime
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.status = status

    const updatedSchedule = await request.server.prisma.serviceSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        order: {
          select: {
            orderNumber: true,
            serviceItem: { select: { name: true } }
          }
        }
      }
    })

    return reply.status(200).send(formatSuccessResponse(updatedSchedule))
  } catch (error: any) {
    request.log.error(error, 'Failed to update schedule')
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

// 스케줄 삭제 핸들러
export async function deleteScheduleHandler(
  request: FastifyRequest<{ Params: { scheduleId: string } }>,
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

    const { scheduleId } = request.params

    // 스케줄이 해당 전문가의 것인지 확인
    const schedule = await request.server.prisma.serviceSchedule.findFirst({
      where: {
        id: scheduleId,
        expertId: expert.id
      },
      include: {
        order: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    if (!schedule) {
      return reply.status(404).send(formatErrorResponse({
        code: 'EXPERT_004',
        message: '해당 스케줄을 찾을 수 없습니다.'
      }))
    }

    // 진행 중이거나 완료된 스케줄은 삭제할 수 없음
    if (schedule.status === 'in_progress' || schedule.status === 'completed') {
      return reply.status(400).send(formatErrorResponse({
        code: 'EXPERT_006',
        message: '진행 중이거나 완료된 스케줄은 삭제할 수 없습니다.'
      }))
    }

    // 트랜잭션으로 스케줄 삭제 및 주문 상태 변경
    await request.server.prisma.$transaction(async (tx) => {
      // 스케줄 삭제
      await tx.serviceSchedule.delete({
        where: { id: scheduleId }
      })

      // 주문 상태를 다시 schedule_pending으로 변경
      await tx.order.update({
        where: { id: schedule.orderId },
        data: {
          status: 'schedule_pending',
          confirmedDate: null
        }
      })
    })

    return reply.status(200).send(formatSuccessResponse({
      message: '스케줄이 성공적으로 삭제되었습니다.'
    }))
  } catch (error: any) {
    request.log.error(error, 'Failed to delete schedule')
    const statusCode = mapErrorCodeToStatusCode(error.code)
    return reply.status(statusCode).send(formatErrorResponse(error))
  }
}

export async function getStatisticsHandler(request: any, reply: any) {
  try {
    const userId = request.jwtPayload?.userId;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        message: '인증이 필요합니다.',
        code: 'AUTH_001'
      });
    }

    const expert = await request.server.prisma.expert.findFirst({
      where: { userId },
    });

    if (!expert) {
      return reply.status(404).send({
        success: false,
        message: '전문가 프로필을 찾을 수 없습니다.',
        code: 'EXPERT_001'
      });
    }

    // 이번 달 시작과 끝 날짜
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [thisMonthOrders, pendingOrders, totalReviews] = await Promise.all([
      // 이번 달 주문 수
      request.server.prisma.order.count({
        where: {
          expertId: expert.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // 대기 중인 주문 수
      request.server.prisma.order.count({
        where: {
          expertId: expert.id,
          status: {
            in: ['new', 'schedule_pending', 'schedule_confirmed'],
          },
        },
      }),
      // 총 리뷰 수
      request.server.prisma.review.count({
        where: { expertId: expert.id },
      }),
    ]);

    const statistics = {
      totalOrders: expert.totalCompletedOrders,
      completedOrders: expert.totalCompletedOrders,
      totalEarnings: expert.totalEarnings,
      averageRating: expert.rating || 0,
      totalReviews,
      thisMonthOrders,
      thisMonthEarnings: 0, // TODO: 실제 이번 달 수익 계산
      pendingOrders,
    };

    return reply.status(200).send({
      success: true,
      message: '통계 정보 조회 성공',
      data: statistics
    });
  } catch (error: any) {
    request.log.error(error, 'Failed to get statistics');
    return reply.status(500).send({
      success: false,
      message: '통계 정보 조회 실패',
      code: 'EXPERT_STAT_001'
    });
  }
}

// 일일 배정 상한 조회 핸들러
export async function getDailyAssignmentLimitHandler(
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

    // 현재 활성화된 배정 정책 조회
    const assignmentPolicy = await request.server.prisma.masterAssignmentPolicy.findFirst({
      where: {
        masterAccountId: expert.id,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // 오늘 배정받은 개수 조회
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(startOfDay.getDate() + 1)

    const todayAssignmentCount = await request.server.prisma.assignmentHistory.count({
      where: {
        assignedMasterId: expert.id,
        assignedAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    const dailyLimit = assignmentPolicy?.dailyAssignmentLimit || 0
    const remainingLimit = Math.max(0, dailyLimit - todayAssignmentCount)

    const result = {
      dailyAssignmentLimit: dailyLimit,
      todayAssignmentCount,
      remainingLimit,
      isLimitReached: todayAssignmentCount >= dailyLimit,
      policy: assignmentPolicy ? {
        id: assignmentPolicy.id,
        effectiveFrom: assignmentPolicy.effectiveFrom,
        effectiveTo: assignmentPolicy.effectiveTo,
        isActive: assignmentPolicy.isActive
      } : null
    }

    return reply.status(200).send(formatSuccessResponse(result))
  } catch (error: any) {
    request.log.error(error, 'Failed to get daily assignment limit')
    reply.code(500).send(formatErrorResponse({
      code: 'EXPERT_013',
      message: '일일 배정 상한 조회에 실패했습니다.'
    }))
  }
}