FROM node:20-alpine

WORKDIR /app

# 시스템 의존성 설치 (건강 체크용)
RUN apk add --no-cache wget

# 패키지 파일 복사 (API 디렉토리에서)
COPY sgsg-api/package*.json ./

# 개발 의존성 포함 설치 (TypeScript 빌드용)
RUN npm ci

# 프로젝트 전체 복사 (Prisma 스키마 포함)
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate --schema=./prisma/schema.prisma

# API 소스 코드 위치로 이동
WORKDIR /app/sgsg-api

# TypeScript 빌드
RUN npm run build

# 로그 디렉터리 생성
RUN mkdir -p /app/logs

# 불필요한 개발 의존성 제거
RUN npm prune --production

# 포트 노출
EXPOSE 4000

# 비root 사용자로 전환
USER node

CMD ["node", "dist/app.js"]