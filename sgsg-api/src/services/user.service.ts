import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

export class UserService {
  private prisma: PrismaClient
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma
    this.fastify = fastify
  }

  // 현재 사용자 프로필 조회
  async getProfile(userId: string) {
    console.log('UserService.getProfile called with userId:', userId)
    console.log('Prisma client:', this.prisma?.user ? 'has user model' : 'no user model')
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        customer: true,
        expert: {
          include: {
            businessAddress: true
          }
        },
        admin: true
      }
    })

    console.log('UserService.getProfile user:', user)
    console.log('User type:', typeof user)
    if (user) {
      console.log('User id:', user.id)
      console.log('User customer:', user.customer)
    }

    if (!user) {
      throw {
        code: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.'
      }
    }

    // 역할별 추가 정보 처리
    let roleSpecificData = {}
    if (user.role === 'customer' && user.customer) {
      roleSpecificData = {
        customer: {
          totalSpent: user.customer.totalSpent,
          totalOrders: user.customer.totalOrders,
          favoriteCategories: user.customer.favoriteCategories,
          lastServiceDate: user.customer.lastServiceDate ? user.customer.lastServiceDate.toISOString() : null,
          preferences: user.customer.preferences
        }
      }
    } else if (user.role === 'expert' && user.expert) {
      roleSpecificData = {
        expert: {
          businessName: user.expert.businessName,
          businessNumber: user.expert.businessNumber,
          businessType: user.expert.businessType,
          serviceRegions: user.expert.serviceRegions,
          rating: user.expert.rating,
          totalCompletedOrders: user.expert.totalCompletedOrders,
          totalEarnings: user.expert.totalEarnings,
          operationalStatus: user.expert.operationalStatus,
          bankName: user.expert.bankName,
          accountNumber: user.expert.accountNumber,
          accountHolder: user.expert.accountHolder,
          introduction: user.expert.introduction,
          certificateUrls: user.expert.certificateUrls,
          portfolioImages: user.expert.portfolioImages,
          approvalStatus: user.expert.approvalStatus,
          activeStatus: user.expert.activeStatus,
          membershipEnabled: user.expert.membershipEnabled,
          membershipSlotCount: user.expert.membershipSlotCount,
          businessAddress: user.expert.businessAddress ? {
            ...user.expert.businessAddress,
            createdAt: user.expert.businessAddress.createdAt.toISOString(),
            updatedAt: user.expert.businessAddress.updatedAt.toISOString()
          } : null
        }
      }
    } else if (user.role === 'admin' && user.admin) {
      roleSpecificData = {
        admin: {
          department: user.admin.department,
          position: user.admin.position,
          permissions: user.admin.permissions,
          lastActiveAt: user.admin.lastActiveAt?.toISOString()
        }
      }
    }

    // 기본 주소 처리
    const defaultAddress = user.addresses.length > 0 ? {
      ...user.addresses[0],
      createdAt: user.addresses[0].createdAt.toISOString(),
      updatedAt: user.addresses[0].updatedAt.toISOString()
    } : null

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        metadata: user.metadata,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      defaultAddress,
      ...roleSpecificData
    }
  }

  // 현재 사용자 프로필 수정
  async updateProfile(userId: string, data: any) {
    // 업데이트 가능한 필드만 추출
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    // 최소 하나의 필드가 제공되어야 함
    if (Object.keys(updateData).length === 0) {
      throw {
        code: 'VALIDATION_001',
        message: '업데이트할 필드가 제공되지 않았습니다.'
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1
        },
        customer: true,
        expert: {
          include: {
            businessAddress: true
          }
        },
        admin: true
      }
    })

    // 역할별 추가 정보 처리 (getProfile과 동일한 로직)
    let roleSpecificData = {}
    if (updatedUser.role === 'customer' && updatedUser.customer) {
      roleSpecificData = {
        customer: {
          totalSpent: updatedUser.customer.totalSpent,
          totalOrders: updatedUser.customer.totalOrders,
          favoriteCategories: updatedUser.customer.favoriteCategories,
          lastServiceDate: updatedUser.customer.lastServiceDate ? updatedUser.customer.lastServiceDate.toISOString() : null,
          preferences: updatedUser.customer.preferences
        }
      }
    } else if (updatedUser.role === 'expert' && updatedUser.expert) {
      roleSpecificData = {
        expert: {
          businessName: updatedUser.expert.businessName,
          businessNumber: updatedUser.expert.businessNumber,
          businessType: updatedUser.expert.businessType,
          serviceRegions: updatedUser.expert.serviceRegions,
          rating: updatedUser.expert.rating,
          totalCompletedOrders: updatedUser.expert.totalCompletedOrders,
          totalEarnings: updatedUser.expert.totalEarnings,
          operationalStatus: updatedUser.expert.operationalStatus,
          bankName: updatedUser.expert.bankName,
          accountNumber: updatedUser.expert.accountNumber,
          accountHolder: updatedUser.expert.accountHolder,
          introduction: updatedUser.expert.introduction,
          certificateUrls: updatedUser.expert.certificateUrls,
          portfolioImages: updatedUser.expert.portfolioImages,
          approvalStatus: updatedUser.expert.approvalStatus,
          activeStatus: updatedUser.expert.activeStatus,
          membershipEnabled: updatedUser.expert.membershipEnabled,
          membershipSlotCount: updatedUser.expert.membershipSlotCount,
          businessAddress: updatedUser.expert.businessAddress ? {
            ...updatedUser.expert.businessAddress,
            createdAt: updatedUser.expert.businessAddress.createdAt.toISOString(),
            updatedAt: updatedUser.expert.businessAddress.updatedAt.toISOString()
          } : null
        }
      }
    } else if (updatedUser.role === 'admin' && updatedUser.admin) {
      roleSpecificData = {
        admin: {
          department: updatedUser.admin.department,
          position: updatedUser.admin.position,
          permissions: updatedUser.admin.permissions,
          lastActiveAt: updatedUser.admin.lastActiveAt?.toISOString()
        }
      }
    }

    // 기본 주소 처리
    const defaultAddress = updatedUser.addresses.length > 0 ? {
      ...updatedUser.addresses[0],
      createdAt: updatedUser.addresses[0].createdAt.toISOString(),
      updatedAt: updatedUser.addresses[0].updatedAt.toISOString()
    } : null

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
        avatarUrl: updatedUser.avatarUrl,
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        lastLoginAt: updatedUser.lastLoginAt?.toISOString(),
        metadata: updatedUser.metadata,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      },
      defaultAddress,
      ...roleSpecificData
    }
  }

  // 사용자 주소록 조회
  async getAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return addresses.map((address: any) => ({
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString()
    }))
  }

  // 주소 추가
  async addAddress(userId: string, data: any) {
    // 필수 필드 검증
    if (!data.label || !data.addressLine1 || !data.city || !data.state || !data.postalCode) {
      throw {
        code: 'VALIDATION_001',
        message: '주소의 필수 필드(라벨, 주소1, 도시, 주/도, 우편번호)가 제공되지 않았습니다.'
      }
    }

    // 만약 isDefault가 true로 설정된 경우, 기존 기본 주소를 false로 설정
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        label: data.label,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || 'South Korea',
        isDefault: data.isDefault || false,
        latitude: data.latitude,
        longitude: data.longitude,
        metadata: data.metadata || {}
      }
    })

    return {
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString()
    }
  }

  // 주소 수정
  async updateAddress(userId: string, addressId: string, data: any) {
    // 주소 존재 확인 및 소유자 확인
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    })

    if (!address) {
      throw {
        code: 'NOT_FOUND',
        message: '주소를 찾을 수 없습니다.'
      }
    }

    // 업데이트 데이터 준비
    const updateData: any = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1
    if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode
    if (data.country !== undefined) updateData.country = data.country
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    // isDefault 변경 처리
    if (data.isDefault !== undefined) {
      if (data.isDefault && !address.isDefault) {
        // 새로운 기본 주소로 설정하는 경우, 기존 기본 주소를 false로 설정
        await this.prisma.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false }
        })
      }
      updateData.isDefault = data.isDefault
    }

    // 최소 하나의 필드가 변경되어야 함
    if (Object.keys(updateData).length === 0) {
      throw {
        code: 'VALIDATION_001',
        message: '업데이트할 필드가 제공되지 않았습니다.'
      }
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: updateData
    })

    return {
      ...updatedAddress,
      createdAt: updatedAddress.createdAt.toISOString(),
      updatedAt: updatedAddress.updatedAt.toISOString()
    }
  }

  // 주소 삭제
  async deleteAddress(userId: string, addressId: string) {
    // 주소 존재 확인 및 소유자 확인
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId }
    })

    if (!address) {
      throw {
        code: 'NOT_FOUND',
        message: '주소를 찾을 수 없습니다.'
      }
    }

    // 기본 주소인 경우 삭제 불가
    if (address.isDefault) {
      throw {
        code: 'VALIDATION_001',
        message: '기본 주소는 삭제할 수 없습니다. 먼저 다른 주소를 기본 주소로 설정해주세요.'
      }
    }

    await this.prisma.address.delete({
      where: { id: addressId }
    })

    return { success: true }
  }

  // 알림 목록 조회
  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.notification.count({
        where: { userId }
      })
    ])

    return {
      notifications: notifications.map((notification: any) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 알림 읽음 표시
  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId }
    })

    if (!notification) {
      throw {
        code: 'NOT_FOUND',
        message: '알림을 찾을 수 없습니다.'
      }
    }

    // 이미 읽은 알림인 경우
    if (notification.isRead) {
      return {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString()
      }
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return {
      ...updatedNotification,
      createdAt: updatedNotification.createdAt.toISOString(),
      readAt: updatedNotification.readAt?.toISOString()
    }
  }
}