# 세션 2: 전문가 관리 기본 API (전문가 측)

## 세션 개요
이 세션은 전문가(Expert) 사용자를 위한 관리 기능을 구현합니다. 전문가 프로필 관리, 서비스 매핑, 스케줄 관리, 주문 목록 조회, 정산 내역, 서브 계정 관리, 멤버십 정보, 배정 이력, 패널티 상태 등을 포함합니다.

**우선순위**: P1 (인증 후 다음)  
**예상 작업 시간**: 4-5일  
**의존성**: 세션 1 (인증)  
**다중 에이전트 작업 가능**: 예 (2개 하위 모듈로 분할 가능)

## 구현할 API 엔드포인트

### 전문가 관리 API (`/api/v1/experts`)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/experts/me` | 전문가 프로필 조회 | Expert | ✅ 구현됨 |
| PUT | `/experts/me` | 전문가 프로필 수정 | Expert | ⚠️ 타입 문제 (수정 필요) |
| GET | `/experts/me/services` | 전문가 서비스 매핑 조회 | Expert | ⚠️ TODO 필요 |
| POST | `/experts/me/services` | 서비스 매핑 추가 | Expert | ⚠️ TODO 필요 |
| PUT | `/experts/me/services/:mappingId` | 서비스 매핑 수정 | Expert | ⚠️ TODO 필요 |
| DELETE | `/experts/me/services/:mappingId` | 서비스 매핑 삭제 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/schedule` | 스케줄 조회 | Expert | ⚠️ TODO 필요 |
| POST | `/experts/me/schedule` | 스케줄 추가 | Expert | ⚠️ TODO 필요 |
| PUT | `/experts/me/schedule/:scheduleId` | 스케줄 수정 | Expert | ⚠️ TODO 필요 |
| DELETE | `/experts/me/schedule/:scheduleId` | 스케줄 삭제 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/orders` | 전문가 주문 목록 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/settlements` | 정산 내역 조회 | Expert | ⚠️ TODO 필요 |
| POST | `/experts/me/sub-accounts` | 서브 계정 생성 | Expert (마스터만) | ⚠️ TODO 필요 |
| GET | `/experts/me/sub-accounts` | 서브 계정 목록 조회 | Expert (마스터만) | ⚠️ TODO 필요 |
| PUT | `/experts/me/sub-accounts/:subAccountId` | 서브 계정 수정 | Expert (마스터만) | ⚠️ TODO 필요 |
| GET | `/experts/me/membership` | 멤버십 정보 조회 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/assignment-history` | 배정 이력 조회 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/penalties` | 패널티 상태 조회 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/daily-assignment-limit` | 일일 배정 상한 조회 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/statistics` | 통계 요약 조회 | Expert | ⚠️ TODO 필요 |
| GET | `/experts/me/audit-logs` | 변경 이력 조회 | Expert | ⚠️ TODO 필요 |

## 필요한 데이터베이스 테이블/마이그레이션
### 이미 존재하는 테이블 (Prisma schema 확인)
- `Expert` - 전문가 기본 정보 (확장 필요)
- `ExpertServiceMapping` - 전문가-서비스 매핑
- `ServiceSchedule` - 서비스 스케줄
- `SubAccount` - 서브 계정
- `MasterMembership` - 마스터 계정 멤버십
- `PenaltyHistory` - 패널티 이력
- `AssignmentHistory` - 배정 이력
- `Settlement` - 정산
- `SettlementDetail` - 정산 상세

### 필요한 마이그레이션
1. `Expert` 테이블 확장: 전문가 관리 확장 필드 추가 (accountType, approvalStatus, activeStatus 등)
2. `ExpertServiceMapping` 테이블 검증: 필드 구성 확인
3. `ServiceSchedule` 테이블 검증: 전문가 스케줄 관리 필드 확인
4. 관계 설정: 전문가 ↔ 서브 계정, 전문가 ↔ 멤버십, 전문가 ↔ 패널티 이력

## 의존성
### 내부 의존성
- **세션 1 (인증)**: JWT 인증, 사용자 역할(Expert) 검증
- **세션 3 (서비스 카탈로그)**: 서비스 조회 (의존성 낮음 - 별도 작업 가능)
- **Prisma 클라이언트**: 데이터베이스 접근

### 외부 의존성
- 없음 (모든 데이터 내부 처리)

## 테스트 시나리오
### 단위 테스트
1. `ExpertService` 단위 테스트: 전문가 프로필 CRUD, 서비스 매핑 관리
2. `ScheduleService` 단위 테스트: 스케줄 관리
3. `SubAccountService` 단위 테스트: 서브 계정 생성/관리
4. `MembershipService` 단위 테스트: 멤버십 정보 조회
5. `AssignmentService` 단위 테스트: 배정 이력 조회
6. `PenaltyService` 단위 테스트: 패널티 상태 조회

### 통합 테스트 (E2E)
1. 전문가 등록 → 프로필 수정 → 서비스 매핑 전체 흐름
2. 서브 계정 생성 및 관리
3. 스케줄 관리 및 주문 배정 시나리오
4. 멤버십 정보 조회 및 패널티 상태 확인

## 예상 작업 시간
| 작업 항목 | 예상 시간 | 담당자 |
|-----------|-----------|--------|
| 전문가 프로필 API (조회/수정) | 1일 | 에이전트 1 |
| 서비스 매핑 API (CRUD) | 0.5일 | 에이전트 1 |
| 스케줄 관리 API (CRUD) | 1일 | 에이전트 2 |
| 서브 계정 관리 API (CRUD) | 1일 | 에이전트 1 |
| 멤버십/배정/패널티/통계 조회 API | 1일 | 에이전트 2 |
| 테스트 작성 및 검증 | 0.5일 | 에이전트 1,2 |

**총 예상 시간**: 4-5일 (병렬 작업 가능)

## 다중 에이전트 작업을 위한 특별 지침
1. **작업 분할**: 
   - 에이전트 1: 전문가 프로필, 서비스 매핑, 서브 계정 관리
   - 에이전트 2: 스케줄 관리, 멤버십/배정/패널티/통계 조회 API
   
2. **공유 리소스**:
   - `src/routes/v1/experts/`: 라우트 구조 협의
   - `src/services/expert.service.ts`: 서비스 로직 분리 가능
   - `prisma/schema.prisma`: 마이그레이션 시 순차적 적용 필요

3. **통합 포인트**:
   - 전문가 역할 검증 미들웨어: `src/plugins/auth.ts`의 `requireExpert` 플러그인 활용
   - 응답 형식 일관성 유지
   - 에러 코드 체계: `EXPERT_001`, `EXPERT_002` 등 전문가 관련 코드 사용

4. **테스트 협업**:
   - 각 에이전트는 자신의 모듈에 대한 단위 테스트 작성
   - 통합 테스트: 전문가 시나리오 전체 흐름 (협업 필요)

5. **코드 리뷰**:
   - 복잡한 비즈니스 로직(서브 계정, 멤버십)은 상호 검토 필요

## 현재 구현 상태 확인
- ✅ 전문가 핸들러와 스키마 구현됨
- ✅ 전문가 서비스 로직 구현됨 (ExpertService 클래스)
- ⚠️ 전문가 프로필 수정 API 타입 문제로 테스트 실패 (request.body 타입 불일치)
- ⚠️ 서비스 매핑, 스케줄, 서브 계정 등 일부 기능 구현되었으나 테스트 필요

## 시작 전 체크리스트
- [ ] Prisma 스키마 검토 및 필요한 확장 필드 확인
- [ ] 기존 `Expert` 모델과 관리 확장 필드 매핑 전략 수립
- [ ] 전문가 역할 검증 미들웨어 테스트
- [ ] 테스트 전문가 계정 생성
- [ ] 세션 1 (인증) 완료 여부 확인