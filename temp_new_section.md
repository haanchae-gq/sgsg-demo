### 2. 서비스 카탈로그 (Service Catalog)

#### `service_categories` - 서비스 대분류 (Level 1)
**계층 구조**: 서비스의 최상위 분류 (예: "설치/시공", "클리닝", "막힘해결")

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| code | String @unique | 고유 | 2자리 숫자 코드 (예: "04") |
| name | String @unique | 고유 | 대분류명 (한글) |
| description | String? | 선택 | 카테고리 설명 |
| displayOrder | Int @default(0) @map("display_order") | 기본값 | 표시 순서 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**비즈니스 규칙**:
- `code`는 2자리 숫자로 자동 생성, 수정 불가
- `displayOrder`로 프론트엔드 표시 순서 제어
- `isActive = false`인 경우 숨김 처리

#### `service_subcategories` - 서비스 중분류 (Level 2)
**계층 구조**: 대분류 하위의 중간 분류 (예: "에어컨", "세탁기", "냉장고")

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| categoryId | String @map("category_id") | FK(service_categories) | 상위 대분류 참조 |
| code | String | 고유 | 4자리 숫자 코드 (예: "0401") |
| name | String | 필수 | 중분류명 (한글) |
| description | String? | 선택 | 중분류 설명 |
| membershipAvailable | Boolean @default(false) @map("membership_available") | 기본값 | 멤버십 적용 가능 여부 |
| displayOrder | Int @default(0) @map("display_order") | 기본값 | 표시 순서 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**비즈니스 규칙**:
- `code`는 상위 대분류 코드 + 2자리 숫자 (예: "04" + "01" = "0401")
- `membershipAvailable = true`인 경우 멤버십 배정 로직에서 우선 배정 대상
- 중분류 단위로 멤버십 가입 관리

#### `service_items` - 서비스 소분류 (Level 3)
**계층 구조**: 중분류 하위의 구체적 서비스 (예: "에어컨 설치", "에어컨 청소")

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| subcategoryId | String @map("subcategory_id") | FK(service_subcategories) | 상위 중분류 참조 |
| code | String | 고유 | 6자리 숫자 코드 (예: "040101") |
| name | String | 필수 | 서비스 항목명 |
| description | String? | 선택 | 서비스 설명 |
| displayOrder | Int @default(0) @map("display_order") | 기본값 | 표시 순서 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**비즈니스 규칙**:
- `code`는 상위 중분류 코드 + 2자리 숫자 (예: "0401" + "01" = "040101")
- 주문 생성 시 필수 선택 단위
- 기본비용, 현장비용, 수수료 설정 가능한 최소 단위

#### `service_item_prices` - 서비스 기본비용 관리
**가격 이력**: 소분류별 기본 가격 및 단위 정보

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| serviceItemId | String @map("service_item_id") | FK(service_items) | 서비스 소분류 참조 |
| basePrice | Float @map("base_price") | 필수 | 기본 가격 |
| unitType | UnitType @map("unit_type") | 필수 | 단위 타입 (EA, 면적, 시간 등) |
| minPrice | Float? @map("min_price") | 선택 | 최소 금액 |
| vatIncluded | Boolean @default(true) @map("vat_included") | 기본값 | VAT 포함 여부 |
| effectiveStartDate | DateTime @map("effective_start_date") | 필수 | 적용 시작일 |
| effectiveEndDate | DateTime? @map("effective_end_date") | 선택 | 적용 종료일 (신규 가격 생성 시 자동 설정) |
| priceVersion | Int @default(1) @map("price_version") | 기본값 | 가격 버전 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| createdBy | String @map("created_by") | FK(users) | 생성자 |

**열거형**:
```prisma
enum UnitType {
  EA      // 개수
  AREA    // 면적 (㎡)
  TIME    // 시간
  METER   // 미터
  SET     // 세트
}
```

**비즈니스 규칙**:
- 동일 `serviceItemId`에 대해 `effectiveStartDate` 중복 불가
- 신규 가격 생성 시 기존 가격의 `effectiveEndDate` 자동 설정
- `priceVersion`은 `serviceItemId`별로 증가
- 주문 생성 시점의 활성 가격을 스냅샷으로 저장

#### `on_site_fee_categories` - 현장비용 카테고리 마스터
**마스터 데이터**: 모든 현장비용 항목 정의

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| code | String @unique | 고유 | 현장비용 코드 |
| name | String | 필수 | 현장비용명 |
| description | String? | 선택 | 설명 |
| feeType | FeeType @map("fee_type") | 필수 | 과금 방식 |
| baseAmount | Float @map("base_amount") | 필수 | 기본 금액 |
| vatIncluded | Boolean @default(true) @map("vat_included") | 기본값 | VAT 포함 여부 |
| settlementIncluded | Boolean @default(true) @map("settlement_included") | 기본값 | 정산 반영 여부 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**열거형**:
```prisma
enum FeeType {
  FIXED       // 고정금액
  UNIT_BASED  // 단가 × 수량
}
```

**비즈니스 규칙**:
- `feeType = UNIT_BASED`인 경우 수량 입력 필요
- `settlementIncluded = false`인 경우 플랫폼 수익으로만 처리, 전문가 정산 제외

#### `service_category_on_site_fee_mappings` - 서비스-현장비용 매핑
**매핑 관계**: 서비스 카테고리(중분류/소분류)와 현장비용 카테고리 연결

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| serviceCategoryId | String @map("service_category_id") | FK(service_subcategories 또는 service_items) | 서비스 카테고리 참조 |
| serviceCategoryType | ServiceCategoryType @map("service_category_type") | 필수 | 서비스 카테고리 타입 (SUBCATEGORY, ITEM) |
| onSiteFeeCategoryId | String @map("on_site_fee_category_id") | FK(on_site_fee_categories) | 현장비용 카테고리 참조 |
| mappingLevel | MappingLevel @default(LEVEL2) @map("mapping_level") | 기본값 | 매핑 레벨 (중분류/소분류) |
| isRequired | Boolean @default(false) @map("is_required") | 기본값 | 필수 여부 |
| maxQuantity | Int? @map("max_quantity") | 선택 | 최대 수량 제한 |
| effectiveStartDate | DateTime @map("effective_start_date") | 필수 | 적용 시작일 |
| effectiveEndDate | DateTime? @map("effective_end_date") | 선택 | 적용 종료일 |
| mappingVersion | Int @default(1) @map("mapping_version") | 기본값 | 매핑 버전 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| createdBy | String @map("created_by") | FK(users) | 생성자 |

**열거형**:
```prisma
enum ServiceCategoryType {
  SUBCATEGORY  // 중분류
  ITEM         // 소분류
}

enum MappingLevel {
  LEVEL2  // 중분류 기준 매핑
  LEVEL3  // 소분류 기준 매핑
}
```

**비즈니스 규칙**:
- `serviceCategoryType` + `serviceCategoryId` + `onSiteFeeCategoryId` 중복 불가
- 우선순위: 소분류 매핑 > 중분류 매핑
- 신규 매핑 생성 시 기존 매핑 종료일 자동 설정

#### `service_category_extra_fields` - 서비스 추가입력항목
**동적 필드**: 서비스 카테고리별 추가 입력 필드 정의

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| serviceCategoryId | String @map("service_category_id") | FK(service_subcategories 또는 service_items) | 서비스 카테고리 참조 |
| serviceCategoryType | ServiceCategoryType @map("service_category_type") | 필수 | 서비스 카테고리 타입 (SUBCATEGORY, ITEM) |
| fieldKey | String | 필수 | 필드 키 (영문/숫자 조합) |
| label | String | 필수 | 표시명 (한글) |
| fieldType | FieldType @map("field_type") | 필수 | 필드 타입 |
| options | Json? @default("[]") | 선택 | SELECT 타입 옵션 목록 |
| isRequired | Boolean @default(false) @map("is_required") | 기본값 | 필수 여부 |
| displayLocation | DisplayLocation @default(BOTH) @map("display_location") | 기본값 | 노출 위치 |
| sortOrder | Int @default(0) @map("sort_order") | 기본값 | 정렬 순서 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**열거형**:
```prisma
enum FieldType {
  TEXT
  NUMBER
  DATE
  SELECT
  CHECKBOX
  RADIO
}

enum DisplayLocation {
  ORDER_BACKOFFICE_ONLY  // 주문관리 백오피스만
  EXPERT_APP_ONLY        // 전문가웹앱만
  BOTH                   // 모두
}
```

**비즈니스 규칙**:
- `fieldKey`는 서비스 카테고리 내 고유, 수정 불가
- `fieldType = SELECT`인 경우 `options` 필수
- 중분류 필드는 하위 소분류에 상속 적용 (소분류에서 오버라이드 가능)

#### `service_category_channel_commissions` - 채널별 수수료 설정
**채널 수수료**: 소분류별 채널 수수료 정책

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| serviceItemId | String @map("service_item_id") | FK(service_items) | 서비스 소분류 참조 |
| channelCode | String @map("channel_code") | 필수 | 채널 코드 |
| commissionType | CommissionType @map("commission_type") | 필수 | 수수료 타입 |
| commissionValue | Float @map("commission_value") | 필수 | 수수료 값 |
| vatBasis | VatBasis @default(INCLUDED) @map("vat_basis") | 기본값 | VAT 기준 |
| effectiveStartDate | DateTime @map("effective_start_date") | 필수 | 적용 시작일 |
| effectiveEndDate | DateTime? @map("effective_end_date") | 선택 | 적용 종료일 |
| commissionVersion | Int @default(1) @map("commission_version") | 기본값 | 수수료 버전 |
| isActive | Boolean @default(true) @map("is_active") | 기본값 | 활성화 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| createdBy | String @map("created_by") | FK(users) | 생성자 |

**열거형**:
```prisma
enum CommissionType {
  RATE   // 퍼센트 수수료
  FIXED  // 고정 수수료
}

enum VatBasis {
  INCLUDED  // VAT 포함 기준
  EXCLUDED  // VAT 제외 기준
}
```

**비즈니스 규칙**:
- 동일 `serviceItemId` + `channelCode` + `effectiveStartDate` 중복 불가
- `commissionType = RATE`일 경우 0 ≤ `commissionValue` ≤ 100
- 신규 수수료 생성 시 기존 수수료 종료일 자동 설정

#### `expert_service_mapping` - 전문가-서비스 매핑
**다대다 관계**: 전문가가 제공하는 서비스와 가격 설정

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String @id @default(cuid()) | PK | 고유 식별자 |
| expertId | String @map("expert_id") | FK(experts) | 전문가 참조 |
| serviceItemId | String @map("service_item_id") | FK(service_items) | 서비스 소분류 참조 |
| customPrice | Float? @map("custom_price") | 선택 | 전문가별 커스텀 가격 |
| isAvailable | Boolean @default(true) @map("is_available") | 기본값 | 제공 가능 여부 |
| createdAt | DateTime @default(now()) @map("created_at") | 기본값 | 생성 시간 |
| updatedAt | DateTime @default(now()) @updatedAt @map("updated_at") | 기본값 | 수정 시간 |

**비즈니스 규칙**:
- `expertId` + `serviceItemId` 복합 유니크 제약
- `customPrice`가 NULL인 경우 `service_item_prices.basePrice` 사용
- `isAvailable = false`인 경우 해당 서비스 제공 불가