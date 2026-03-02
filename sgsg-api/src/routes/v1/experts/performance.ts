import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ExpertPerformanceService } from '../../../services/expert-performance.service'

export default async function expertPerformanceRoutes(fastify: FastifyInstance) {
  // 최적화된 전문가 대시보드 데이터
  fastify.get('/me/dashboard-data', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.jwtPayload?.userId
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: { code: 'AUTH_001', message: '인증이 필요합니다.' }
          })
        }

        const expert = await request.server.prisma.expert.findFirst({
          where: { userId },
          select: { id: true }
        })

        if (!expert) {
          return reply.status(404).send({
            success: false,
            error: { code: 'EXPERT_001', message: '전문가 프로필을 찾을 수 없습니다.' }
          })
        }

        const performanceService = new ExpertPerformanceService(request.server)
        const dashboardData = await performanceService.getExpertDashboardData(expert.id)

        return reply.status(200).send({
          success: true,
          data: dashboardData
        })
      } catch (error: any) {
        request.log.error(error, 'Failed to get dashboard data')
        return reply.status(500).send({
          success: false,
          error: { code: 'PERFORMANCE_001', message: '대시보드 데이터 조회에 실패했습니다.' }
        })
      }
    }
  })

  // 성능 점수 조회
  fastify.get('/me/performance-score', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.jwtPayload?.userId
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: { code: 'AUTH_001', message: '인증이 필요합니다.' }
          })
        }

        const expert = await request.server.prisma.expert.findFirst({
          where: { userId },
          select: { id: true }
        })

        if (!expert) {
          return reply.status(404).send({
            success: false,
            error: { code: 'EXPERT_001', message: '전문가 프로필을 찾을 수 없습니다.' }
          })
        }

        const performanceService = new ExpertPerformanceService(request.server)
        const performanceScore = await performanceService.calculateExpertPerformanceScore(expert.id)

        return reply.status(200).send({
          success: true,
          data: performanceScore
        })
      } catch (error: any) {
        request.log.error(error, 'Failed to get performance score')
        return reply.status(500).send({
          success: false,
          error: { code: 'PERFORMANCE_002', message: '성능 점수 조회에 실패했습니다.' }
        })
      }
    }
  })

  // 시스템 성능 메트릭스 (관리자용)
  fastify.get('/performance/metrics', {
    preHandler: fastify.authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 관리자 권한 확인
        if (request.jwtPayload?.role !== 'admin') {
          return reply.status(403).send({
            success: false,
            error: { code: 'AUTH_003', message: '관리자 권한이 필요합니다.' }
          })
        }

        const performanceService = new ExpertPerformanceService(request.server)
        
        const [metrics, dbHealth] = await Promise.all([
          performanceService.getPerformanceMetrics(),
          performanceService.getDatabaseHealth()
        ])

        return reply.status(200).send({
          success: true,
          data: {
            businessMetrics: metrics,
            databaseHealth: dbHealth
          }
        })
      } catch (error: any) {
        request.log.error(error, 'Failed to get performance metrics')
        return reply.status(500).send({
          success: false,
          error: { code: 'PERFORMANCE_003', message: '성능 메트릭스 조회에 실패했습니다.' }
        })
      }
    }
  })
}