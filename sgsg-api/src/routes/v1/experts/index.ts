import { FastifyInstance } from 'fastify'
import * as handler from './handler'
import * as schema from './schema'

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

  // 패널티 이력 조회
  fastify.get('/me/penalty-history', {
    schema: schema.GetPenaltyHistorySchema,
    preHandler: fastify.authenticate,
    handler: handler.getPenaltyHistoryHandler
  })
}