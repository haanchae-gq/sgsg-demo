# 세션 3: 서비스 카탈로그 공개 API

## 세션 개요
이 세션은 3계층 서비스 카탈로그 시스템을 위한 공개 API를 구현합니다. 대분류(Level 1) → 중분류(Level 2) → 소분류(Level 3) 계층적 구조로 서비스를 조회할 수 있으며, 인증 없이 접근 가능한 공개 API입니다.

**우선순위**: P1 (인증과 병행 가능)  
**예상 작업 시간**: 3-4일  
**의존성**: 없음 (독립적)  
**다중 에이전트 작업 가능**: 예 (3계층별로 분할 가능)

## 구현할 API 엔드포인트

### 1. 대분류 (Service Categories - Level 1)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/services/categories` | 대분류 목록 조회 (트리 구조 포함) | Public | ⚠️ TODO 필요 |
| GET | `/services/categories/:categoryId` | 대분류 상세 정보 | Public | ⚠️ TODO 필요 |
| GET | `/services/categories/:categoryId/subcategories` | 해당 대분류의 중분류 목록 | Public | ⚠️ TODO 필요 |

### 2. 중분류 (Service Subcategories - Level 2)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/services/subcategories` | 중분류 목록 조회 (필터링 가능) | Public | ⚠️ TODO 필요 |
| GET | `/services/subcategories/:subcategoryId` | 중분류 상세 정보 | Public | ⚠️ TODO 필요 |
| GET | `/services/subcategories/:subcategoryId/items` | 해당 중분류의 소분류 목록 | Public | ⚠️ TODO 필요 |
| GET | `/services/subcategories/:subcategoryId/membership-info` | 멤버십 적용 정보 조회 | Public | ⚠️ TODO 필요 |

### 3. 소분류 (Service Items - Level 3)
| 메서드 | 엔드포인트 | 설명 | 권한 | 구현 상태 |
|--------|------------|------|------|-----------|
| GET | `/services/items` | 소분류 목록 조회 (필터링 가능) | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId` | 소분류 상세 정보 | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId/prices` | 소분류 가격 정보 조회 | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId/on-site-fees` | 소분류 현장비용 항목 조회 | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId/extra-fields` | 소분류 추가입력항목 조회 | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId/experts` | 해당 서비스 제공 전문가 목록 | Public | ⚠️ TODO 필요 |
| GET | `/services/items/:itemId/channel-commissions` | 채널별 수수료 정보 조회 | Admin | ⚠️ TODO 필요 |

## 필요한 데이터베이스 테이블/마이그레이션
### 이미 존재하는 테이블 (Prisma schema 확인)
- `ServiceCategory` - 대분류 (Level 1)
- `ServiceSubcategory` - 중분류 (Level 2)
- `ServiceItem` - 소분류 (Level 3)
- `ServiceItemPrice` - 소분류 가격 정보
- `OnSiteFeeCategory` - 현장비용 카테고리
- `ServiceCategoryOnSiteFeeMapping` - 서비스-현장비용 매핑
- `ServiceCategoryExtraField` - 서비스 추가입력항목
- `ServiceCategoryChannelCommission` - 채널별 수수료

### 필요한 마이그레이션
1. 계층적 관계 설정: `ServiceCategory` ↔ `ServiceSubcategory` ↔ `ServiceItem`
2. 인덱스 최적화: 조회 성능을 위한 인덱스 추가
3. 캐싱 전략: Redis 캐시 적용을 위한 필드 구성

## 의존성
### 내부 의존성
- **Prisma 클라이언트**: 데이터베이스 접근
- **캐시 레이어**: Redis (선택적 - 성능 최적화용)

### 외부 의존성
- 없음 (모든 데이터 내부 처리)

## 테스트 시나리오
### 단위 테스트
1. `CategoryService` 단위 테스트: 대분류 조회, 트리 구조 생성
2. `SubcategoryService` 단위 테스트: 중분류 조회, 필터링
3. `ItemService` 단위 테스트: 소분류 조회, 가격/현장비용/추가입력항목 연계
4. `CatalogCacheService` 단위 테스트: 캐싱 로직

### 통합 테스트 (E2E)
1. 대분류 → 중분류 → 소분류 계층적 조회 전체 흐름
2. 필터링 기능 테스트 (카테고리, 가격 범위, 지역 등)
3. 멤버십 정보 조회 통합 테스트
4. 전문가 목록 조회 통합 테스트

## 예상 작업 시간
| 작업 항목 | 예상 시간 | 담당자 |
|-----------|-----------|--------|
| 대분류 API 구현 (Level 1) | 1일 | 에이전트 1 |
| 중분류 API 구현 (Level 2) | 1일 | 에이전트 2 |
| 소분류 API 구현 (Level 3) | 1.5일 | 에이전트 1 |
| 가격/현장비용/추가입력항목 연계 | 0.5일 | 에이전트 2 |
| 캐싱 및 성능 최적화 | 0.5일 | 에이전트 1 |
| 테스트 작성 및 검증 | 0.5일 | 에이전트 1,2 |

**총 예상 시간**: 3-4일 (병렬 작업 가능)

## 다중 에이전트 작업을 위한 특별 지침
1. **작업 분할**: 
   - 에이전트 1: 대분류 API + 소분류 API (계층 구조 주력)
   - 에이전트 2: 중분류 API + 연계 정보(가격/현장비용/추가입력항목)
   
2. **공유 리소스**:
   - `src/routes/v1/services/`: 라우트 구조 협의
   - `src/services/catalog.service.ts`: 서비스 로직 분리 가능
   - 공통 유틸리티: 계층적 트리 구성 함수

3. **통합 포인트**:
   - 계층적 데이터 구조 일관성: `parentId` 기반 트리 구성
   - 응답 형식: 계층별 일관된 구조 유지
   - 에러 코드 체계: `CATALOG_001`, `CATALOG_002` 등 카탈로그 관련 코드 사용

4. **테스트 협업**:
   - 각 에이전트는 자신의 계층에 대한 단위 테스트 작성
   - 통합 테스트: 3계층 전체 흐름 (협업 필요)

5. **성능 고려사항**:
   - 대량 데이터 조회 시 페이지네이션 필수
   - Redis 캐시 적용 고려 (자주 조회되는 카탈로그 데이터)
   - N+1 문제 방지를 위한 Prisma `include` 최적화

## 현재 구현 상태 확인
- ✅ 서비스 카탈로그 라우트와 핸들러 구현됨
- ✅ Prisma 스키마는 존재함 (ServiceCategory, ServiceSubcategory, ServiceItem 등)
- ✅ 라우트, 핸들러, 서비스 로직 구현됨 
- ⚠️ 테스트 설정 문제로 E2E 테스트 실패 (앱 인스턴스 close 에러)

## 시작 전 체크리스트
- [ ] Prisma 스키마 검토 및 계층적 관계 확인
- [ ] 샘플 카탈로그 데이터 준비 (테스트용)
- [ ] Redis 캐시 구성 확인 (선택적)
- [ ] 페이지네이션 및 필터링 요구사항 확인
- [ ] 성능 테스트 시나리오 준비