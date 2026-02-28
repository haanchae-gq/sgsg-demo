# SGSG (쓱싹 홈케어 플랫폼)

현대적인 홈케어 서비스 플랫폼으로 전문가와 고객을 연결하는 통합 솔루션입니다.

## 🚀 기술 스택

### 백엔드
- **런타임**: Node.js 18+
- **프레임워크**: Fastify (고성능 웹 프레임워크)
- **데이터베이스**: PostgreSQL 14+
- **ORM**: Prisma (타입 안전한 데이터베이스 접근)
- **언어**: TypeScript

### 프론트엔드
- **어드민 대시보드**: React 18 + Ant Design 5 + Tailwind CSS 3
- **전문가 모바일 앱**: React 18 + Ant Design Mobile 5 + Tailwind CSS 3
- **빌드 도구**: Vite
- **언어**: TypeScript

### 인프라
- **컨테이너**: Docker + Docker Compose
- **데이터베이스**: PostgreSQL (로컬 개발용)
- **환경 관리**: dotenv

## 📁 프로젝트 구조

```
sgsg-demo/
├── sgsg-api/          # Fastify 백엔드 API
├── sgsg-adm/          # 어드민 대시보드 (React + Ant Design)
├── sgsg-exp/          # 전문가 모바일 웹앱 (React + Ant Design Mobile)
├── prisma/            # Prisma 스키마 및 마이그레이션
├── specs/             # 프로젝트 스펙 문서
└── .env               # 환경 변수
```

## ⚡ 빠른 시작

### 전제 조건
- Node.js 18+ 및 npm/yarn/pnpm
- PostgreSQL 14+ (또는 Docker)
- Git

### 1. 저장소 클론
```bash
git clone <repository-url>
cd sgsg-demo
```

### 2. 환경 변수 설정
```bash
# 환경 변수 파일 복사
cp .env.example .env

# .env 파일 편집 (데이터베이스 연결 정보 수정)
```

### 3. 데이터베이스 설정
```bash
# PostgreSQL 시작 (Docker 사용 시)
docker-compose up -d postgres

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev --name init
```

### 4. 의존성 설치
```bash
# 모든 애플리케이션 의존성 설치
cd sgsg-api && npm install
cd ../sgsg-adm && npm install
cd ../sgsg-exp && npm install
```

### 5. 개발 서버 시작
```bash
# 터미널 1: 백엔드 API
cd sgsg-api && npm run dev

# 터미널 2: 어드민 대시보드
cd sgsg-adm && npm run dev

# 터미널 3: 전문가 모바일 앱
cd sgsg-exp && npm run dev
```

## 🚪 접속 정보

- **백엔드 API**: http://localhost:3001
- **어드민 대시보드**: http://localhost:3000
- **전문가 모바일 앱**: http://localhost:3002
- **Prisma Studio** (데이터베이스 GUI): http://localhost:5555
  ```bash
  npx prisma studio
  ```

## 🗄️ 데이터베이스

### 스키마 마이그레이션
```bash
# 새로운 마이그레이션 생성
npx prisma migrate dev --name "migration_name"

# 프로덕션 마이그레이션
npx prisma migrate deploy

# 스키마 변경 후 Prisma 클라이언트 재생성
npx prisma generate
```

### 데이터베이스 GUI
```bash
# Prisma Studio 실행
npx prisma studio
```

## 🧪 테스트

```bash
# 백엔드 테스트
cd sgsg-api && npm test

# 프론트엔드 테스트
cd sgsg-adm && npm test
cd ../sgsg-exp && npm test
```

## 🐳 Docker 개발 환경

```bash
# 모든 서비스 시작 (PostgreSQL, 백엔드, 프론트엔드)
docker-compose up

# 특정 서비스만 시작
docker-compose up postgres
docker-compose up api
```

## 📦 배포

### 프로덕션 빌드
```bash
# 백엔드 빌드
cd sgsg-api && npm run build

# 프론트엔드 빌드
cd sgsg-adm && npm run build
cd ../sgsg-exp && npm run build
```

### 환경 변수
프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:
- `DATABASE_URL`: 프로덕션 데이터베이스 연결 문자열
- `JWT_SECRET`: JWT 토큰 서명용 비밀 키
- `NODE_ENV`: production

## 🔗 API 문서

API 문서는 Swagger/OpenAPI를 통해 제공됩니다:
- 개발 서버: http://localhost:3001/docs
- 프로덕션: https://api.yourdomain.com/docs

## 📝 개발 가이드

### 코드 컨벤션
- TypeScript strict 모드 사용
- Prettier 및 ESLint 설정 준수
- 커밋 메시지 컨벤션 (Conventional Commits)

### 브랜치 전략
- `main`: 프로덕션 릴리스
- `develop`: 개발 통합 브랜치
- `feature/*`: 새로운 기능 개발
- `fix/*`: 버그 수정

### 커밋 메시지 형식
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 수정
```

## 🤝 기여 방법

1. 이슈 생성 또는 선택
2. 기능 브랜치 생성 (`feature/your-feature`)
3. 코드 작성 및 테스트
4. Pull Request 생성
5. 코드 리뷰 후 병합

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🆘 지원

문제가 발생하면 다음을 확인하세요:
1. `.env` 파일 설정
2. 데이터베이스 연결 상태
3. 의존성 설치 완료 여부
4. 포트 충돌 여부

이슈 템플릿을 사용하여 버그 리포트를 제출해 주세요.