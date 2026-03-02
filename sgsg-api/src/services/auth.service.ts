import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { JwtPayload, RegisterRequest, LoginRequest } from '../types/schemas'
import { FastifyInstance } from 'fastify'
import { EmailService } from './email.service'

export class AuthService {
  private prisma: PrismaClient
  private fastify: FastifyInstance
  private emailService: EmailService

  constructor(fastify: FastifyInstance) {
    this.prisma = fastify.prisma
    this.fastify = fastify
    this.emailService = new EmailService()
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

    // 역할별 추가 정보 생성 및 ID 저장
    let adminId: string | undefined
    let customerId: string | undefined
    let expertId: string | undefined

    if (data.role === 'customer') {
      const customer = await this.prisma.customer.create({
        data: {
          userId: user.id
        }
      })
      customerId = customer.id
    } else if (data.role === 'expert') {
      // Generate unique business number
      const businessNumber = `${Date.now().toString().slice(-10)}-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`
      
      const expert = await this.prisma.expert.create({
        data: {
          userId: user.id,
          businessName: data.name || '개인사업자',
          businessNumber: businessNumber,
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
      expertId = expert.id
    } else if (data.role === 'admin') {
      const admin = await this.prisma.admin.create({
        data: {
          userId: user.id
        }
      })
      adminId = admin.id
    }

    // JWT 토큰 생성
    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }
    // Add role-specific IDs if they exist
    if (adminId) accessTokenPayload.adminId = adminId
    if (customerId) accessTokenPayload.customerId = customerId
    if (expertId) accessTokenPayload.expertId = expertId

    const accessToken = this.fastify.jwt.sign(accessTokenPayload)

    const refreshTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    }
    // Add role-specific IDs to refresh token as well
    if (adminId) refreshTokenPayload.adminId = adminId
    if (customerId) refreshTokenPayload.customerId = customerId
    if (expertId) refreshTokenPayload.expertId = expertId

    const refreshToken = this.fastify.jwt.sign(refreshTokenPayload, {
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

    // 역할별 추가 ID 조회
    let adminId: string | undefined
    let customerId: string | undefined
    let expertId: string | undefined

    if (user.role === 'admin') {
      const admin = await this.prisma.admin.findUnique({
        where: { userId: user.id }
      })
      if (admin) {
        adminId = admin.id
      }
    } else if (user.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.id }
      })
      if (customer) {
        customerId = customer.id
      }
    } else if (user.role === 'expert') {
      const expert = await this.prisma.expert.findUnique({
        where: { userId: user.id }
      })
      if (expert) {
        expertId = expert.id
      }
    }

    // JWT 토큰 생성
    const accessTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }
    // Add role-specific IDs if they exist
    if (adminId) accessTokenPayload.adminId = adminId
    if (customerId) accessTokenPayload.customerId = customerId
    if (expertId) accessTokenPayload.expertId = expertId

    const accessToken = this.fastify.jwt.sign(accessTokenPayload)

    const refreshTokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    }
    // Add role-specific IDs to refresh token as well
    if (adminId) refreshTokenPayload.adminId = adminId
    if (customerId) refreshTokenPayload.customerId = customerId
    if (expertId) refreshTokenPayload.expertId = expertId

    const refreshToken = this.fastify.jwt.sign(refreshTokenPayload, {
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

    // 비밀번호 재설정 토큰 생성 (1시간 유효)
    const resetToken = this.fastify.jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'reset' } as JwtPayload,
      { expiresIn: '1h' }
    )

    try {
      // EmailService를 통해 비밀번호 재설정 이메일 전송
      const emailSent = await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name || undefined
      )

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`)
        // 실패해도 보안을 위해 성공 메시지 반환
      } else {
        console.log(`Password reset email sent successfully to ${email}`)
      }
    } catch (error) {
      console.error('Error sending password reset email:', error)
      // SMTP 설정이 없거나 실패한 경우 개발환경에서는 토큰을 콘솔에 출력
      console.log(`비밀번호 재설정 토큰 for ${email}:`, resetToken)
    }

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

  // 이메일 인증
  async verifyEmail(token: string) {
    try {
      // 토큰 검증 (JWT 토큰 사용)
      const decoded = this.fastify.jwt.verify(token) as any
      if (decoded.type !== 'email_verify') {
        throw new Error('Invalid token type')
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 이메일 인증 상태 업데이트
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          emailVerified: true,
          // 이메일 인증 완료 시 상태를 active로 변경 (필요 시)
          status: user.phoneVerified ? 'active' : user.status
        }
      })

      return { message: '이메일 인증이 완료되었습니다.' }
    } catch (error) {
      throw {
        code: 'AUTH_005',
        message: '유효하지 않거나 만료된 인증 토큰입니다.'
      }
    }
  }

  // 이메일 인증 토큰 생성 및 전송
  async sendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // 보안을 위해 사용자가 존재하지 않아도 성공 응답 반환
      return { message: '이메일 인증 링크가 전송되었습니다.' }
    }

    // 이메일 인증 토큰 생성 (24시간 유효)
    const verifyToken = this.fastify.jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'email_verify' } as any,
      { expiresIn: '24h' }
    )

    try {
      // EmailService를 통해 인증 이메일 전송
      const emailSent = await this.emailService.sendVerificationEmail(
        user.email,
        verifyToken,
        user.name || undefined
      )

      if (!emailSent) {
        console.error(`Failed to send verification email to ${email}`)
        // 실패해도 보안을 위해 성공 메시지 반환
      } else {
        console.log(`Verification email sent successfully to ${email}`)
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      // SMTP 설정이 없거나 실패한 경우 개발환경에서는 토큰을 콘솔에 출력
      console.log(`이메일 인증 토큰 for ${email}:`, verifyToken)
    }

    return { message: '이메일 인증 링크가 전송되었습니다.' }
  }

  // 휴대폰 인증 코드 생성 및 전송
  async sendVerificationSms(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      // 보안을 위해 사용자가 존재하지 않아도 성공 응답 반환
      return { message: '인증 코드가 전송되었습니다.' }
    }

    // 6자리 랜덤 숫자 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // TODO: 실제 SMS 전송 로직 구현 (Twilio, AWS SNS, 등)
    // 개발 환경에서는 콘솔에 코드 출력
    console.log(`SMS 인증 코드 for ${phone}:`, code)
    
    // TODO: 코드를 데이터베이스에 저장 (만료 시간 포함)

    return { message: '인증 코드가 전송되었습니다.' }
  }

  // 휴대폰 인증
  async verifyPhone(phone: string, code: string) {
    // TODO: 실제 구현에서는 SMS 인증 코드 검증 로직 구현
    // 임시로 코드가 '123456'이면 성공으로 처리
    if (code !== '123456') {
      throw {
        code: 'AUTH_006',
        message: '인증 코드가 일치하지 않습니다.'
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      throw {
        code: 'AUTH_007',
        message: '사용자를 찾을 수 없습니다.'
      }
    }

    // 휴대폰 인증 상태 업데이트
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        phoneVerified: true,
        // 휴대폰 인증 완료 시 상태를 active로 변경 (필요 시)
        status: user.emailVerified ? 'active' : user.status
      }
    })

    return { message: '휴대폰 인증이 완료되었습니다.' }
  }
}