# 세션 1: 인증 및 사용자 기본 API

## 세션 개요
이 세션은 시스템의 인증(Authentication)과 사용자 기본 정보 관리 기능을 구현합니다. JWT 기반 인증 시스템과 사용자 프로필, 주소록, 알림 관리 등을 포함합니다.

**우선순위**: P0 (최우선)  
**예상 작업 시간**: 3-4일  
**의존성**: 없음 (기반 세션)  
**다중 에이전트 작업 가능**: 예 (단일 에이전트 권장 - 핵심 인프라)

## 구현할 API 엔드포인트

### 1. 인증 API (`/api/v1/auth`)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| POST | `/auth/register` | 회원가입 (사용자 생성) | Public | ✅ 구현됨 |
| POST | `/auth/login` | 이메일/비밀번호 로그인 | Public | ✅ 구현됨 |
| POST | `/auth/logout` | 로그아웃 (토큰 무효화) | Authenticated | ✅ 구현됨 |
| POST | `/auth/refresh` | 토큰 갱신 | Public (리프레시 토큰 필요) | ✅ 구현됨 |
| POST | `/auth/verify-email` | 이메일 인증 | Public | ⚠️ TODO 필요 |
| POST | `/auth/verify-phone` | 휴대폰 인증 | Public | ⚠️ TODO 필요 |
| POST | `/auth/forgot-password` | 비밀번호 재설정 요청 | Public | ✅ 구현됨 |
| POST | `/auth/reset-password` | 비밀번호 재설정 | Public | ✅ 구현됨 |

### 2. 사용자 관리 API (`/api/v1/users`)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/users/me` | 현재 사용자 프로필 조회 | Authenticated | ✅ 구현됨 |
| PUT | `/users/me` | 현재 사용자 프로필 수정 | Authenticated | ✅ 구현됨 |
| GET | `/users/me/addresses` | 사용자 주소록 조회 | Authenticated | ✅ 구현됨 |
| POST | `/users/me/addresses` | 주소 추가 | Authenticated | ✅ 구현됨 |
| PUT | `/users/me/addresses/:addressId` | 주소 수정 | Authenticated | ✅ 구현됨 |
| DELETE | `/users/me/addresses/:addressId` | 주소 삭제 | Authenticated | ✅ 구현됨 |
| GET | `/users/me/notifications` | 알림 목록 조회 | Authenticated | ✅ 구현됨 |
| PUT | `/users/me/notifications/:notificationId/read` | 알림 읽음 표시 | Authenticated | ✅ 구현됨 |

### 3. 파일 업로드 API (`/api/v1/upload`)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| POST | `/upload` | 파일 업로드 (이미지, 문서) | Authenticated | ✅ 구현됨 |
| DELETE | `/upload/:fileId` | 파일 삭제 | Authenticated (업로더만) | ✅ 구현됨 |

### 4. 실시간 알림 API (`/api/v1/notifications`)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/notifications` | 알림 목록 조회 | Authenticated | ✅ 구현됨 |
| PUT | `/notifications/:notificationId/read` | 알림 읽음 표시 | Authenticated | ✅ 구현됨 |
| DELETE | `/notifications/:notificationId` | 알림 삭제 | Authenticated | ✅ 구현됨 |
| POST | `/notifications/send` | 알림 발송 (관리자) | Admin | ✅ 구현됨 |

## 필요한 데이터베이스 테이블/마이그레이션
### 이미 존재하는 테이블 (Prisma schema 확인)
- `User` - 사용자 기본 정보
- `Customer` - 고객 확장 정보
- `Expert` - 전문가 확장 정보  
- `Admin` - 관리자 확장 정보
- `Address` - 주소록 (확장 필요)
- `Notification` - 알림 (확장 필요)
- `UploadedFile` - 업로드 파일 메타데이터 (생성 필요)

### 필요한 마이그레이션
1. `Address` 테이블 확장: `userId` 관계 추가, 필드 구성
2. `Notification` 테이블 생성/확장: `userId`, `type`, `title`, `content`, `readAt`, `metadata`
3. `UploadedFile` 테이블 생성: `id`, `userId`, `originalName`, `storagePath`, `mimeType`, `size`, `createdAt`

## 의존성
### 내부 의존성
- **인증 플러그인**: `src/plugins/auth.ts` (이미 구현됨)
- **Prisma 클라이언트**: 데이터베이스 접근
- **JWT 플러그인**: `@fastify/jwt` (이미 구성됨)

### 외부 의존성
- **bcrypt**: 비밀번호 해싱
- **crypto**: 토큰 생성
- **이메일 서비스**: 인증 이메일 발송 (TODO)
- **SMS 서비스**: 휴대폰 인증 (TODO)
- **파일 저장소**: AWS S3 또는 로컬 저장소 (TODO)

## 테스트 시나리오
### 단위 테스트
1. `AuthService` 단위 테스트: 회원가입, 로그인, 토큰 갱신, 비밀번호 재설정
2. `UserService` 단위 테스트: 프로필 조회/수정, 주소록 CRUD
3. `NotificationService` 단위 테스트: 알림 생성, 조회, 읽음 처리
4. `UploadService` 단위 테스트: 파일 업로드, 삭제, 유효성 검사

### 통합 테스트 (E2E)
1. 회원가입 → 이메일 인증 → 로그인 전체 흐름
2. 사용자 프로필 수정 및 주소록 관리
3. 파일 업로드 및 다운로드
4. 알림 생성 및 조회

## 예상 작업 시간
| 작업 항목 | 예상 시간 | 담당자 |
|-----------|-----------|--------|
| 이메일/휴대폰 인증 구현 | 1일 | 에이전트 1 |
| 사용자 프로필 API 완성 | 0.5일 | 에이전트 1 |
| 주소록 API 구현 | 0.5일 | 에이전트 1 |
| 알림 API 구현 | 1일 | 에이전트 2 |
| 파일 업로드 API 구현 | 0.5일 | 에이전트 2 |
| 테스트 작성 및 검증 | 0.5일 | 에이전트 1 |

**총 예상 시간**: 3-4일 (병렬 작업 가능)

## 다중 에이전트 작업을 위한 특별 지침
1. **작업 분할**: 
   - 에이전트 1: 인증 관련 API (이메일/휴대폰 인증, 사용자 프로필, 주소록)
   - 에이전트 2: 파일 업로드, 알림 시스템
   
2. **공유 리소스**:
   - `src/plugins/auth.ts`: JWT 인증 플러그인 (읽기 전용)
   - `src/services/auth.service.ts`: 수정 시 조율 필요
   - `prisma/schema.prisma`: 마이그레이션 시 순차적 적용 필요

3. **통합 포인트**:
   - 모든 API는 동일한 응답 형식(`formatSuccessResponse`, `formatErrorResponse`) 사용
   - 에러 코드 체계 일관성 유지
   - TypeBox 스키마는 `src/types/schemas.ts`에 통합

4. **테스트 협업**:
   - 각 에이전트는 자신의 모듈에 대한 단위 테스트 작성
   - 통합 테스트는 마지막에 협업하여 작성

5. **코드 리뷰**:
   - 주요 변경사항(인증 로직, 보안 관련)은 상호 검토 필요

## 현재 구현 상태 확인
- ✅ 인증 기본 기능 (회원가입, 로그인, 로그아웃, 토큰 갱신, 비밀번호 재설정) 구현됨
- ⚠️ 이메일/휴대폰 인증 미구현 (핸들러는 있으나 실제 메일/SMS 발송 로직 필요)
- ✅ 사용자 프로필 API 완전 구현 (조회/수정 포함)
- ✅ 주소록 API 완전 구현 (CRUD 모든 기능)
- ✅ 알림 API 완전 구현 (실시간 WebSocket 포함)
- ✅ 파일 업로드 API 완전 구현 (업로드/삭제/이미지 처리)

## 시작 전 체크리스트
- [ ] Prisma 마이그레이션 파일 준비 (`Address`, `Notification`, `UploadedFile` 테이블)
- [ ] 환경 변수 설정 (.env): JWT_SECRET, 이메일/SMS 서비스 키, 파일 저장소 설정
- [ ] 기존 인증 코드 검토 및 확장 계획 수립
- [ ] 테스트 데이터베이스 구성