import { FastifyInstance } from 'fastify'
import { NotificationService } from '../services/notification.service'

export default async function websocketRoutes(fastify: FastifyInstance) {
  // WebSocket 연결 핸들러
  fastify.get('/ws', { websocket: true }, async (connection, request) => {
    console.log('[WebSocket] New connection attempt')

    try {
      // JWT 토큰 검증 및 사용자 식별
      const token = request.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        connection.close(1008, 'Authentication required')
        return
      }

      let decoded: any
      try {
        decoded = fastify.jwt.verify(token)
      } catch (error) {
        connection.close(1008, 'Invalid token')
        return
      }

      const userId = decoded.userId
      if (!userId) {
        connection.close(1008, 'Invalid user')
        return
      }

      console.log(`[WebSocket] User ${userId} connected`)

      // NotificationService에 클라이언트 등록
      const notificationService = new NotificationService(fastify.prisma)
      notificationService.addClient(userId, connection)

      // 연결 성공 메시지
      connection.send(JSON.stringify({
        type: 'connection_established',
        data: {
          userId,
          connectedAt: new Date().toISOString(),
          message: 'WebSocket connection established successfully'
        }
      }))

      // 연결 해제 시 클라이언트 제거
      connection.on('close', () => {
        notificationService.removeClient(userId)
        console.log(`[WebSocket] User ${userId} disconnected`)
      })

      // 클라이언트로부터 메시지 수신
      connection.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString())
          console.log(`[WebSocket] Message from ${userId}:`, data)

          switch (data.type) {
            case 'ping':
              // Heartbeat 응답
              connection.send(JSON.stringify({
                type: 'pong',
                data: { timestamp: new Date().toISOString() }
              }))
              break

            case 'mark_notification_read':
              // 알림 읽음 처리
              if (data.notificationId) {
                try {
                  await notificationService.markAsRead(data.notificationId, userId)
                  connection.send(JSON.stringify({
                    type: 'notification_marked_read',
                    data: { notificationId: data.notificationId }
                  }))
                } catch (error) {
                  connection.send(JSON.stringify({
                    type: 'error',
                    data: { message: 'Failed to mark notification as read' }
                  }))
                }
              }
              break

            case 'get_unread_count':
              // 읽지 않은 알림 수 조회
              try {
                const count = await notificationService.getUnreadCount(userId)
                connection.send(JSON.stringify({
                  type: 'unread_count',
                  data: { count }
                }))
              } catch (error) {
                connection.send(JSON.stringify({
                  type: 'error',
                  data: { message: 'Failed to get unread count' }
                }))
              }
              break

            default:
              connection.send(JSON.stringify({
                type: 'error',
                data: { message: `Unknown message type: ${data.type}` }
              }))
          }
        } catch (error) {
          console.error('[WebSocket] Failed to process message:', error)
          connection.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }))
        }
      })

      // 에러 처리
      connection.on('error', (error) => {
        console.error(`[WebSocket] Connection error for user ${userId}:`, error)
        notificationService.removeClient(userId)
      })

      // 초기 읽지 않은 알림 수 전송
      try {
        const unreadCount = await notificationService.getUnreadCount(userId)
        connection.send(JSON.stringify({
          type: 'unread_count',
          data: { count: unreadCount }
        }))
      } catch (error) {
        console.error('[WebSocket] Failed to get initial unread count:', error)
      }

    } catch (error) {
      console.error('[WebSocket] Connection setup error:', error)
      connection.close(1011, 'Internal server error')
    }
  })
}