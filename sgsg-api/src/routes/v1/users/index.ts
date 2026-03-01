import { FastifyInstance } from 'fastify'
import * as handler from './handler'
import * as schema from './schema'

export default async function userRoutes(fastify: FastifyInstance) {
  // 현재 사용자 프로필 조회
  fastify.get('/me', {
    schema: schema.GetProfileSchema,
    preHandler: fastify.authenticate,
    handler: handler.getProfileHandler
  })

  // 현재 사용자 프로필 수정
  fastify.put('/me', {
    schema: schema.UpdateProfileSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateProfileHandler
  })

  // 사용자 주소록 조회
  fastify.get('/me/addresses', {
    schema: schema.GetAddressesSchema,
    preHandler: fastify.authenticate,
    handler: handler.getAddressesHandler
  })

  // 주소 추가
  fastify.post('/me/addresses', {
    schema: schema.AddAddressSchema,
    preHandler: fastify.authenticate,
    handler: handler.addAddressHandler
  })

  // 주소 수정
  fastify.put('/me/addresses/:addressId', {
    schema: schema.UpdateAddressSchema,
    preHandler: fastify.authenticate,
    handler: handler.updateAddressHandler
  })

  // 주소 삭제
  fastify.delete('/me/addresses/:addressId', {
    schema: schema.DeleteAddressSchema,
    preHandler: fastify.authenticate,
    handler: handler.deleteAddressHandler
  })

  // 알림 목록 조회
  fastify.get('/me/notifications', {
    schema: schema.GetNotificationsSchema,
    preHandler: fastify.authenticate,
    handler: handler.getNotificationsHandler
  })

  // 알림 읽음 표시
  fastify.put('/me/notifications/:notificationId/read', {
    schema: schema.MarkNotificationAsReadSchema,
    preHandler: fastify.authenticate,
    handler: handler.markNotificationAsReadHandler
  })
}