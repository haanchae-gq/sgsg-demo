# 서비스 카탈로그 API 문서

이 문서는 세션 3에서 구현된 서비스 카탈로그 API에 대한 설명입니다.

## API 개요

서비스 카탈로그 API는 2계층 구조로 구성되어 있습니다:
- **서비스 카테고리 (ServiceCategory)**: 대분류 (예: 청소 서비스, 집수리 서비스, 이사 서비스)
- **서비스 항목 (ServiceItem)**: 구체적인 서비스 (예: 정기 청소, 대청소, 싱크대 수리)

## 엔드포인트 목록

### 1. 서비스 카테고리 관련 API

#### GET /api/v1/services/categories
전체 서비스 카테고리 목록을 조회합니다.

**쿼리 파라미터:**
- `page` (선택, 기본값: 1): 페이지 번호
- `limit` (선택, 기본값: 20): 페이지 크기 (최대 100)
- `isActive` (선택): 활성 상태 필터링
- `search` (선택): 검색어 (이름, 설명, slug에서 검색)
- `includeItems` (선택): 하위 서비스 항목 포함 여부

**응답 예시:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "cl1",
      "name": "청소 서비스",
      "slug": "cleaning",
      "description": "가정 및 사무실 청소 서비스",
      "iconUrl": null,
      "displayOrder": 1,
      "isActive": true,
      "metadata": {},
      "createdAt": "2026-03-01T13:59:01.907Z",
      "updatedAt": "2026-03-01T13:59:01.907Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

#### GET /api/v1/services/categories/:categoryId
특정 서비스 카테고리의 상세 정보를 조회합니다.

**경로 파라미터:**
- `categoryId`: 카테고리 ID

**쿼리 파라미터:**
- `includeItems` (선택): 하위 서비스 항목 포함 여부

#### GET /api/v1/services/categories/tree
전체 카테고리를 하위 항목과 함께 트리 구조로 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "Category tree retrieved successfully",
  "data": [
    {
      "id": "cl1",
      "name": "청소 서비스",
      "slug": "cleaning",
      "description": "가정 및 사무실 청소 서비스",
      "displayOrder": 1,
      "isActive": true,
      "items": [
        {
          "id": "it1",
          "name": "정기 청소",
          "description": "주 1-2회 정기적인 가정 청소",
          "basePrice": 150000,
          "displayOrder": 1,
          "isActive": true
        }
      ]
    }
  ]
}
```

#### GET /api/v1/services/categories/:categoryId/items
특정 카테고리에 속한 서비스 항목 목록을 조회합니다.

**경로 파라미터:**
- `categoryId`: 카테고리 ID

**쿼리 파라미터:**
- `page` (선택, 기본값: 1): 페이지 번호
- `limit` (선택, 기본값: 20): 페이지 크기
- `isActive` (선택): 활성 상태 필터링
- `search` (선택): 검색어
- `priceRange.min` (선택): 최소 가격
- `priceRange.max` (선택): 최대 가격

### 2. 서비스 항목 관련 API

#### GET /api/v1/services/items
전체 서비스 항목 목록을 조회합니다.

**쿼리 파라미터:**
- `page` (선택, 기본값: 1): 페이지 번호
- `limit` (선택, 기본값: 20): 페이지 크기
- `isActive` (선택): 활성 상태 필터링
- `search` (선택): 검색어
- `categoryId` (선택): 카테고리 ID로 필터링
- `priceRange.min` (선택): 최소 가격
- `priceRange.max` (선택): 최대 가격

**응답 예시:**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [
    {
      "id": "it1",
      "categoryId": "cl1",
      "name": "정기 청소",
      "description": "주 1-2회 정기적인 가정 청소",
      "basePrice": 150000,
      "estimatedTime": null,
      "requirements": [],
      "images": [],
      "isActive": true,
      "displayOrder": 1,
      "metadata": {},
      "createdAt": "2026-03-01T13:59:09.023Z",
      "updatedAt": "2026-03-01T13:59:09.023Z",
      "category": {
        "id": "cl1",
        "name": "청소 서비스",
        "slug": "cleaning"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### GET /api/v1/services/items/:itemId
특정 서비스 항목의 상세 정보를 조회합니다.

**경로 파라미터:**
- `itemId`: 서비스 항목 ID

#### GET /api/v1/services/items/:itemId/experts
특정 서비스 항목을 제공하는 전문가 목록을 조회합니다.

**경로 파라미터:**
- `itemId`: 서비스 항목 ID

**쿼리 파라미터:**
- `page` (선택, 기본값: 1): 페이지 번호
- `limit` (선택, 기본값: 20): 페이지 크기

## 구현된 기능

### ✅ 완료된 기능
1. **서비스 카테고리 CRUD API**: 대분류 조회, 상세 조회, 트리 구조 조회
2. **서비스 항목 CRUD API**: 소분류 조회, 상세 조회, 카테고리별 조회
3. **검색 및 필터링**: 이름, 설명 검색, 가격 범위 필터링, 활성 상태 필터링
4. **페이지네이션**: 모든 목록 API에서 페이지네이션 지원
5. **관계형 데이터**: 카테고리와 항목 간의 관계 정보 포함
6. **에러 핸들링**: 일관된 에러 응답 형식
7. **서비스 로직 분리**: Service 레이어와 Handler 레이어 분리
8. **타입 안정성**: TypeScript와 TypeBox를 통한 타입 검증

### 🔄 시연 가능한 사용 사례
1. **카테고리 목록 조회**: `GET /api/v1/services/categories`
2. **카테고리별 서비스 조회**: `GET /api/v1/services/categories/cl1/items`
3. **전체 서비스 트리 조회**: `GET /api/v1/services/categories/tree`
4. **서비스 검색**: `GET /api/v1/services/items?search=청소`
5. **가격 필터링**: `GET /api/v1/services/items?priceRange.min=100000&priceRange.max=200000`

### 📊 샘플 데이터
데이터베이스에 다음 샘플 데이터가 포함되어 있습니다:

**카테고리:**
- 청소 서비스 (cleaning)
- 집수리 서비스 (home-repair)
- 이사 서비스 (moving)

**서비스 항목:**
- 정기 청소 (150,000원)
- 대청소 (300,000원)
- 싱크대 수리 (80,000원)
- 콘센트 설치 (50,000원)
- 소형 이사 (120,000원)

## 기술 스택

- **백엔드**: Fastify + TypeScript
- **ORM**: Prisma 7 with PostgreSQL adapter
- **검증**: TypeBox (JSON Schema 기반)
- **데이터베이스**: PostgreSQL
- **아키텍처**: 서비스 레이어 패턴

## 향후 확장 가능 기능

### 🔜 원래 계획했던 3계층 구조
현재는 2계층 구조 (Category → Item)로 구현되었지만, 원래 계획은 3계층 구조였습니다:
- 대분류 (ServiceCategory)
- 중분류 (ServiceSubcategory) - 미구현
- 소분류 (ServiceItem)

### 🔜 추가 연계 API (계획된 기능)
1. **가격 정보 API**: `GET /api/v1/services/items/:itemId/prices`
2. **현장비용 API**: `GET /api/v1/services/items/:itemId/on-site-fees`
3. **추가 입력 항목 API**: `GET /api/v1/services/items/:itemId/extra-fields`
4. **채널별 수수료 API**: `GET /api/v1/services/items/:itemId/channel-commissions` (관리자 전용)
5. **멤버십 정보 API**: `GET /api/v1/services/subcategories/:subcategoryId/membership-info`

## API 테스트

### 서버 실행
```bash
cd sgsg-api
npm run dev
```

### 테스트 명령어 예시
```bash
# 카테고리 목록 조회
curl http://localhost:4000/api/v1/services/categories

# 특정 카테고리 상세 조회 (하위 항목 포함)
curl http://localhost:4000/api/v1/services/categories/cl1?includeItems=true

# 전체 트리 구조 조회
curl http://localhost:4000/api/v1/services/categories/tree

# 서비스 항목 목록 조회
curl http://localhost:4000/api/v1/services/items

# 가격 필터링으로 서비스 검색
curl "http://localhost:4000/api/v1/services/items?priceRange.min=100000&priceRange.max=200000"
```