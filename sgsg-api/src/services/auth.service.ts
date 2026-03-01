import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { JwtPayload, RegisterRequest, LoginRequest } from '../types/schemas'
import { FastifyInstance } from 'fastify'

export class AuthService {
  private prisma: PrismaClient
  private fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma
    this.fastify = fastify
  }

  // 사용자 등록
  async register(data: RegisterRequest) {
    // 이메일 중복 확인
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

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        name: data.name,
        role: data.role,
        status: 'pending', // 기본 상태: pending (이메일/휴대폰 인증 필요)
      }
    })

    // 역할별 추가 정보 생성
    if (data.role === 'customer') {
      await this.prisma.customer.create({
        data: {
          userId: user.id
        }
      })
    } else if (data.role === 'expert') {
      await this.prisma.expert.create({
        data: {
          userId: user.id,
          businessName: '',
          businessNumber: '',
          businessType: 'individual',
          businessAddressId: null,
          serviceRegions: [],
          rating: 0,
          totalCompletedOrders: 0,
          totalEarnings: 0,
          bankName: null,
          accountNumber: null,
          accountHolder: null,
          introduction: '',
          certificateUrls: [],
          portfolioImages: [],
          metadata: {}
        }
      })
    } else if (data.role === 'admin') {
      await this.prisma.admin.create({
        data: {
          userId: user.id
        }
      })
    }

    // JWT 토큰 생성
    const accessToken = this.fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    } as JwtPayload)

    const refreshToken = this.fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    } as JwtPayload, {
      expiresIn: '30d'
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      accessToken,
      refreshToken
    }
  }

  // 로그인
  async login(data: LoginRequest) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw {
        code: 'AUTH_001',
        message: '이메일 또는 비밀번호가 일치하지 않습니다.'
      }
    }

    // 비밀번호 확인
    const passwordValid = await bcrypt.compare(data.password, user.passwordHash)
    if (!passwordValid) {
      throw {
        code: 'AUTH_001',
        message: '이메일 또는 비밀번호가 일치하지 않습니다.'
      }
    }

    // 계정 상태 확인
    if (user.status !== 'active') {
      throw {
        code: 'AUTH_002',
        message: '계정이 비활성화되었거나 승인 대기 중입니다.'
      }
    }

    // 로그인 시간 업데이트
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // JWT 토큰 생성
    const accessToken = this.fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    } as JwtPayload)

    const refreshToken = this.fastify.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    } as JwtPayload, {
      expiresIn: '30d'
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      accessToken,
      refreshToken
    }
  }

  // 토큰 갱신
  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.fastify.jwt.verify(refreshToken) as any
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive')
      }

      // 새로운 액세스 토큰 생성
      const newAccessToken = this.fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      } as JwtPayload)

      // 새로운 리프레시 토큰 생성 (고유 jti 추가)
      const newRefreshToken = this.fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        jti: crypto.randomUUID()
      } as JwtPayload, {
        expiresIn: '30d'
      })

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      throw {
        code: 'AUTH_003',
        message: '유효하지 않은 리프레시 토큰입니다.'
      }
    }
  }

  // 비밀번호 재설정 요청
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // 보안을 위해 사용자가 존재하지 않아도 성공 응답 반환
      return { message: '비밀번호 재설정 이메일이 전송되었습니다.' }
    }

    // TODO: 실제 구현에서는 비밀번호 재설정 토큰 생성 및 이메일 전송
    // 임시 토큰 생성 (실제 구현에서는 데이터베이스에 저장)
    const resetToken = this.fastify.jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'reset' } as JwtPayload,
      { expiresIn: '1h' }
    )

    // TODO: 이메일 전송 로직 구현

    return { message: '비밀번호 재설정 이메일이 전송되었습니다.' }
  }

  // 비밀번호 재설정 확인
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.fastify.jwt.verify(token) as any
      if (decoded.type !== 'reset') {
        throw new Error('Invalid token type')
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 새 비밀번호 해싱
      const passwordHash = await bcrypt.hash(newPassword, 10)

      // 비밀번호 업데이트
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      })

      return { message: '비밀번호가 성공적으로 재설정되었습니다.' }
    } catch (error) {
      throw {
        code: 'AUTH_004',
        message: '유효하지 않거나 만료된 토큰입니다.'
      }
    }
  }

  // 로그아웃 (클라이언트 측에서 토큰 삭제, 서버 측에서는 블랙리스트 구현 가능)
  async logout() {
    // TODO: 토큰 블랙리스트 구현 (Redis 등)
    return { message: '로그아웃되었습니다.' }
  }
}