import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { 
  ExpertProfileUpdateRequest, 
  SubAccountCreateRequest, 
  SubAccountUpdateRequest 
} from '../types/schemas'
import { FastifyInstance } from 'fastify'

export class ExpertService {
  private prisma: PrismaClient
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma
    this.fastify = fastify
    // 디버깅: Prisma 클라이언트 키 확인
    console.log('DEBUG: Prisma client keys:', Object.keys(this.prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')))
    console.log('DEBUG: Prisma has SubAccount?:', 'SubAccount' in (this.prisma as any))
    console.log('DEBUG: Prisma has subAccount?:', 'subAccount' in (this.prisma as any))
  }

  // 전문가 프로필 조회 (자신의 프로필)
  async getExpertProfile(userId: string) {
    const expert = await this.prisma.expert.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            status: true,
            avatarUrl: true,
            emailVerified: true,
            phoneVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true
          }
        },
        businessAddress: true
      }
    })

    if (!expert) {
      throw {
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }
    }

    return {
      ...expert,
      createdAt: expert.createdAt.toISOString(),
      updatedAt: expert.updatedAt.toISOString(),
      user: {
        ...expert.user,
        lastLoginAt: expert.user.lastLoginAt?.toISOString(),
        createdAt: expert.user.createdAt.toISOString(),
        updatedAt: expert.user.updatedAt.toISOString()
      },
      businessAddress: expert.businessAddress ? {
        ...expert.businessAddress,
        createdAt: expert.businessAddress.createdAt.toISOString(),
        updatedAt: expert.businessAddress.updatedAt.toISOString()
      } : null
    }
  }

  // 전문가 프로필 업데이트
  async updateExpertProfile(userId: string, data: ExpertProfileUpdateRequest) {
    const expert = await this.prisma.expert.findFirst({
      where: { userId }
    })

    if (!expert) {
      throw {
        code: 'EXPERT_001',
        message: '전문가 프로필을 찾을 수 없습니다.'
      }
    }

    // 업데이트 가능한 필드만 추출
    const updateData: any = {}
    if (data.businessName !== undefined) updateData.businessName = data.businessName
    if (data.businessType !== undefined) updateData.businessType = data.businessType
    if (data.introduction !== undefined) updateData.introduction = data.introduction
    if (data.certificateUrls !== undefined) updateData.certificateUrls = data.certificateUrls
    if (data.portfolioImages !== undefined) updateData.portfolioImages = data.portfolioImages
    if (data.bankName !== undefined) updateData.bankName = data.bankName
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber
    if (data.accountHolder !== undefined) updateData.accountHolder = data.accountHolder

    const updatedExpert = await this.prisma.expert.update({
      where: { id: expert.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            status: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    return {
      ...updatedExpert,
      createdAt: updatedExpert.createdAt.toISOString(),
      updatedAt: updatedExpert.updatedAt.toISOString(),
      user: {
        ...updatedExpert.user,
        createdAt: updatedExpert.user.createdAt.toISOString(),
        updatedAt: updatedExpert.user.updatedAt.toISOString()
      }
    }
  }

  // 서브 계정 목록 조회
  async getSubAccounts(masterExpertId: string) {
    const subAccounts = await this.prisma.subAccount.findMany({
      where: { masterAccountId: masterExpertId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            status: true,
            avatarUrl: true,
            emailVerified: true,
            phoneVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('DEBUG: getSubAccounts raw result:', subAccounts)

    return subAccounts.map((subAccount: any) => {
      const returnObj = {
        ...subAccount,
        isActive: subAccount.activeStatus === 'ACTIVE',
        createdAt: subAccount.createdAt.toISOString(),
        updatedAt: subAccount.updatedAt.toISOString(),
        // lastActiveAt 필드는 모델에 없으므로 제거
        user: subAccount.user ? {
          id: subAccount.user.id,
          email: subAccount.user.email,
          phone: subAccount.user.phone,
          name: subAccount.user.name,
          role: subAccount.user.role,
          status: subAccount.user.status,
          avatarUrl: subAccount.user.avatarUrl,
          emailVerified: subAccount.user.emailVerified,
          phoneVerified: subAccount.user.phoneVerified,
          lastLoginAt: subAccount.user.lastLoginAt?.toISOString(),
          createdAt: subAccount.user.createdAt.toISOString(),
          updatedAt: subAccount.user.updatedAt.toISOString()
        } : undefined
      }
      console.log('DEBUG: getSubAccounts mapped item:', returnObj)
      return returnObj
    })
  }

  // 서브 계정 생성
  async createSubAccount(masterExpertId: string, data: SubAccountCreateRequest) {
    // 마스터 전문가 확인
    const masterExpert = await this.prisma.expert.findUnique({
      where: { id: masterExpertId }
    })

    if (!masterExpert) {
      throw {
        code: 'EXPERT_002',
        message: '마스터 전문가를 찾을 수 없습니다.'
      }
    }

    // 이메일/휴대폰 중복 확인
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw {
          code: 'VALIDATION_001',
          message: '이미 사용 중인 이메일입니다.'
        }
      }
      if (existingUser.phone === data.phone) {
        throw {
          code: 'VALIDATION_002',
          message: '이미 사용 중인 휴대폰 번호입니다.'
        }
      }
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(data.password, 10)

    // 트랜잭션으로 사용자 및 서브 계정 생성
    const result = await this.prisma.$transaction(async (tx: any) => {
      // 디버깅: tx 객체 키 확인
      console.log('DEBUG: tx keys:', Object.keys(tx))
      console.log('DEBUG: tx.SubAccount?:', (tx as any).SubAccount)
      console.log('DEBUG: tx.subAccount?:', (tx as any).subAccount)
      // 사용자 생성
      const user = await tx.user.create({
        data: {
          email: data.email,
          phone: data.phone,
          passwordHash,
          name: data.name,
          role: 'expert',
          status: 'active' // 서브 계정은 즉시 활성화
        }
      })

      // 서브 계정 생성
      const subAccount = await tx.subAccount.create({
        data: {
          userId: user.id,
          masterAccountId: masterExpertId,
          accountType: 'SUB',
          permissions: data.permissions,
          activeStatus: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              role: true,
              status: true,
              avatarUrl: true,
              emailVerified: true,
              phoneVerified: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })

      return subAccount
    })

    // 디버깅: result 객체 확인
    console.log('DEBUG: createSubAccount result:', result)
    console.log('DEBUG: result.createdAt:', result.createdAt)
    console.log('DEBUG: result.updatedAt:', result.updatedAt)

    const returnObj = {
      ...result,
      isActive: result.activeStatus === 'ACTIVE',
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      user: result.user ? {
        id: result.user.id, // 명시적으로 id 포함
        email: result.user.email,
        phone: result.user.phone,
        name: result.user.name,
        role: result.user.role,
        status: result.user.status,
        avatarUrl: result.user.avatarUrl,
        emailVerified: result.user.emailVerified,
        phoneVerified: result.user.phoneVerified,
        lastLoginAt: result.user.lastLoginAt?.toISOString(),
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString()
      } : undefined
    }
    console.log('DEBUG: createSubAccount returnObj:', returnObj)
    console.log('DEBUG: returnObj.id:', returnObj.id)
    console.log('DEBUG: returnObj.masterAccountId:', returnObj.masterAccountId)
    console.log('DEBUG: returnObj.approvalStatus:', returnObj.approvalStatus)
    console.log('DEBUG: returnObj.activeStatus:', returnObj.activeStatus)
    console.log('DEBUG: returnObj.user.id:', returnObj.user?.id)
    
    return returnObj
  }

  // 서브 계정 업데이트
  async updateSubAccount(subAccountId: string, masterExpertId: string, data: SubAccountUpdateRequest) {
    console.log('DEBUG updateSubAccount: subAccountId=', subAccountId, 'masterExpertId=', masterExpertId);
    // 서브 계정 소유권 확인
    const subAccount = await this.prisma.subAccount.findFirst({
      where: {
        id: subAccountId,
        masterAccountId: masterExpertId
      }
    })

    if (!subAccount) {
      throw {
        code: 'EXPERT_003',
        message: '서브 계정을 찾을 수 없거나 권한이 없습니다.'
      }
    }

    const updateData: any = {}
    if (data.permissions !== undefined) updateData.permissions = data.permissions
    if (data.isActive !== undefined) updateData.activeStatus = data.isActive ? 'ACTIVE' : 'INACTIVE'

    const updatedSubAccount = await this.prisma.subAccount.update({
      where: { id: subAccountId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            role: true,
            status: true,
            avatarUrl: true,
            emailVerified: true,
            phoneVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    const result = {
      ...updatedSubAccount,
      isActive: updatedSubAccount.activeStatus === 'ACTIVE',
      createdAt: updatedSubAccount.createdAt.toISOString(),
      updatedAt: updatedSubAccount.updatedAt.toISOString(),
      user: {
        ...updatedSubAccount.user,
        lastLoginAt: updatedSubAccount.user.lastLoginAt?.toISOString(),
        createdAt: updatedSubAccount.user.createdAt.toISOString(),
        updatedAt: updatedSubAccount.user.updatedAt.toISOString()
      }
    }
    console.log('DEBUG updateSubAccount result:', JSON.stringify(result, null, 2))
    return result
  }

  // 멤버십 정보 조회
  async getMembershipInfo(expertId: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        membershipEnabled: true,
        membershipSlotCount: true,
        serviceCategoryMidAvailableList: true,
        masterMemberships: true
      }
    })

    if (!expert) {
      throw {
        code: 'EXPERT_001',
        message: '전문가를 찾을 수 없습니다.'
      }
    }

    return {
      membershipEnabled: expert.membershipEnabled,
      membershipSlotCount: expert.membershipSlotCount,
      serviceCategoryMidAvailableList: expert.serviceCategoryMidAvailableList,
      usedSlots: (expert as any).masterMemberships.length,
      availableSlots: Math.max(0, expert.membershipSlotCount - (expert as any).masterMemberships.length),
      masterMemberships: (expert as any).masterMemberships.map((membership: any) => ({
        ...membership,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
        startDate: membership.startDate.toISOString(),
        endDate: membership.endDate?.toISOString()
      }))
    }
  }

  // 배정 이력 조회
  async getAssignmentHistory(expertId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit
      console.log('DEBUG getAssignmentHistory: expertId=', expertId, 'page=', page, 'limit=', limit)

      const [histories, total] = await Promise.all([
        this.prisma.assignmentHistory.findMany({
          where: { assignedMasterId: expertId },
          include: {
            order: {
              select: {
                orderNumber: true,
                customer: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.assignmentHistory.count({
          where: { assignedMasterId: expertId }
        })
      ])
      console.log('DEBUG getAssignmentHistory: histories count=', histories.length)

      return {
        histories: histories.map((history: any) => ({
          ...history,
          createdAt: history.createdAt.toISOString(),
          updatedAt: history.updatedAt.toISOString(),
          assignedAt: history.assignedAt.toISOString(),
          respondedAt: history.respondedAt?.toISOString(),
          order: history.order ? {
            orderNumber: history.order.orderNumber,
            customer: {
              name: history.order.customer.user.name,
              phone: history.order.customer.user.phone
            }
          } : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error: any) {
      console.error('ERROR in getAssignmentHistory:', error)
      throw {
        code: 'EXPERT_004',
        message: '배정 이력 조회 중 오류가 발생했습니다.',
        details: error.message
      }
    }
  }

  // 패널티 이력 조회
  async getPenaltyHistory(expertId: string) {
    const penalties = await this.prisma.penaltyHistory.findMany({
      where: { masterAccountId: expertId },
      include: {
        appliedByAdmin: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return penalties.map((penalty: any) => ({
      ...penalty,
      createdAt: penalty.createdAt.toISOString(),
      updatedAt: penalty.updatedAt.toISOString(),
      startDate: penalty.startDate.toISOString(),
      endDate: penalty.endDate?.toISOString(),
      appliedByAdmin: penalty.appliedByAdmin ? {
        ...penalty.appliedByAdmin,
        createdAt: penalty.appliedByAdmin.createdAt.toISOString(),
        updatedAt: penalty.appliedByAdmin.updatedAt.toISOString(),
        user: penalty.appliedByAdmin.user
      } : null
    }))
  }
}