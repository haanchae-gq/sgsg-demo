import { FastifyInstance } from 'fastify'
import * as handler from './handler'
import * as schema from './schema'
import performanceRoutes from './performance'

export default async function expertRoutes(fastify: FastifyInstance) {
  // 전문가 프로필 조회
  fastify.get('/me', {
    schema: schema.GetExpertProfileSchema,
    preHandler: fastify.authenticate,
    handler: handler.getExpertProfileHandler
  })

  // 전문가 프로필 업데이트
  fastify.put('/me', {
    schema: schema.UpdateExpertProfileSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateExpertProfileHandler
  })

  // 서브 계정 목록 조회
  fastify.get('/me/sub-accounts', {
    schema: schema.GetSubAccountsSchema,
    preHandler: fastify.authenticate,
    handler: handler.getSubAccountsHandler
  })

  // 서브 계정 생성
  fastify.post('/me/sub-accounts', {
    schema: schema.CreateSubAccountSchema,
    preHandler: fastify.authenticate,
    handler: handler.createSubAccountHandler
  })

  // 서브 계정 업데이트
  fastify.put('/me/sub-accounts/:subAccountId', {
    schema: schema.UpdateSubAccountSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateSubAccountHandler
  })

  // 멤버십 정보 조회
  fastify.get('/me/membership', {
    schema: schema.GetMembershipInfoSchema,
    preHandler: fastify.authenticate,
    handler: handler.getMembershipInfoHandler
  })

  // 배정 이력 조회
  fastify.get('/me/assignment-history', {
    schema: schema.GetAssignmentHistorySchema,
    preHandler: fastify.authenticate,
    handler: handler.getAssignmentHistoryHandler
  })

  // 패널티 이력 조회 (두 경로 모두 지원)
  fastify.get('/me/penalty-history', {
    schema: schema.GetPenaltyHistorySchema,
    preHandler: fastify.authenticate,
    handler: handler.getPenaltyHistoryHandler
  })
  
  fastify.get('/me/penalties', {
    schema: schema.GetPenaltyHistorySchema,
    preHandler: fastify.authenticate,
    handler: handler.getPenaltyHistoryHandler
  })

  // 서비스 매핑 관련 API
  fastify.get('/me/services', {
    schema: schema.GetServiceMappingsSchema,
    preHandler: fastify.authenticate,
    handler: handler.getServiceMappingsHandler
  })

  fastify.post('/me/services', {
    schema: schema.CreateServiceMappingSchema,
    preHandler: fastify.authenticate,
    handler: handler.createServiceMappingHandler
  })

  fastify.put('/me/services/:mappingId', {
    schema: schema.UpdateServiceMappingSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateServiceMappingHandler
  })

  fastify.delete('/me/services/:mappingId', {
    schema: schema.DeleteServiceMappingSchema,
    preHandler: fastify.authenticate,
    handler: handler.deleteServiceMappingHandler
  })

  // 전문가 주문 목록 조회
  fastify.get('/me/orders', {
    schema: schema.GetExpertOrdersSchema,
    preHandler: fastify.authenticate,
    handler: handler.getExpertOrdersHandler
  })

  // 전문가 정산 내역 조회
  fastify.get('/me/settlements', {
    schema: schema.GetSettlementsSchema,
    preHandler: fastify.authenticate,
    handler: handler.getSettlementsHandler
  })

  // 스케줄 관리 API
  fastify.get('/me/schedule', {
    schema: schema.GetScheduleSchema,
    preHandler: fastify.authenticate,
    handler: handler.getScheduleHandler
  })

  fastify.post('/me/schedule', {
    schema: schema.CreateScheduleSchema,
    preHandler: fastify.authenticate,
    handler: handler.createScheduleHandler
  })

  fastify.put('/me/schedule/:scheduleId', {
    schema: schema.UpdateScheduleSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateScheduleHandler
  })

  fastify.delete('/me/schedule/:scheduleId', {
    schema: schema.DeleteScheduleSchema,
    preHandler: fastify.authenticate,
    handler: handler.deleteScheduleHandler
  })

  // 통계 정보 조회
  fastify.get('/me/statistics', {
    schema: schema.GetStatisticsSchema,
    preHandler: fastify.authenticate,
    handler: handler.getStatisticsHandler
  })

  // 일일 배정 상한 조회
  fastify.get('/me/daily-assignment-limit', {
    schema: schema.GetDailyAssignmentLimitSchema,
    preHandler: fastify.authenticate,
    handler: handler.getDailyAssignmentLimitHandler
  })

  // 성능 최적화 라우트
  fastify.register(performanceRoutes)
}