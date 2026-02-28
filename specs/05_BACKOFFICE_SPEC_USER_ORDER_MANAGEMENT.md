**이 문서는 [백오피스 스펙 개요](./05_BACKOFFICE_SPEC_OVERVIEW.md)의 분할 문서입니다.**

← [전문가 관리](./05_BACKOFFICE_SPEC_EXPERT_MANAGEMENT.md) | [서비스 관리 파트1](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART1.md) →

---

## 사용자 관리

### 사용자 목록 페이지 (Ant Design ProTable)
- **탭 필터**: 전체 / 고객 / 전문가 / 관리자
- **상태 필터**: 전체 / 활성 / 비활성 / 승인대기 / 정지
- **검색 기능**: 이름, 이메일, 휴대폰 번호로 검색
- **고급 필터**: 가입일 범위, 서비스 지역, 정산 방식
- **일괄 작업**: 선택 사용자 활성화/비활성화, 정지 해제



### 사용자 상세 페이지 (Ant Design Descriptions + Tabs)
- **기본 정보 탭**: 개인 정보, 계정 상태, 마지막 로그인
- **주문 내역 탭**: 해당 사용자의 주문 목록 (고객/전문가별)
- **정산 내역 탭**: 전문가의 정산 이력 (전문가만)
- **활동 로그 탭**: 시스템 활동 기록



---

## 주문 관리

### 개요
주문 관리 모듈은 주문의 전 생애주기를 관리하는 기능을 제공합니다. 주문 상태는 3계층 상태 시스템으로 관리됩니다:
- **주문 상태 (order_status)**: NEW, CHECKED, UNASSIGNED, ASSIGNED, CANCELLED, REFUNDED 등
- **배정 전달 상태 (assignment_delivery_status)**: HOLD, SENT - 멤버십 전문가 배정 시 사용
- **전문가 진행 상태 (expert_progress_status)**: 전문가 웹앱에서 업데이트되는 서비스 진행 상태

상태 머신의 주요 흐름:
```
NEW → CHECKED → [UNASSIGNED 또는 ASSIGNED(with HOLD/SENT)] → 전문가 진행 상태 변경 → COMPLETED → SETTLED

취소 경로: 어느 단계에서나 → 취소 요청 → 관리자 검토 → 취소 완료
환불 경로: 완료 후 → 환불 요청 → 관리자 검토 → 환불 완료 (전체/부분)
```

### 신규 주문 검수 및 배정

#### 시나리오 1: 신규 주문 검수 처리
1. 관리자 로그인 후 주문관리 메뉴 진입
2. 주문 목록에서 `order_status = NEW` 필터 적용
3. 신규 주문 리스트 확인 (주문번호, 채널주문번호, 고객정보, 서비스카테고리, 금액정보 등)
4. 특정 주문 클릭하여 상세 화면 진입
5. 주문 상세 정보 검토:
   - 기본 정보, 고객 정보, 서비스 정보, 전문가 정보, 금액 정보
   - 관리자 메모란, 전문가 전달 메모란 확인
   - 서비스 항목, 옵션, 금액 계산 오류, 중복 주문 여부 확인
6. 이상 여부 판단:
   - **이상 없음**: 검수 완료 처리 (`NEW → CHECKED`), 배정 로직 실행
   - **이상 있음**: 보완 조치 (고객 연락, 주문 정보 수정, 취소 처리)
7. 배정 로직 실행:
   - 자동 배정 대상: 자동 배정 트리거
   - 수동 배정 대상: 수동 배정 트리거
   - 멤버십 대상: HOLD 단계 적용 여부 확인

#### 시나리오 2: 주문 상세 조회 및 상태 확인
1. 관리자 로그인 후 주문관리 메뉴 진입
2. 주문 검색 또는 필터 적용:
   - 주문번호, 채널주문번호 검색
   - 고객명, 고객 연락처 검색
   - 주문 상태, 전문가 진행 상태, 배정 상태, 결제 상태 필터
   - 날짜 필터 (주문신청일시, 서비스희망일, 서비스예정일 등)
   - 주소 필터 (시/군, 시군구)
   - 지역그룹(권역) 필터
   - 채널명 필터
3. 주문 목록에서 대상 주문 선택
4. 주문 상세 화면 진입
5. 주문 기본 정보 확인:
   - 기본 정보 (주문번호, 채널주문번호, 채널명, 주문등록일시)
   - 고객 정보 (고객명, 연락처, 안심번호, 서비스 희망일, 고객 요청사항)
   - 서비스 정보 (서비스 예정일, 서비스 카테고리, 수량, 기본비용, 지역그룹, 서비스 주소)
   - 전문가 정보 및 배정 정보
   - 추가 입력 정보 (서비스 관리에서 설정한 추가입력항목)
6. 상태 정보 확인:
   - 주문 상태, 배정 상태, 전달 상태(HOLD/SENT), 전문가 진행 상태, 결제 상태
7. 금액 정보 확인:
   - 예약금(선결제금액), 기본비용, 현장비용, 할인금액, 미결제금액, 총 결제금액
   - 결제 여부, 예약금결제일, 잔금결제일, 구매확정일, 환불 정보
8. 배정 이력 확인:
   - `order_assignment_history` 조회 (배정 전문가, 사업자명, 배정일시)
   - 배정 지역(권역), 배정 시도 횟수, 거절/타임아웃 여부, 재배정 필요 여부
9. 진행 이력 로그 확인:
   - 상태 변경 로그, 운영 메모, 환불/취소 이력
10. 현재 주문 진행 상황 판단:
    - 정상 진행 중: 모니터링 종료
    - 지연 또는 문제 발생: 추가 조치 검토 (전문가 재배정, 고객 연락, 결제 재요청, 환불/취소 처리)

#### 시나리오 3: 수동 전문가 배정
1. 관리자 로그인 후 주문관리 메뉴 진입
2. `order_status = UNASSIGNED` 필터 적용하여 미배정 주문 목록 확인
3. 배정이 필요한 주문 선택 후 상세 화면 진입
4. 배정 가능 여부 확인:
   - 현재 `order_status`가 `UNASSIGNED`인지 확인
   - 기존 `expert_master_id`가 null인지 확인
   - `assignment_delivery_status`가 `NONE`인지 확인
5. "배정" 버튼 클릭
6. 배정 대상 전문가 목록 조회:
   - 서비스 주소(고객)와 서비스 가능지역(전문가) 일치 여부
   - 서비스 카테고리 수행 가능 여부
   - 멤버십 카테고리 여부 및 멤버십/일반 전문가 구분
   - 활성 상태 여부
   - 최근 배정 이력, 거절률, 체결률 참고
7. 특정 `expert_master_id` 선택
8. 배정 확정 처리:
   - `order_status`: `UNASSIGNED` → `ASSIGNED`
   - `expert_master_id` 저장
   - `assignment_delivery_status`: `NONE` → `SENT`
   - `expert_progress_status`: `NEW_ASSIGN`으로 초기화
9. 배정 이력 기록:
   - `order_assignment_history`에 row 생성, `assignment_type = MANUAL`
   - 배정 시각, 전문가 정보, 배정 횟수 기록
10. 전문가에게 자동 알림 전송 (앱 푸시, SMS, 알림톡 등)
11. 배정 결과 확인:
    - 주문 상세 화면에서 `ASSIGNED` 상태 확인
    - `assignment_delivery_status = SENT` 확인
    - 배정 성공 시 모니터링 종료, 실패 시 실패 사유 확인 및 재시도

#### 시나리오 4: 자동배정 후 멤버십 전문가 배정 주문 HOLD 처리
1. 자동 배정 로직 실행 시 멤버십 전문가가 배정된 경우:
   - `order_status`: `CHECKED` → `ASSIGNED`
   - `expert_master_id` 세팅
   - `assignment_delivery_status`: `NONE` → `HOLD`
   - `expert_progress_status`는 아직 설정하지 않음
   - 주문이 "멤버십 상담 대기 주문"으로 분류
2. 운영팀 1차 상담 진행:
   - 고객 요구사항 상세 확인
   - 현장 추가비용 발생 가능성 확인
   - 방문 일정 재확인
   - 서비스 범위 확정
   - 상담 내용 메모 기록
3. 상담 결과에 따른 분기 처리:
   - **기존 자동배정된 멤버십 전문가에게 전달**:
     - `assignment_delivery_status`: `HOLD` → `SENT`
     - `expert_progress_status`: `NEW_ASSIGN` 설정
     - 전문가에게 자동 알림 발송
     - HOLD 종료 시각 기록
     - 전문가웹/앱에 주문 노출
   - **기존 자동배정 전문가에게 전달하지 않음**:
     - 배정 취소 처리: `order_status`: `ASSIGNED` → `UNASSIGNED`
     - `expert_master_id` 초기화
     - `assignment_delivery_status`: `HOLD` → `NONE`
     - `order_assignment_history`에 `REJECTED_BY_OPERATION` 기록
     - 재배정 로직 실행 (새 전문가 자동/수동 배정)
   - **상담 후 주문 취소**:
     - `order_status`: `ASSIGNED` → `CANCELED`
     - `assignment_delivery_status` HOLD 상태 종료
     - 취소 사유 기록
     - 필요 시 환불 처리

**운영 리스크 통제 포인트**:
- HOLD 상태 주문은 전문가웹/앱에 절대 노출되지 않아야 함
- HOLD 상태에서는 자동 재배정이 실행되지 않아야 함
- HOLD 상태에서는 `expert_progress_status`가 설정되지 않아야 함
- HOLD 장기 미처리 주문은 대시보드에서 별도 카운트되어야 함
- HOLD → SENT 전환 시 기존 자동 배정된 `expert_master_id`를 그대로 유지해야 함
- HOLD 중 전문가 변경은 반드시 `ASSIGNED` → `UNASSIGNED` 전환 후 재배정으로만 처리해야 함

#### 시나리오 5: HOLD 해제 후 전문가 전달
1. 멤버십 HOLD 상태 주문 조회:
   - 필터 적용: `order_status = ASSIGNED`, `assignment_delivery_status = HOLD`, `expert_master_id` not null
   - HOLD 상태 주문 목록 확인 (주문번호, 고객명, 서비스 카테고리, 요청 일정, 자동배정된 전문가, HOLD 시작 시각)
2. 특정 주문 선택 후 상세 화면 진입
3. 사전 조건 검증:
   - 상태 확인: `order_status = ASSIGNED`, `assignment_delivery_status = HOLD`, `expert_master_id` 존재
   - 해당 전문가의 `membership_flag = true` 확인
   - 운영 상담 완료 여부 확인 (상담 메모 존재, 금액/일정 수정 여부, 고객 진행 의사 확정)
4. 전달 여부 결정:
   - **기존 자동배정된 멤버십 전문가에게 전달**:
     - HOLD 해제 실행: "전달" 버튼 클릭
     - 시스템 처리:
       - `assignment_delivery_status`: `HOLD` → `SENT`
       - `expert_progress_status`: `null` → `NEW_ASSIGN`
       - HOLD 종료 시각 기록
       - `order_assignment_history`에 `type = HOLD_RELEASE` 기록
       - 전달 실행자 `admin_id` 기록
     - 전문가 알림 발송 (앱 푸시, SMS, 카카오 알림톡)
     - 전문가웹/앱 노출 (해당 주문이 전문가 신규 탭에 표시)
     - 전달 완료 상태 확인: `assignment_delivery_status = SENT`, `expert_progress_status = NEW_ASSIGN`
   - **기존 자동배정 전문가에게 전달하지 않음**:
     - 배정 취소 및 재배정 준비:
       - 배정 취소 실행: `order_status`: `ASSIGNED` → `UNASSIGNED`
       - `expert_master_id` 초기화
       - `assignment_delivery_status`: `HOLD` → `NONE`
       - `expert_progress_status` 초기화(null)
       - `order_assignment_history`에 `type = REJECTED_BY_OPERATION` 기록
     - 재배정 로직 실행
     - 신규 자동배정 또는 수동 배정 수행
     - 새 전문가에게 `SENT` 처리
   - **상담 후 주문 취소 결정**:
     - 주문 취소 실행: `order_status`: `ASSIGNED` → `CANCELED`
     - `assignment_delivery_status` HOLD 종료 처리
     - 취소 사유 코드 저장
     - `order_assignment_history`에 `type = CANCELED` 기록
     - 필요 시 환불 처리

**상태 정합성 검증 포인트**:
- HOLD 상태에서는 `expert_progress_status`가 설정되면 안 됨
- HOLD 해제 시 반드시 `expert_master_id`가 존재해야 함
- HOLD 해제 후 `SENT` 상태에서만 전문가웹/앱 노출이 가능함
- HOLD 중에는 자동 재배정 로직이 동작하지 않아야 함
- HOLD 해제 로그와 최초 자동배정 로그는 `order_assignment_history`에서 구분 가능해야 함
- HOLD 상태에서 장기 미처리 주문은 대시보드에서 별도 모니터링 대상이어야 함

