# 쓱싹 홈케어 플랫폼 - 배포 전략

**문서 버전**: 2.0  
**작성일**: 2026-01-14  
**우선순위**: P0 (최우선)  
**목표**: 로컬 개발 → 클라우드 배포

---

## 📋 목차

1. [배포 전략 개요](#배포-전략-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Docker 컨테이너화](#docker-컨테이너화)
4. [클라우드 배포](#클라우드-배포)
5. [CI/CD 파이프라인](#cicd-파이프라인)
6. [모니터링 및 로깅](#모니터링-및-로깅)

---

## 배포 전략 개요

### 배포 단계
```
1. 로컬 개발 환경
   ↓
2. Docker 컨테이너화
   ↓
3. 로컬 Docker 테스트
   ↓
4. 클라우드 배포 (스테이징)
   ↓
5. 클라우드 배포 (프로덕션)
```

### 환경 구분
- **Development**: 로컬 개발 환경
- **Staging**: 클라우드 테스트 환경
- **Production**: 클라우드 운영 환경

---

## 로컬 개발 환경

### 1. 필수 소프트웨어
```yaml
Node.js: v18+ (LTS)
PostgreSQL: 14+
Redis: 7+
Docker: 20+
Docker Compose: 2+
Git: 2.30+
```

### 2. 프로젝트 구조
```
sgsg_platform/
├── backend/                 # Node.js API 서버
│   ├── src/
│   │   ├── routes/         # API 라우트
│   │   ├── controllers/    # 컨트롤러
│   │   ├── services/       # 비즈니스 로직
│   │   ├── models/         # 데이터 모델
│   │   ├── middleware/     # 미들웨어
│   │   └── utils/          # 유틸리티
│   ├── prisma/             # Prisma 스키마
│   ├── tests/              # 테스트
│   ├── package.json
│   └── tsconfig.json
│
├── frontend-expert/        # 전문가 웹앱
│   ├── src/
│   │   ├── pages/          # 페이지
│   │   ├── components/     # 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── stores/         # 상태 관리
│   │   ├── services/       # API 서비스
│   │   └── utils/          # 유틸리티
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── frontend-backoffice/    # 백오피스
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docker/                 # Docker 설정
│   ├── backend.Dockerfile
│   ├── frontend-expert.Dockerfile
│   ├── frontend-backoffice.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml      # 로컬 개발용
├── docker-compose.prod.yml # 프로덕션용
└── README.md
```

### 3. 로컬 개발 시작
```bash
# 1. 저장소 클론
git clone https://github.com/your-org/sgsg_platform.git
cd sgsg_platform

# 2. 백엔드 설정
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 등)

# 3. 데이터베이스 마이그레이션
npx prisma migrate dev
npx prisma db seed

# 4. 백엔드 실행
npm run dev

# 5. 전문가 웹앱 설정 (새 터미널)
cd ../frontend-expert
npm install
cp .env.example .env
npm run dev

# 6. 백오피스 설정 (새 터미널)
cd ../frontend-backoffice
npm install
cp .env.example .env
npm run dev
```

### 4. 환경 변수 (.env)

#### 백엔드 (.env)
```env
# 서버
NODE_ENV=development
PORT=3000

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/sgsg_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 외부 서비스
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
ALIGO_API_KEY=your-aligo-api-key
SENDGRID_API_KEY=your-sendgrid-api-key

# AWS S3 (파일 업로드)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=sgsg-uploads
AWS_REGION=ap-northeast-2

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

#### 프론트엔드 (.env)
```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1

# 환경
VITE_ENV=development
```

---

## Docker 컨테이너화

### 1. Dockerfile

#### 백엔드 (backend.Dockerfile)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### 전문가 웹앱 (frontend-expert.Dockerfile)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 백오피스 (frontend-backoffice.Dockerfile)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

#### 로컬 개발용 (docker-compose.yml)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: sgsg_postgres
    environment:
      POSTGRES_USER: sgsg_user
      POSTGRES_PASSWORD: sgsg_password
      POSTGRES_DB: sgsg_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sgsg_network

  redis:
    image: redis:7-alpine
    container_name: sgsg_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - sgsg_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    container_name: sgsg_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://sgsg_user:sgsg_password@postgres:5432/sgsg_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-key
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - sgsg_network

  frontend-expert:
    build:
      context: ./frontend-expert
      dockerfile: ../docker/frontend-expert.Dockerfile
    container_name: sgsg_frontend_expert
    ports:
      - "3001:80"
    depends_on:
      - backend
    networks:
      - sgsg_network

  frontend-backoffice:
    build:
      context: ./frontend-backoffice
      dockerfile: ../docker/frontend-backoffice.Dockerfile
    container_name: sgsg_frontend_backoffice
    ports:
      - "3002:80"
    depends_on:
      - backend
    networks:
      - sgsg_network

volumes:
  postgres_data:
  redis_data:

networks:
  sgsg_network:
    driver: bridge
```

#### 프로덕션용 (docker-compose.prod.yml)
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: sgsg_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend-expert
      - frontend-backoffice
    networks:
      - sgsg_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    container_name: sgsg_backend
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    restart: always
    networks:
      - sgsg_network

  frontend-expert:
    build:
      context: ./frontend-expert
      dockerfile: ../docker/frontend-expert.Dockerfile
    container_name: sgsg_frontend_expert
    restart: always
    networks:
      - sgsg_network

  frontend-backoffice:
    build:
      context: ./frontend-backoffice
      dockerfile: ../docker/frontend-backoffice.Dockerfile
    container_name: sgsg_frontend_backoffice
    restart: always
    networks:
      - sgsg_network

networks:
  sgsg_network:
    driver: bridge
```

### 3. Nginx 설정 (nginx.prod.conf)
```nginx
upstream backend {
    server backend:3000;
}

upstream frontend_expert {
    server frontend-expert:80;
}

upstream frontend_backoffice {
    server frontend-backoffice:80;
}

server {
    listen 80;
    server_name api.sgsg.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name expert.sgsg.com;

    location / {
        proxy_pass http://frontend_expert;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name admin.sgsg.com;

    location / {
        proxy_pass http://frontend_backoffice;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 클라우드 배포

### 1. 클라우드 제공자 선택
- **AWS**: EC2, RDS, ElastiCache, S3
- **GCP**: Compute Engine, Cloud SQL, Memorystore, Cloud Storage
- **Azure**: Virtual Machines, Azure Database, Azure Cache, Blob Storage

### 2. AWS 배포 예시

#### 인프라 구성
```
┌─────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Application Load Balancer                  │
│         (SSL/TLS Termination, HTTPS)                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    EC2 Instances                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Backend    │  │Frontend Expert│  │Frontend Admin│  │
│  │  (Docker)    │  │   (Docker)    │  │   (Docker)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ RDS          │  │ ElastiCache  │  │     S3       │  │
│  │ (PostgreSQL) │  │   (Redis)    │  │  (Storage)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 배포 스크립트 (deploy.sh)
```bash
#!/bin/bash

# 환경 변수 로드
source .env.production

# Docker 이미지 빌드
docker build -t sgsg-backend:latest -f docker/backend.Dockerfile ./backend
docker build -t sgsg-frontend-expert:latest -f docker/frontend-expert.Dockerfile ./frontend-expert
docker build -t sgsg-frontend-backoffice:latest -f docker/frontend-backoffice.Dockerfile ./frontend-backoffice

# ECR에 푸시
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker tag sgsg-backend:latest $ECR_REGISTRY/sgsg-backend:latest
docker tag sgsg-frontend-expert:latest $ECR_REGISTRY/sgsg-frontend-expert:latest
docker tag sgsg-frontend-backoffice:latest $ECR_REGISTRY/sgsg-frontend-backoffice:latest
docker push $ECR_REGISTRY/sgsg-backend:latest
docker push $ECR_REGISTRY/sgsg-frontend-expert:latest
docker push $ECR_REGISTRY/sgsg-frontend-backoffice:latest

# EC2 인스턴스에 배포
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
  cd /home/ubuntu/sgsg_platform
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up -d
  docker system prune -f
EOF

echo "배포 완료!"
```

---

## CI/CD 파이프라인

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies (Backend)
        run: |
          cd backend
          npm ci
      
      - name: Run tests (Backend)
        run: |
          cd backend
          npm test
      
      - name: Install dependencies (Frontend Expert)
        run: |
          cd frontend-expert
          npm ci
      
      - name: Run tests (Frontend Expert)
        run: |
          cd frontend-expert
          npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: sgsg
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG -f docker/backend.Dockerfile ./backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-frontend-expert:$IMAGE_TAG -f docker/frontend-expert.Dockerfile ./frontend-expert
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-frontend-backoffice:$IMAGE_TAG -f docker/frontend-backoffice.Dockerfile ./frontend-backoffice
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-frontend-expert:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-frontend-backoffice:$IMAGE_TAG
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/ubuntu/sgsg_platform
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

---

## 모니터링 및 로깅

### 1. 로깅 전략
```javascript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### 2. 헬스 체크
```javascript
// backend/src/routes/health.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import redis from '../utils/redis';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    // DB 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis 연결 확인
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export default router;
```

### 3. 모니터링 도구
- **PM2**: Node.js 프로세스 관리
- **CloudWatch**: AWS 모니터링 (메트릭, 로그)
- **Sentry**: 에러 추적
- **Datadog**: APM (선택사항)

---

## 배포 체크리스트

### 배포 전
- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 준비
- [ ] SSL/TLS 인증서 준비
- [ ] 도메인 설정 확인
- [ ] 백업 전략 수립

### 배포 중
- [ ] Docker 이미지 빌드
- [ ] 이미지 레지스트리 푸시
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 서비스 배포
- [ ] 헬스 체크 확인

### 배포 후
- [ ] 서비스 정상 작동 확인
- [ ] 로그 모니터링
- [ ] 성능 모니터링
- [ ] 에러 추적 설정
- [ ] 백업 확인

---

## 다음 단계

1. **로컬 환경 구축** - Docker Compose로 로컬 테스트
2. **클라우드 계정 설정** - AWS/GCP/Azure 계정 생성
3. **인프라 프로비저닝** - Terraform 또는 수동 설정
4. **CI/CD 설정** - GitHub Actions 설정
5. **모니터링 설정** - CloudWatch, Sentry 설정
6. **배포 실행** - 스테이징 → 프로덕션

---

**작성일**: 2026-01-14  
**버전**: 2.0  
**상태**: 스펙 작성 완료
