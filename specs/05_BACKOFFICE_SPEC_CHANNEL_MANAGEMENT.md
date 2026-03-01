# 채널 관리

← [서비스 관리 파트4](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART4.md) | [운영 및 시스템 관리](./05_BACKOFFICE_SPEC_OPERATIONS_SYSTEM.md) →

---

## 채널 관리

### 1. 신규 자사 채널 생성 - 시나리오 1
**UI 구성**: Ant Design Modal + Form

#### 상세 작업 흐름

1. 관리자 로그인  
   - Admin 권한을 가진 사용자가 백오피스에 로그인한다.
2. 메뉴 이동  
   - 상단 메뉴에서 "메뉴 08 채널관리"를 선택한다.
3. 채널 목록 화면 진입  
   - channel 목록 화면에서 "채널 생성" 버튼을 클릭한다.
4. 채널 유형 선택  
   - `channel_type`을 INTERNAL로 선택한다.
   - INTERNAL은 자사 채널을 의미한다.
5. 필수 입력값 입력  
   - **channel_code 입력**: 내부 식별 코드이며 중복 불가 값, 영문/숫자 조합 권장
   - **channel_name 입력**: 주문관리 및 전문가웹앱에 노출되는 공식 채널명, 중복 검증
   - **channel_status 확인**: 기본값은 ACTIVE로 설정
6. 제휴 전용 필드 검증  
   - `channel_type = INTERNAL` 이므로 partner_company_name 입력은 비활성 처리
   - 제휴 담당자 정보 필드는 입력 대상이 아님
7. 저장 버튼 클릭
8. 서버 유효성 검증  
   - `channel_code` 유일성 검증
   - `channel_name` 유일성 검증  
   - `channel_type` 값 유효성 검증
   - 필수값 누락 여부 검증
9. 저장 처리  
   - `channel_id` 자동 생성 (cuid)
   - `created_at` 자동 기록
   - `channel_status = ACTIVE` 저장
   - `sort_order` 자동 설정
10. 감사 로그 기록  
    - 작업자 ID
    - 작업 유형 = CREATE
    - 생성 `channel_id`
    - 생성 시각
11. 연동 영향 확인  
    - **주문관리 연동**: 신규 주문 생성 시 channel 선택 리스트에 해당 `channel_id` 포함, ACTIVE 상태이므로 주문 생성 허용
    - **서비스관리 연동**: 서비스관리 메뉴에서 채널 스코프 선택 시 해당 `channel_id` 선택 가능
    - **배정 로직 연동**: `channel_id`, `channel_type`이 배정 엔진에 전달되며, v1 기준 채널 무관 동일 배정 정책 적용
    - **전문가웹앱 연동**: 주문 생성 후 해당 채널 주문이 배정될 경우 전문가웹앱 주문 상세에서 `channel_name`과 `channel_type`만 노출

#### 예외 케이스 처리
- `channel_code` 중복 시: 저장 차단, "이미 사용 중인 channel_code입니다." 오류 반환
- `channel_name` 중복 시: 저장 차단, "이미 등록된 채널명입니다." 오류 반환
- 권한 부족 시: Admin 외 사용자 접근 시 생성 버튼 비노출, API 호출 시 권한 오류 반환

#### 최종 상태
- `channel_id` 생성 완료
- `channel_status = ACTIVE`
- 신규 주문 생성 가능
- 타 메뉴에서 참조 가능

---

### 2. 신규 제휴사 채널 생성 - 시나리오 2
**UI 구성**: Ant Design Modal + Form (추가 필드)

#### 상세 작업 흐름

1. 관리자 로그인
2. 메뉴 이동
3. 채널 목록 화면 진입
4. 채널 유형 선택  
   - `channel_type`을 PARTNER로 선택한다.
5. 필수 입력값 입력  
   - `channel_code`, `channel_name`, `partner_company_name` 필수 입력
   - `partner_contact_name`, `partner_contact_email`, `partner_contact_phone` 선택 입력
6. 제휴 담당자 정보 입력  
   - 이메일 형식 검증 (`partner_contact_email`)
   - 전화번호 형식 검증 (`partner_contact_phone`)
7. 저장 버튼 클릭
8. 서버 유효성 검증  
   - `channel_type = PARTNER`인 경우 `partner_company_name` 필수 검증
   - `partner_contact_email` 형식 검증
9. 저장 처리  
   - `channel_id` 생성
   - `channel_status = ACTIVE` 저장
   - `partner_*` 필드 저장
10. 감사 로그 기록
11. 연동 영향 확인  
    - **주문관리 연동**: 제휴사 채널로 생성된 주문은 배정 엔진에 `channel_type = PARTNER`로 전달되며, v1 기준 채널 무관 동일 배정 정책 적용
    - **정산 관리 연동**: 제휴사 수수료 정책 반영 가능

#### 비즈니스 규칙
- `channel_type = PARTNER`인 경우 `partner_company_name` 필수
- 제휴 담당자 정보는 선택 사항이지만, 제공 시 형식 검증 수행

---

### 3. 채널 기본 정보 수정 - 시나리오 3
**UI 구성**: Ant Design Form (읽기 전용 필드 구분)

#### 상세 작업 흐름

1. 관리자 로그인  
   - Admin 또는 수정 권한이 있는 운영자 로그인
2. 메뉴 이동
3. 채널 목록 조회  
   - `channel_name` 또는 `channel_code`로 수정 대상 채널 검색
4. 채널 상세 화면 진입  
   - 수정하려는 `channel_id` 클릭하여 상세 화면 이동
5. 수정 가능/불가 필드 정의  
   - **수정 가능 필드**:
     - `partner_company_name` (`channel_type = PARTNER`인 경우만)
     - `partner_contact_name`, `partner_contact_email`, `partner_contact_phone`
     - 내부 운영 메모 (`note`)
   - **수정 불가 필드**:
     - `channel_id`, `channel_code`, `channel_name`, `channel_type`, `created_at`
6. UI 처리 정책  
   - `channel_name`, `channel_code`, `channel_type`은 읽기 전용 필드로 표시
   - INTERNAL 채널일 경우 partner 관련 필드는 비노출 또는 비활성 처리
7. 수정 입력 수행  
   - PARTNER 채널: `partner_company_name`, 담당자 정보 수정 가능
   - INTERNAL 채널: `note` 필드만 수정 가능
8. 저장 버튼 클릭
9. 서버 유효성 검증  
   - `channel_id` 존재 여부 검증
   - 수정 불가 필드 변경 시도 여부 검증
   - `partner_email` 형식 검증
   - `channel_type = PARTNER`인 경우 `partner_company_name` 필수 여부 재검증
10. 저장 처리  
    - `channels` 테이블 UPDATE
    - `updated_at` 자동 갱신
    - `updated_by` 기록
11. 감사 로그 기록  
    - 작업 유형 = UPDATE
    - 변경 필드 목록 기록
    - 변경 전 값 / 변경 후 값 기록
    - 수정자 ID 및 시각 기록
12. 연동 영향 확인  
    - `channel_name`이 수정 불가이므로 기존 주문 및 신규 주문 모두 동일한 채널명 유지
    - 채널 코드 불변으로 주문 엑셀 업로드 매핑 영향 없음
    - `channel_id` 불변으로 서비스-채널 스코프 매핑 영향 없음
    - `channel_type` 불변으로 배정 분기 조건 영향 없음

#### 예외 케이스
- `channel_name` 수정 요청 API 호출 시: 400 오류 반환, "channel_name은 수정할 수 없습니다." 메시지
- `channel_type` 수정 요청 시: 400 오류 반환
- 권한 없는 사용자 수정 시: 403 오류 반환

---

### 4. 채널 ACTIVE → INACTIVE 전환 - 시나리오 4
**UI 구성**: Ant Design Table Action Button + Confirmation Modal

#### 상세 작업 흐름

1. 관리자 로그인
2. 메뉴 이동
3. 채널 목록 조회  
   - `channel_status = ACTIVE` 필터로 조회
   - 비활성 전환 대상 `channel_id` 검색
4. 채널 상세 화면 진입
5. 상태 전환 버튼 클릭  
   - "비활성화" 버튼 클릭
   - 확인 모달 표시: "정말로 이 채널을 비활성화하시겠습니까?"
6. 확인 모달 확인
7. 서버 유효성 검증  
   - `channel_id` 존재 여부
   - 현재 상태가 ACTIVE인지 확인
   - 연결된 활성 주문 존재 여부 확인
8. 상태 전환 처리  
   - `channel_status = INACTIVE`로 업데이트
   - `updated_at`, `updated_by` 기록
9. 감사 로그 기록  
   - 작업 유형 = STATUS_CHANGE
   - 변경 전 상태 = ACTIVE
   - 변경 후 상태 = INACTIVE
10. 연동 영향 확인  
    - **주문관리 연동**: 신규 주문 생성 시 채널 선택 리스트에서 제외
    - **서비스관리 연동**: 서비스-채널 스코프 설정 시 INACTIVE 채널 비활성화
    - **기존 주문 영향**: 이미 생성된 주문은 영향 없음 (스냅샷 유지)

#### 비즈니스 규칙
- `channelStatus = INACTIVE`인 경우 신규 주문 생성 불가
- 기존 주문은 변경 없음 (스냅샷 보존)
- 연결된 활성 주문이 있는 경우 상태 전환 불가 (확인 모달에 경고)

---

### 5. 채널 INACTIVE → ACTIVE 전환 - 시나리오 5
**UI 구성**: Ant Design Table Action Button + Confirmation Modal

#### 상세 작업 흐름

1. 관리자 로그인
2. 메뉴 이동
3. 채널 목록 조회  
   - `channel_status = INACTIVE` 필터로 조회
   - 활성화 대상 `channel_id` 검색
4. 채널 상세 화면 진입
5. 상태 전환 버튼 클릭  
   - "활성화" 버튼 클릭
   - 확인 모달 표시: "정말로 이 채널을 활성화하시겠습니까?"
6. 확인 모달 확인
7. 서버 유효성 검증  
   - `channel_id` 존재 여부
   - 현재 상태가 INACTIVE인지 확인
8. 상태 전환 처리  
   - `channel_status = ACTIVE`로 업데이트
   - `updated_at`, `updated_by` 기록
9. 감사 로그 기록  
   - 작업 유형 = STATUS_CHANGE
   - 변경 전 상태 = INACTIVE
   - 변경 후 상태 = ACTIVE
10. 연동 영향 확인  
    - **주문관리 연동**: 신규 주문 생성 시 채널 선택 리스트에 포함
    - **서비스관리 연동**: 서비스-채널 스코프 설정 시 ACTIVE 채널로 표시

#### 비즈니스 규칙
- `channelStatus = ACTIVE`인 경우 신규 주문 생성 가능
- 상태 전환은 Admin 권한 필요

---

### 6. 채널 목록 조회 및 필터 검색 - 시나리오 6
**UI 구성**: Ant Design Table (검색, 필터, 페이지네이션)

#### 상세 작업 흐름

1. 관리자 로그인  
   - Admin 또는 채널 조회 권한을 가진 운영자가 백오피스에 로그인한다.
2. 메뉴 이동  
   - 상단 메뉴에서 "메뉴 09 채널관리"를 선택한다.
3. 채널 목록 기본 조회  
   - 채널관리 첫 진입 시 channel 목록이 기본 조건으로 조회된다.
   - 기본 정렬은 created_at DESC 또는 sort_order ASC 정책 중 하나로 고정한다.
   - 기본 필터는 channel_status = ALL 로 설정한다.
4. 목록 컬럼 구성 확인  
   - 화면에는 channel_id, channel_code, channel_name, channel_type(INTERNAL/PARTNER), channel_status(ACTIVE/INACTIVE), partner_company_name(PARTNER 채널일 경우), created_at, updated_at 정보가 컬럼으로 표시된다.
5. 검색 조건 입력  
   - 상단 검색 영역에서 키워드(channel_name 또는 channel_code 부분 일치), 채널 유형(ALL/INTERNAL/PARTNER), 상태(ALL/ACTIVE/INACTIVE), 생성일 기간, 제휴사명(PARTNER 채널만 대상) 필터를 설정할 수 있다.
6. 검색 실행  
   - "검색" 버튼 클릭 시 현재 조건으로 서버에 조회 요청을 보낸다.
   - 서버는 WHERE 절에 조건들을 조합하여 필터링하고 페이지네이션을 적용한다.
7. 검색 결과 표시  
   - 필터 적용 결과를 목록으로 출력하며 상단에 "총 N건"을 표시한다.
   - 페이지네이션을 적용하며 기본 page_size는 20 또는 50으로 설정한다.
8. 정렬 변경  
   - 컬럼 헤더를 클릭하여 created_at, updated_at, channel_name, channel_type, channel_status 기준으로 정렬을 변경할 수 있다.
   - 정렬 변경 시 같은 검색 조건 내에서 정렬만 변경된 결과를 다시 조회한다.
9. 상세 화면 진입  
   - 목록에서 특정 row를 클릭하면 해당 channel_id의 상세 화면으로 이동한다.
   - 상세 화면에서 상태 전환, 정보 수정이 가능한 권한인지에 따라 버튼 노출 여부를 제어한다.
10. 권한에 따른 표시 제어  
    - **Admin**: 전체 목록 조회 가능, 상태 변경, 정보 수정 버튼 모두 노출
    - **Operator**: 전체 목록 조회 가능, 상태 변경은 가능하지만 channel 생성은 제한 등의 정책을 둘 수 있음
    - **Viewer**: 목록 조회 및 상세 조회만 가능, 생성/수정/상태 변경 버튼은 노출하지 않음

#### 예외 케이스 처리
- 검색 결과가 0건인 경우: "검색 조건에 해당하는 채널이 없습니다." 메시지 표시, 조건 초기화 버튼 제공
- 비정상 필터 조합: from_created_at > to_created_at인 경우 검색 실행 전에 클라이언트 또는 서버에서 오류 메시지 반환
- 권한 오류: 채널관리 메뉴에 접근 권한이 없는 사용자가 URL로 직접 접근할 경우 "접근 권한이 없습니다." 메시지와 함께 대시보드로 리다이렉트

#### 최종 상태
- 운영자는 채널 목록을 다양한 조건으로 조회·필터링할 수 있다.
- ACTIVE/INACTIVE, INTERNAL/PARTNER 상태를 빠르게 파악할 수 있다.
- 이후 세부 시나리오(생성, 상태 전환, 엑셀, 연계 검증)를 수행할 채널을 쉽게 선택할 수 있다.

---

### 7. 채널 엑셀 다운로드 - 시나리오 7
**UI 구성**: Ant Design Table 상단 다운로드 버튼 + 검색 조건 기반 다운로드

#### 상세 작업 흐름

1. 관리자 로그인  
   - Admin 또는 엑셀 다운로드 권한을 가진 운영자가 백오피스에 로그인한다.
2. 메뉴 이동  
   - 상단 메뉴에서 "메뉴 09 채널관리"를 선택한다.
3. 채널 목록 조회  
   - 기본 목록 또는 필터 조건을 적용한 상태로 채널 목록을 조회한다.
   - 다운로드는 "현재 검색 조건 기준"으로 수행된다.
4. 다운로드 버튼 클릭  
   - 목록 상단의 "엑셀 다운로드" 버튼을 클릭한다.
5. 다운로드 범위 선택 정책  
   - **기본 정책**: 현재 화면에 적용된 검색 필터 조건을 그대로 적용한다.
   - **선택 다운로드 옵션**: 체크박스로 특정 channel_id만 선택한 경우, 선택된 항목만 다운로드할 수 있도록 확장 가능
6. 서버 요청 처리  
   - 현재 검색 조건을 파라미터로 전달한다.
   - 서버는 동일한 WHERE 조건으로 channels 테이블을 조회한다.
   - 최대 다운로드 건수 제한을 검증한다. (예: 5,000건 초과 시 다운로드 차단)
   - 초과 시 "다운로드 가능 건수를 초과했습니다." 메시지 반환
7. 엑셀 파일 구성 정의  
   - **포함 컬럼**: channel_id, channel_code, channel_name, channel_type, channel_status, partner_company_name, partner_contact_name, partner_contact_email, partner_contact_phone, created_at, updated_at
   - **컬럼명**: 한글 헤더로 표시 가능 (예: "채널 ID", "채널 코드", "채널명", "채널 유형", "상태" 등)
   - **날짜 형식**: YYYY-MM-DD HH:MM:SS 형식으로 출력
8. 파일 생성 처리  
   - **파일명 규칙**: channels_YYYYMMDD_HHMMSS.xlsx
   - 생성 완료 후 HTTP 응답으로 파일 다운로드 시작
9. 권한 정책  
   - **Admin**: 전체 다운로드 가능
   - **Operator**: 다운로드 가능 여부는 정책에 따라 제한 가능
   - **Viewer**: 다운로드 버튼 비노출
10. 데이터 무결성 정책  
    - channel_id, channel_code, channel_name은 원본 그대로 출력한다.
    - INACTIVE 채널도 필터 조건에 따라 포함 가능하다.
    - 삭제 개념이 없으므로 모든 레코드는 상태 기반으로만 관리한다.

#### 연동 영향 확인

- **주문관리 연동**: 엑셀 다운로드는 읽기 전용 기능이므로 주문 데이터에는 영향 없음. 운영자는 다운로드 파일을 기반으로 제휴 채널 정산, 운영 현황 점검 가능
- **서비스관리 연동**: 서비스-채널 스코프 설정 점검 용도로 사용 가능. ACTIVE 채널 목록과 비교 검증 가능
- **배정 로직 연동**: channel_type, channel_status 현황을 확인하여 배정 정책 분기 설계 점검 가능

#### 예외 케이스 처리

- **조회 결과 0건일 경우**: 다운로드 버튼 클릭 시 "다운로드할 데이터가 없습니다." 메시지 반환
- **서버 오류 발생 시**: "파일 생성 중 오류가 발생했습니다." 메시지 반환, 오류 로그 기록
- **권한 없는 사용자 접근 시**: 403 오류 반환

#### 감사 로그 기록

- 다운로드 수행 사용자 ID 기록
- 다운로드 시각 기록
- 다운로드 건수 기록

#### 최종 상태

- 운영자는 현재 채널 마스터 데이터를 엑셀로 확보할 수 있다.
- 대량 제휴 채널 점검 및 외부 공유가 가능하다.
- 데이터 무결성과 권한 정책이 유지된다.

---

### 8. 채널 스코프 관리 (서비스-채널 매핑) - 시나리오 8
**UI 구성**: Ant Design Transfer 컴포넌트 + Table

#### 상세 작업 흐름

1. 관리자 로그인
2. 메뉴 이동
3. 채널 목록 조회
4. 채널 선택  
   - 스코프 관리 대상 `channel_id` 선택
   - "스코프 관리" 버튼 클릭
5. 서비스 목록 조회  
   - 모든 서비스 소분류(`service_items`) 목록 로드
   - 현재 채널에 매핑된 서비스 강조 표시
6. 스코프 설정  
   - Transfer 컴포넌트로 매핑 추가/제거
   - "적용" 버튼 클릭
7. 서버 처리  
   - `service_channel_scope` 테이블에 매핑 저장
   - 기존 매핑 삭제 후 새 매핑 저장 (전체 교체)
8. 감사 로그 기록  
   - 작업 유형 = SCOPE_UPDATE
   - 변경된 매핑 목록 기록
9. 연동 영향 확인  
   - **주문관리 연동**: 주문 생성 시 해당 채널에서 선택 가능한 서비스 범위 제한
   - **전문가웹앱 연동**: 채널별 제공 서비스 제한 적용

#### 비즈니스 규칙
- 채널 스코프는 서비스 소분류 단위로 관리
- 한 채널에 여러 서비스 매핑 가능
- 한 서비스는 여러 채널에 매핑 가능
- 스코프 미설정 시 모든 서비스 접근 가능 (기본값)

---

### 9. 채널별 수수료 관리 - 시나리오 9
**UI 구성**: Ant Design Table + Modal + Form

#### 상세 작업 흐름

1. 관리자 로그인
2. 메뉴 이동
3. 채널 목록 조회
4. 채널 선택  
   - 수수료 관리 대상 `channel_id` 선택
   - "수수료 관리" 버튼 클릭
5. 수수료 목록 조회  
   - 해당 채널의 기존 수수료 설정 목록 표시
   - 서비스 소분류별 수수료 타입(RATE/FIXED) 및 값 표시
6. 수수료 생성/수정  
   - "수수료 추가" 버튼 클릭
   - 서비스 소분류 선택
   - 수수료 타입 선택 (RATE 또는 FIXED)
   - 수수료 값 입력 (RATE: 0~100%, FIXED: 금액)
   - 적용 시작일 설정
   - 적용 종료일 선택적 설정
7. 저장 처리  
   - `service_category_channel_commissions` 테이블에 저장
   - 신규 수수료 생성 시 기존 수수료 종료일 자동 설정
8. 유효성 검증  
   - 동일 `serviceItemId` + `channelCode` + `effectiveStartDate` 중복 불가
   - `commissionType = RATE`일 경우 0 ≤ `commissionValue` ≤ 100
9. 감사 로그 기록  
   - 작업 유형 = COMMISSION_UPDATE
   - 변경된 수수료 정보 기록
10. 연동 영향 확인  
    - **주문관리 연동**: 주문 생성 시 채널별 수수료 적용
    - **정산 관리 연동**: 전문가 정산 시 채널 수수료 반영

#### 비즈니스 규칙
- 수수료 버전 관리 (`commissionVersion`)
- 동일 서비스-채널 조합에 대해 시간대별 수수료 이력 관리
- 현재 유효한 수수료는 `isActive = true` 및 `effectiveStartDate` ≤ 현재 ≤ `effectiveEndDate` (또는 `effectiveEndDate` null)

---

### 배정 로직 연동

채널 정보는 주문 생성 시 `order.channel_id`, `order.channel_type`으로 저장되며, 배정 엔진에 전달되어 배정 정책에 활용됩니다.

#### v1 기준 정책
- **채널 무관 동일 배정**: INTERNAL/PARTNER 구분 없이 동일한 배정 로직 적용
- **주문 생성 검증**: `channel_status = ACTIVE`인 채널만 주문 생성 가능
- **배정 파라미터**: `assignment_request`에 `channel_id`, `channel_type` 포함
- **로그 기록**: `assignment_log`에 `channel_id`, `channel_type`, `engine_version_id` 저장

#### 향후 고도화 가능성
- **채널 타입 기반 분기**: `channel_type`(INTERNAL/PARTNER)에 따라 배정 정책 분기 가능
  - 예: PARTNER 채널은 멤버십 가중치 미적용, INTERNAL 채널만 멤버십 적용
- **특정 채널 예외 정책**: 특정 `channel_id`에 대한 오버라이드 정책 설정 가능
  - 예: 특정 채널은 자동배정 HOLD 처리, 특정 전문가 풀만 사용
- **정책 관리**: 메뉴 10(배정 로직 관리)에서 채널 분기 플래그 및 예외 정책 설정

#### 데이터 무결성
- **불변 필드**: `channel_id`, `channel_type`은 주문 생성 후 변경 불가
- **스냅샷 보존**: 주문의 `channel_name_snapshot`으로 채널명 보존
- **상태 영향**: `channel_status = INACTIVE`라도 기존 주문 배정 로직에는 영향 없음

---

### 10. 주문관리 연계 검증 - 시나리오 10
**검증 목적**: 채널 생성, 상태 변경 이후 주문관리 메뉴에서 정상적으로 반영되는지 검증. channel_id, channel_code, channel_status가 주문 생성·조회 흐름에 정확히 적용되는지 확인.

#### 검증 절차

1. **사전 조건 설정**
   - **테스트용 채널 존재**: `channel_status = ACTIVE`인 채널 1개, `channel_status = INACTIVE`인 채널 1개
   - **권한**: 주문 생성 권한이 있는 운영자 계정 사용

2. **ACTIVE 채널 주문 생성 검증**
   - 관리자 로그인
   - 메뉴 02 주문관리로 이동
   - "주문 생성" 버튼 클릭
   - 채널 선택 리스트 확인: `channel_status = ACTIVE`인 `channel_id`만 노출되는지 확인. INACTIVE 채널은 선택 리스트에 표시되지 않아야 함
   - ACTIVE 채널 선택 후 주문 생성: `order.channel_id`에 선택된 `channel_id` 저장, `order.channel_name_snapshot`에 `channel_name` 저장
   - 주문 저장 후 상세 화면 확인: 주문 상세 상단에 `channel_name` 표시, `channel_type` 표시, `channel_order_no` 입력 가능 여부 확인

3. **INACTIVE 채널 주문 생성 차단 검증**
   - 주문 생성 화면 진입
   - 채널 선택 리스트 확인: INACTIVE 채널이 노출되지 않는지 확인
   - API 레벨 검증: 클라이언트에서 `channel_id`를 수동으로 전달하여 주문 생성 시도, 서버에서 `channel_status = ACTIVE` 여부 검증, INACTIVE인 경우 400 오류 반환 ("비활성 채널로는 주문을 생성할 수 없습니다." 메시지 반환)

4. **엑셀 업로드 주문 연계 검증**
   - 주문 엑셀 업로드 파일 준비: `channel_code` 컬럼 포함
   - 업로드 수행
   - 서버 처리 로직:
     - `channel_code` → `channel_id` 매핑
     - `channel_status = ACTIVE` 여부 검증
     - INACTIVE 채널일 경우 해당 row 실패 처리
     - 부분 성공 정책 적용
   - 업로드 결과 검증: ACTIVE 채널 주문은 생성, INACTIVE 채널 주문은 실패 로그 기록

5. **주문 상세 화면 연동 검증**
   - 기존 주문 조회: `order.channel_id` 유지, `order.channel_name_snapshot` 유지
   - 채널이 이후 INACTIVE로 전환되었더라도 기존 주문의 조회 및 상태 전이 정상 진행

6. **채널 상태 변경 이후 신규 주문 검증**
   - ACTIVE → INACTIVE 전환 후: 신규 주문 생성 시 채널 선택 불가
   - INACTIVE → ACTIVE 전환 후: 채널 선택 가능 상태 복구

7. **주문 필터 연동 검증**
   - 주문 목록 필터에 `channel_id` 조건 적용: 특정 `channel_id` 기준 주문 검색 가능
   - `channel_type` 기준 필터 확장 가능: INTERNAL / PARTNER 기준 조회

8. **데이터 무결성 검증**
   - `order.channel_id`는 외래키로 유지
   - `channel_id` 삭제 개념이 없으므로 FK 무결성 보장
   - `channel_name` 변경 불가 정책으로 스냅샷 불일치 문제 없음

#### 예외 케이스 처리

- `channel_id` 존재하지 않는 값으로 주문 생성 시도: 400 오류 반환
- `channel_status` NULL 또는 비정상 값 존재 시: 주문 생성 차단

#### 감사 로그

- 주문 생성 시 `channel_id` 기록
- 엑셀 업로드 실패 row 로그 기록

#### 최종 상태

- 채널 ACTIVE 상태만 신규 주문 생성 가능
- INACTIVE 채널은 신규 유입 차단
- 기존 주문 데이터 보호
- 주문관리와 채널관리 간 정합성 확보

### 11. 서비스관리 연계 검증 - 시나리오 11
**검증 목적**: 채널 생성 및 상태 변경이 서비스관리 메뉴(메뉴 03)의 채널 스코프 설정에 정확히 반영되는지 검증. channel_id, channel_status가 가격/수수료 설정 스코프에서 정상 동작하는지 확인.

#### 검증 절차

1. **사전 조건 설정**
   - **테스트용 채널 준비**: `channel_status = ACTIVE`인 채널 1개, `channel_status = INACTIVE`인 채널 1개
   - **테스트용 서비스 준비**: 서비스 중분류 1개 이상 존재, 채널 스코프 설정이 가능한 상태

2. **ACTIVE 채널 스코프 선택 검증**
   - 관리자 로그인
   - 메뉴 03 서비스관리 이동
   - 특정 서비스 중분류 선택
   - "채널별 가격/수수료 설정" 탭 진입
   - 채널 스코프 선택 드롭다운 확인: `channel_status = ACTIVE` 채널만 노출되는지 확인, INTERNAL/PARTNER 모두 표시 가능
   - ACTIVE 채널 선택 후 가격/수수료 설정 저장
   - `service_channel_scope` 테이블에 `service_category_mid`, `channel_id`, 가격/수수료 값 저장
   - 저장 완료 후 목록 재조회하여 정상 저장 여부 확인

3. **INACTIVE 채널 스코프 선택 제한 검증**
   - 동일 화면에서 채널 선택 드롭다운 확인: INACTIVE 채널은 선택 리스트에 노출되지 않아야 함
   - API 레벨 검증: INACTIVE `channel_id`를 강제로 전달하여 저장 요청, 서버에서 `channel_status = ACTIVE` 여부 검증, INACTIVE인 경우 400 오류 반환 ("비활성 채널은 신규 스코프로 설정할 수 없습니다." 메시지 반환)

4. **기존 스코프 유지 정책 검증**
   - ACTIVE 상태에서 서비스-채널 매핑 생성
   - 해당 채널을 INACTIVE로 전환
   - 서비스관리 재조회: 기존 `service_channel_scope` 데이터는 유지되어야 함, 기존 가격/수수료 값은 삭제되지 않아야 함
   - 단, 신규 스코프 설정은 불가능해야 함

5. **채널 재활성 시 스코프 복구 검증**
   - INACTIVE → ACTIVE 전환
   - 서비스관리 화면 재조회: 채널 스코프 선택 가능 상태로 복구 확인

6. **공통 vs 채널별 설정 충돌 검증**
   - 공통 가격 설정 존재
   - 특정 `channel_id`에 대한 별도 가격 설정 존재
   - 적용 우선순위 검증: 채널 스코프 설정이 공통 설정보다 우선 적용되는지 확인, `channel_id` 기준 매칭 정상 작동 여부 확인

7. **데이터 무결성 검증**
   - `service_channel_scope.channel_id`는 `channels.channel_id` 외래키로 존재해야 함
   - `channel_id` 삭제가 불가하므로 FK 무결성 유지
   - `channel_name` 변경 불가 정책으로 서비스 스코프 혼란 없음

8. **배정 로직과의 간접 영향 검증**
   - 서비스관리에서 채널별 수수료 차등 적용 시 주문 생성 시 `channel_id` 기준 수수료 계산 정상 적용 여부 확인
   - 배정 로직은 `channel_type`을 조건 분기로 활용 가능하므로 INTERNAL/PARTNER 구분 값 유지 여부 확인

#### 예외 케이스 처리

- 존재하지 않는 `channel_id` 전달 시: 저장 차단
- `channel_status` 값이 비정상인 경우: 저장 차단
- 권한 없는 사용자 접근 시: 수정 기능 비노출

#### 감사 로그

- 서비스-채널 스코프 설정 변경 이력 기록
- `channel_status` 변경 이력과 교차 추적 가능해야 함

#### 최종 상태

- ACTIVE 채널만 신규 서비스 스코프로 설정 가능
- INACTIVE 채널은 기존 설정 유지하되 신규 설정 불가
- 서비스관리와 채널관리 간 참조 무결성 유지
- 가격/수수료 정책 적용 시 `channel_id` 기준 정합성 확보

### 12. 배정 로직 연계 조건 확인 - 시나리오 12
**검증 목적**: 채널 정보(channel_id, channel_type)가 배정 로직(메뉴 10)으로 정확히 전달되고, 채널을 조건으로 한 배정 정책이 의도대로 동작하는지 검증. 현재 v1 기준 "채널 무관 동일 배정"이 기본이며, 향후 INTERNAL/PARTNER 분기 또는 특정 채널 예외 정책을 추가할 경우에도 검증이 가능하도록 한다.

#### 검증 절차

1. **사전 조건 설정**
   - **채널 준비**:
     - `channel_type = INTERNAL`, `channel_status = ACTIVE` 채널 1개
     - `channel_type = PARTNER`, `channel_status = ACTIVE` 채널 1개
   - **전문가 준비**:
     - 동일 `service_category_mid`에서 배정 가능한 전문가 2명 이상
     - 동일 `region_group` 내에 위치
     - `approval_status = APPROVED`, `active_status = ACTIVE`
   - **서비스·배정 로직 준비**:
     - 메뉴 03 서비스관리에서 테스트 서비스 중분류에 대해 정상 설정 완료
     - 메뉴 10 배정 로직 관리에서 기본 배정 버전 활성화
     - v1 기준 채널별 차등 배정은 사용하지 않는 상태를 기본으로 함

2. **주문 생성 시 채널 정보 전달 검증**
   - 관리자 로그인: 주문 생성 권한이 있는 운영자가 백오피스에 로그인
   - 메뉴 이동: 메뉴 02 주문관리로 이동
   - **INTERNAL 채널 주문 생성**:
     - 주문 생성 화면에서 `channel_id`로 INTERNAL 채널 선택
     - `service_category_mid`, `region_group`, 예약일 등 입력
     - 주문 저장 시 `order.channel_id`, `order.channel_type = INTERNAL` 값 저장 확인
   - **PARTNER 채널 주문 생성**:
     - 주문 생성 화면에서 `channel_id`로 PARTNER 채널 선택
     - 동일한 조건의 서비스 중분류, `region_group`으로 주문 생성
     - `order.channel_id`, `order.channel_type = PARTNER` 값 저장 확인
   - **배정 엔진 입력 파라미터 검증**:
     - 두 주문에 대해 자동배정 요청 시
     - `assignment_request`에 `service_category_mid`, `region_group`와 함께 `channel_id`, `channel_type`이 포함되는지 확인

3. **채널 무관 동일 배정 정책(v1 기본) 검증**
   - **INTERNAL 주문 자동배정 실행**:
     - INTERNAL 채널 주문에 대해 자동배정 트리거 실행
     - 배정 후보군 필터:
       - `service_category_mid` 일치
       - `region_group` 일치
       - `approval_status`, `active_status`, 패널티, 일일 상한 필터 적용
     - 채널 기준 추가 필터가 없는지 확인
     - 멤버십 가중치 및 슬롯 로직이 채널과 무관하게 동일 적용되는지 확인
   - **PARTNER 주문 자동배정 실행**:
     - PARTNER 채널 주문에 대해 자동배정 트리거 실행
     - 동일한 서비스·권역 조건에서 후보군 구성이 INTERNAL 주문과 동일해야 함
     - INTERNAL 주문과 동일한 배정 엔진 버전, 동일한 필터/가중치 로직이 사용되는지 확인
   - **결과 비교**:
     - INTERNAL 주문과 PARTNER 주문 모두에서, 동일 시점·동일 조건일 때 동일한 후보군과 가중치 결과가 나오는지 비교
     - 채널이 단지 메타 정보로만 사용되고, v1 기준 배정 우선순위에는 영향을 주지 않음을 검증

4. **채널 타입 기반 조건 분기 설계 검증(고도화 플래그 ON 시)**
   - **메뉴 10에서 채널 분기 옵션 활성화**:
     - 배정 로직 설정에서 `channel_type` 기반 분기 플래그 활성화
     - 예시 정책 1:
       - PARTNER 채널 주문은 멤버십 우선 배정을 사용하지 않음
       - INTERNAL 채널 주문만 멤버십 가중치 적용
   - **INTERNAL 주문 재배정**:
     - INTERNAL 채널 주문에 대해 자동배정 실행
     - 후보군 분리: 멤버십 그룹과 일반 그룹으로 나뉘고, 멤버십 그룹 우선 라운드로빈이 작동하는지 확인
   - **PARTNER 주문 재배정**:
     - PARTNER 채널 주문에 대해 자동배정 실행
     - 후보군 분리: 설정된 정책에 따라 멤버십 가중치가 무시되고, 모든 전문가가 동일한 기본 가중치로 라운드로빈 되는지 확인
   - **채널 분기 로직 안정성 검증**:
     - 설정 플래그를 다시 OFF 했을 때 INTERNAL·PARTNER 모두 동일 로직으로 되돌아오는지 확인
     - 버전 관리(메뉴 10 배정 로직 버전) 기반으로 ON/OFF 상태가 명확하게 구분되는지 확인

5. **특정 채널 예외 정책 검증(채널 단위 override 설계 시)**
   - **예시 정책**:
     - 특정 PARTNER 채널은 자동배정을 사용하지 않고 항상 HOLD 처리
     - 또는 특정 PARTNER 채널은 특정 전문가 풀만 사용
   - **메뉴 10에서 채널 예외 설정**:
     - `channel_override` 정책에 대상 `channel_id` 등록
     - `override_type`, `override_pool`, `override_assignment_mode` 설정
   - **해당 채널 주문 생성 및 배정**:
     - 예외 채널로 주문 생성
     - 자동배정 실행 시:
       - 일반 후보군이 아닌 `override_pool`만 후보군으로 사용되는지 확인
       - `override_assignment_mode`가 HOLD인 경우 `assignment_delivery_status = HOLD`로 고정되는지 확인
   - **다른 채널 영향 검증**:
     - `override` 대상이 아닌 `channel_id`로 생성된 주문은 기존 글로벌 정책대로 정상 배정되는지 확인

6. **로그 및 추적 가능성 검증**
   - **배정 로그에 channel 정보 포함 여부**:
     - `assignment_log`에 `order_id`, `channel_id`, `channel_type`, `engine_version_id`가 함께 저장되는지 확인
   - **배정 실패 로그에서 채널 조건 확인**:
     - 채널 예외 정책으로 인한 배정 실패가 있을 경우 `failure_reason` 또는 `filter_step_stats`에 channel 관련 사유가 명시되는지 확인

7. **주문 상태머신과의 연계 검증**
   - **채널 유형과 무관하게**:
     - `order_status`, `expert_progress_status`, `assignment_delivery_status` 상태 전이가 동일하게 동작하는지 확인
     - INTERNAL / PARTTER에 따라 다른 상태머신을 사용하지 않음을 검증

#### 예외 케이스 처리

- 존재하지 않는 `channel_id`를 가진 주문: 주문 생성 단계에서 차단되어야 하므로 배정 엔진에는 들어오지 않는지 확인
- `channel_status = INACTIVE` 인 채널 주문:
  - 설계 상 신규 주문이 생성되지 않아야 함
  - 만약 과거에 생성된 주문이라면 배정 로직은 정상적으로 동작해야 하며, `channel_status`에 의해 배정이 차단되지 않아야 함

#### 감사 로그

- 배정 로그에 `channel_id`, `channel_type` 정보 포함 기록
- 채널 예외 정책으로 인한 배정 실패 시 관련 사유 명시 기록

#### 최종 상태

- 채널 정보는 주문 생성 시 정확히 저장되고 배정 엔진으로 그대로 전달되며 정책에 따라 분기 조건으로 활용될 수 있음
- v1 기준에서는 INTERNAL / PARTNER 모두 동일 배정 로직이 적용됨을 검증
- 향후 고도화 시 `channel_type` 또는 특정 `channel_id`를 조건으로 한 배정 예외 정책을 추가해도 메뉴 09, 메뉴 02, 메뉴 10 간 데이터 정합성이 깨지지 않도록 설계가 되어 있음을 확인

---

### 권한 요구사항
- **슈퍼 관리자 (Admin)**: 모든 채널 관리 기능 (생성, 수정, 상태 전환, 스코프 관리, 수수료 관리)
- **운영 관리자 (Operator)**: 채널 목록 조회만 가능 (생성/수정 불가)
- **CS 관리자 (CS)**: 채널 목록 조회만 가능
- **재무 관리자 (Finance)**: 채널 목록 조회 및 수수료 관리 가능 (생성/수정/상태 전환 불가)

### API 연동
- 채널 마스터 관리: `GET /api/v1/admin/channels`, `POST /api/v1/admin/channels`, `PUT /api/v1/admin/channels/{id}`, `PUT /api/v1/admin/channels/{id}/status`
- 채널 스코프 관리: `GET /api/v1/admin/channels/{id}/scopes`, `PUT /api/v1/admin/channels/{id}/scopes`
- 채널별 수수료 관리: `GET /api/v1/admin/channels/{id}/commissions`, `POST /api/v1/admin/channels/{id}/commissions`, `PUT /api/v1/admin/channels/{id}/commissions/{commissionId}`

### UI 컴포넌트 매핑
- 채널 목록: Ant Design Table (검색, 필터, 페이지네이션)
- 채널 생성/수정: Ant Design Modal + Form
- 상태 전환: Ant Design Switch + Confirmation Modal
- 채널 스코프 관리: Ant Design Transfer 컴포넌트
- 채널별 수수료 관리: Ant Design Table + Editable Table
- 권한 제어: Ant Design Pro Access 컴포넌트

---

← [서비스 관리 파트4](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART4.md) | [운영 및 시스템 관리](./05_BACKOFFICE_SPEC_OPERATIONS_SYSTEM.md) →