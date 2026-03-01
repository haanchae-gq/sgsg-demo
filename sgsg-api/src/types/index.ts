export * from './schemas'

// 공통 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}