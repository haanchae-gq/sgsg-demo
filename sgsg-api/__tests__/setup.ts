// 테스트 설정 파일
import dotenv from 'dotenv'
import path from 'path'

// .env 파일 로드 (프로젝트 루트의 .env 파일)
const envPath = path.resolve(__dirname, '../../.env')
dotenv.config({ path: envPath })

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test'
// Prisma가 DB_URL 대신 DATABASE_URL을 사용하도록 설정
if (process.env.DB_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DB_URL
}

// Jest 전역 설정
beforeAll(() => {
  // 테스트 시작 전 실행
  console.log('테스트 환경 설정 중...')
})

afterAll(() => {
  // 테스트 종료 후 실행
  console.log('테스트 완료.')
})