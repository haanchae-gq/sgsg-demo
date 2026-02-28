**이 문서는 [백오피스 스펙 개요](./05_BACKOFFICE_SPEC_OVERVIEW.md)의 분할 문서입니다.**

← [서비스 관리 파트1](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART1.md) | [서비스 관리 파트3](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART3.md) →

---

### 배정 관리

#### 시나리오 6: 전문가 거절 또는 타임아웃 후 재배정 처리
1. **전제 조건 검증**:
   - `order_status = ASSIGNED`
   - `assignment_delivery_status = SENT`
   - `expert_progress_status = NEW_ASSIGN`
   - `expert_master_id` 존재
   - 이 상태에서만 거절 또는 타임아웃 이벤트가 발생할 수 있음

2. **전문가 거절 또는 타임아웃 이벤트 발생**:
   - 전문가웹/앱에서 거절 버튼 클릭
   - 또는 설정된 응답 타이머 초과

3. **시스템 이벤트 수신**:
   - 전문가 서비스에서 거절/타임아웃 이벤트를 백오피스 주문 서비스로 전달
   - 이벤트 타입 구분: `REJECTED` 또는 `TIMEOUT`

4. **상태 유효성 검증**:
   - 현재 `order_status`가 `ASSIGNED`인지 확인
   - `assignment_delivery_status`가 `SENT`인지 확인
   - `expert_master_id`가 이벤트 발신자와 일치하는지 확인
   - 이미 `CANCELED` 또는 `REFUNDED` 상태가 아닌지 확인
   - 조건 불일치 시 처리 중단 및 로그 기록

5. **재배정 상태 전환 처리**:
   - `order_status`: `ASSIGNED` → `UNASSIGNED`
   - `expert_master_id` 초기화
   - `expert_worker_id` 초기화
   - `assignment_delivery_status`: `SENT` → `NONE`
   - `expert_progress_status` 초기화(null)
   - 응답 타이머 종료 처리

6. **배정 이력 기록**:
   - `order_assignment_history`에 새로운 row 생성
     - `type = REJECTED` 또는 `TIMEOUT`
     - `expert_master_id`(이전 값) 기록
     - 발생 시각 기록
     - 재배정 시퀀스 번호 증가
   - 주문 이력 로그에 상태 전이 기록

7. **자동 재배정 로직 실행**:
   - 배정 로직 입력 조건:
     - `region_group`
     - 서비스 카테고리
     - 활성 전문가
     - 기존 거절한 전문가 제외
     - 멤버십 우선 정책 적용
   - 다음 전문가 후보 선정:
     - 멤버십 전문가가 존재하는 경우:
       - 자동배정 후 HOLD 처리 여부 판단
       - `assignment_delivery_status = HOLD` 또는 `SENT` 전환
     - 일반 전문가가 선정된 경우:
       - `order_status`: `UNASSIGNED` → `ASSIGNED`
       - `expert_master_id` 세팅
       - `assignment_delivery_status`: `NONE` → `SENT`
       - `expert_progress_status = NEW_ASSIGN`

8. **재배정 결과 분기**:
   - 재배정 성공 시:
     - 전문가 알림 발송 (앱 푸시, SMS, 카카오 알림톡)
     - 주문 상태 확인: `ASSIGNED`, `assignment_delivery_status = SENT` 또는 `HOLD`
   - 재배정 대상 없음 시:
     - `order_status` 유지 = `UNASSIGNED`
     - 미배정 주문으로 대시보드 노출
     - 운영팀 알림 생성
     - 수동 배정 필요 상태로 전환

**특수 케이스 처리**:
1. **멤버십 전문가가 거절한 경우**:
   - 해당 주문은 일반 전문가 대상으로 재배정될 수 있음
   - 멤버십 우선 정책은 "다음 멤버십 전문가" 존재 시에만 적용

2. **연속 거절 발생**:
   - 동일 주문에 대해 거절 횟수 누적
   - 일정 횟수 초과 시 자동 재배정 중단
   - 운영 개입 필요 플래그 설정

3. **타임아웃 반복 발생**:
   - 해당 전문가 응답 지연 통계에 반영
   - 전문가 패널티 점수 증가 가능

**운영 리스크 통제 포인트**:
- 거절 이벤트가 중복 처리되지 않도록 idempotent 처리 필요
- 상태 전환은 트랜잭션 단위로 처리해야 함
- 재배정 중 주문 취소가 발생할 경우 우선순위는 취소가 우선
- HOLD 상태 주문은 거절 이벤트가 발생할 수 없음
- 재배정 로직 실행 중 강제 수동 배정이 들어오면 자동 배정 중단

#### 시나리오 7: 주문 취소 처리
1. **관리자 로그인 및 주문관리 메뉴 진입**:
   - 관리자 계정으로 로그인
   - 백오피스 주문관리 메뉴 진입

2. **취소 대상 주문 검색**:
   - 검색 조건:
     - 주문번호
     - 고객 전화번호
     - `order_status` IN (`NEW`, `CHECKED`, `UNASSIGNED`, `ASSIGNED`)
     - 필요 시 채널, 서비스 카테고리 필터 적용

3. **주문 상세 화면 진입 및 현재 상태 확인**:
   - `order_status` 확인
   - `expert_progress_status` 확인
   - `assignment_delivery_status` 확인
   - `expert_master_id` 존재 여부 확인
   - `total_price`, `paid_amount_total`, `refund_amount_total` 확인

4. **취소 가능 여부 판단**:
   - 취소 불가 조건:
     - `order_status` IN (`CANCELED`, `REFUNDED`)
     - 이미 정산 확정 완료 상태(정산 잠금 상태)
     - 시스템 정책상 취소 제한 시간 경과
   - 상태별 판단:
     - `NEW` / `CHECKED` / `UNASSIGNED` 상태: 즉시 취소 가능
     - `ASSIGNED` + `assignment_delivery_status = HOLD`: 전문가에게 아직 전달되지 않음 → 취소 가능
     - `ASSIGNED` + `assignment_delivery_status = SENT`: 전문가에게 이미 전달됨 → 전문가 알림 필요
     - `expert_progress_status = IN_SERVICE` 이상: 부분 서비스 제공 가능성 → 환불 정책 별도 검토 필요

5. **취소 사유 입력**:
   - 취소 버튼 클릭
   - 취소 사유 코드 선택:
     - `CUSTOMER_REQUEST`
     - `CUSTOMER_NO_SHOW`
     - `EXPERT_UNAVAILABLE`
     - `INTERNAL_ISSUE`
     - `DUPLICATED_ORDER`
     - 기타 정책 정의 코드
   - 상세 메모 입력:
     - 고객 통화 내용
     - 정책 적용 근거
     - 환불 여부 판단 근거

6. **상태 전환 처리**:
   - `order_status` → `CANCELED`
   - `expert_progress_status` → `CANCELED` 또는 `null`
   - `assignment_delivery_status` 종료 처리 (HOLD 또는 SENT 상태 종료)
   - 자동 재배정 중단 플래그 설정
   - `order_assignment_history`에 `type = CANCELED` 기록
   - 취소 시각 및 처리자(`admin_id`) 기록

7. **일정 및 알림 처리**:
   - 일정 비활성화: 연결된 SERVICE/AS 일정 `is_active = false`
   - 전문가 알림: `SENT` 상태였던 경우 전문가에게 취소 알림 발송
   - 고객 알림: 앱/문자/채널 연동 정책에 따라 취소 완료 통지

8. **결제 상태 기반 환불 판단**:
   - `paid_amount_total = 0` 인 경우:
     - 환불 프로세스 없음
     - `order_status = CANCELED` 유지
   - `paid_amount_total > 0` 인 경우:
     - 환불 정책 판단 단계 진행

9. **환불 정책 판단 단계**:
   - 예약금만 결제된 경우 (`paid_amount_total < total_price`):
     - 환불 정책 분기:
       - 전액 환불 허용: `refund_amount = paid_amount_total`, `refund_type = FULL`
       - 일부 환불: `refund_amount = 정책 계산값`, `refund_type = PARTIAL`
       - 환불 불가: `refund_amount = 0`, 환불 없음 기록
   - 전액 결제 완료 상태에서 취소 (`paid_amount_total = total_price`):
     - 전액 환불: `refund_amount = total_price`, `refund_type = FULL`
     - 일부 서비스 제공 후 취소: 환불 금액 = `total_price - 제공 완료 서비스 금액`, `refund_type = PARTIAL`

10. **환불 실행 처리**:
    - `refund_amount > 0` 인 경우:
      - 결제 게이트웨이(Hecto) 환불 요청
      - 환불 성공 시:
        - `refund_amount_total` 업데이트
        - `refund_type` 기록
        - `order_status` → `REFUNDED`
      - 환불 실패 시:
        - `CANCELED` 유지
        - 환불 실패 로그 기록
    - `refund_amount = 0` 인 경우:
      - `order_status = CANCELED` 유지
      - `refund_type` 기록하지 않음 또는 `NONE`

11. **정산 연동 처리**:
    - 정산 미확정 상태:
      - 환불 금액 차감 반영
      - 전문가 정산 대상에서 제외 또는 조정
    - 정산 확정 이후 취소:
      - 재정산 필요 플래그 설정
      - 운영 승인 후 조정

12. **최종 상태 정합성 확인**:
    - 취소만 발생한 경우: `order_status = CANCELED`, `refund_amount_total = 0`
    - 취소 + 환불 완료: `order_status = REFUNDED`, `refund_amount_total > 0`
    - 부분 환불: `order_status = REFUNDED`, `refund_type = PARTIAL`

**운영 리스크 통제 포인트**:
- 취소 처리 전 반드시 현재 주문 상태와 전문가 진행 상태를 확인해야 함
- 환불 정책 적용 시 고객 통화 내용과 정책 근거를 명확히 기록해야 함
- 정산 확정 이후 취소는 재정산 플래그 설정 및 운영 승인 필수
- 결제 게이트웨이 환불 실패 시 즉시 로그 기록 및 운영 알림 발생 필요

#### 시나리오 8: 환불 처리
본 시나리오는 다음 케이스를 모두 포함합니다: 취소 후 환불, 서비스 일부 진행 후 부분 환불, 예약금(부분 선결제) 환불, 환불 단독 처리(취소 없이 금액 조정 목적).

1. **관리자 로그인 및 주문관리 메뉴 진입**:
   - 관리자 계정으로 로그인
   - 백오피스 주문관리 메뉴 진입

2. **환불 대상 주문 검색 및 필터링**:
   - 검색 조건:
     - 주문번호
     - 고객 전화번호
     - `order_status` IN (`ASSIGNED`, `CANCELED`)
     - `paid_amount_total > refund_amount_total`
   - 환불 가능 잔액 존재 여부 확인: `remaining_refundable_amount = paid_amount_total - refund_amount_total`

3. **주문 상세 화면 진입 및 결제/상태 정보 확인**:
   - 결제 정보 확인:
     - `total_price`, `paid_amount_total`, `refund_amount_total`
     - `remaining_refundable_amount` 계산
     - 결제 트랜잭션 내역 목록
   - 현재 상태 확인:
     - `order_status`, `expert_progress_status`
     - 정산 확정 여부
     - 서비스 제공 여부

4. **환불 가능 여부 판단 및 정책 적용**:
   - 환불 불가 조건:
     - `remaining_refundable_amount = 0`
     - 결제 미완료 상태
     - 이미 FULL 환불 완료 상태
   - 환불 정책 판단:
     - 취소 후 전액 환불
     - 취소 후 일부 환불
     - 서비스 일부 제공 후 부분 환불
     - 예약금 환불
     - 단순 금액 조정 환불

5. **환불 정보 입력 및 시스템 검증**:
   - "환불" 버튼 클릭
   - 환불 정보 입력:
     - `refund_amount` 입력
     - `refund_reason_code` 선택 (`CUSTOMER_REQUEST`, `SERVICE_DEFECT`, `PRICE_ADJUSTMENT`, `INTERNAL_ERROR`, 기타 정책 코드)
     - 상세 메모 입력
   - 시스템 검증:
     - `refund_amount > 0` 확인
     - `refund_amount ≤ remaining_refundable_amount` 확인
     - 정산 확정 상태일 경우 재정산 플래그 설정 필요

6. **환불 처리 실행 (결제 게이트웨이 연동)**:
   - 결제 게이트웨이 환불 요청:
     - 환불 대상 트랜잭션 선택
     - 트랜잭션 단위 환불 실행
     - 환불 성공 응답 확인
   - 환불 실패 처리:
     - 주문 상태 변경하지 않음
     - 환불 실패 로그 기록
     - 관리자에게 오류 메시지 노출

7. **내부 데이터 업데이트 및 상태 처리**:
   - 환불 성공 시:
     - `refund_amount_total += refund_amount`
     - `refund_type` 판단:
       - `refund_amount_total = paid_amount_total` → `refund_type = FULL`
       - `refund_amount_total < paid_amount_total` → `refund_type = PARTIAL`
     - `order_status` 상태 판단:
       - 기존 `order_status = CANCELED` → 환불 발생 시 `order_status = REFUNDED`
       - 기존 `order_status = ASSIGNED`:
         - 환불이 전체 금액에 해당하면 `REFUNDED`
         - 일부 환불이면 `ASSIGNED` 유지
     - 환불 이력 로그 저장 (`refund_id`, 환불 금액, 환불 사유, 처리자 `admin_id`, 처리 시각)
   - 정산 데이터 반영:
     - 미정산 상태면 자동 차감
     - 정산 확정 상태면 재정산 플래그 설정

8. **상태 조합 정리**:
   - 취소 + 전액 환불: `order_status = REFUNDED`, `refund_type = FULL`
   - 취소 + 일부 환불: `order_status = REFUNDED`, `refund_type = PARTIAL`
   - 진행 중 일부 환불: `order_status = ASSIGNED` 유지, `refund_type = PARTIAL`
   - 예약금만 환불: `order_status = REFUNDED` 또는 `CANCELED` 정책 정의 필요, `refund_type = FULL` 또는 `PARTIAL`

9. **예약금/부분결제 특수 케이스 처리**:
   - 예시: `total_price = 100,000`, `paid_amount_total = 30,000` (예약금)
     - 30,000 전액 환불: `refund_type = FULL`, `order_status = REFUNDED`
     - 15,000 환불: `refund_type = PARTIAL`, `order_status = REFUNDED`
     - 환불 없음: `order_status = CANCELED` 유지

10. **정산 연동 처리**:
    - 환불 금액은 전문가 정산 대상 금액에서 차감
    - 부분 환불 시 전문가 수익 재계산 필요
    - 정산 확정 이후 환불은 재정산 승인 절차 필요

**운영 리스크 통제 포인트**:
- 환불과 취소는 별도 액션이지만 연속적으로 발생할 수 있음
- 환불은 반드시 트랜잭션 단위로 관리되어야 함
- 부분 환불이 여러 번 발생할 수 있도록 누적 구조 필요
- HOLD 상태 주문에 대한 환불은 취소 이후에만 허용하는 것이 안전
- `order_status`와 `refund_type`의 조합은 BI/통계에 명확히 반영되어야 함

#### 시나리오 9: 부분 환불 처리
1. **관리자 로그인 및 주문관리 메뉴 진입**:
   - 관리자 계정으로 로그인
   - 백오피스 주문관리 메뉴 진입

2. **부분 환불 대상 주문 검색**:
   - 검색 조건:
     - `paid_amount_total > 0`
     - `refund_amount_total < paid_amount_total`
     - `order_status` IN (`ASSIGNED`, `CANCELED`, `REFUNDED`)
   - 부분 환불 가능 잔액 확인: `remaining_refundable_amount = paid_amount_total - refund_amount_total`

3. **주문 상세 화면 진입 및 결제/상태 정보 확인**:
   - 결제 정보 확인:
     - `total_price`, `paid_amount_total`, `refund_amount_total`
     - `remaining_refundable_amount` 계산
     - 결제 트랜잭션 목록
   - 서비스 진행 상태 확인:
     - `expert_progress_status`
     - 서비스 완료 여부
     - 정산 확정 여부

4. **부분 환불 필요 사유 확인 및 정책 검토**:
   - 대표 케이스:
     - 서비스 일부 미제공
     - 현장 추가 비용 미발생
     - 고객 컴플레인 보상
     - 가격 조정
     - 예약금 일부 반환
   - 환불 정책 기준 검토:
     - 환불율
     - 서비스 제공 범위 대비 차감 금액
     - 내부 승인 필요 여부

5. **부분 환불 정보 입력 및 시스템 검증**:
   - "부분 환불" 버튼 클릭
   - 환불 정보 입력:
     - `refund_amount` 입력
     - `refund_reason_code` 선택
     - 상세 메모 입력
   - 시스템 검증:
     - `refund_amount > 0` 확인
     - `refund_amount < remaining_refundable_amount` 확인
     - `refund_amount ≤ paid_amount_total` 확인
     - 정산 확정 상태인 경우 경고 메시지 표시

6. **부분 환불 처리 실행 (결제 게이트웨이 연동)**:
   - 결제 게이트웨이 부분 환불 요청:
     - 특정 트랜잭션 선택 또는 자동 분배
     - 환불 요청 실행
     - 환불 성공 응답 수신

7. **내부 데이터 업데이트 및 상태 처리**:
   - 환불 성공 시:
     - `refund_amount_total += refund_amount`
     - `refund_type = PARTIAL` 설정
     - 환불 이력 테이블에 row 생성 (`refund_id`, 환불 금액, 환불 사유, 처리자, 처리 시각)
   - `order_status` 처리:
     - 기존 `order_status = ASSIGNED` → `ASSIGNED` 유지
     - 기존 `order_status = CANCELED` → `REFUNDED`로 변경
     - 기존 `order_status = REFUNDED` → `REFUNDED` 유지

8. **정산 반영**:
   - 정산 미확정 상태:
     - 전문가 정산 대상 금액에서 환불 금액 차감
     - 수수료 재계산
   - 정산 확정 상태:
     - 재정산 플래그 설정
     - 운영 승인 후 정산 조정

9. **다회차 부분 환불 처리**:
   - `refund_amount_total < paid_amount_total` 인 경우:
     - 추가 부분 환불 가능
   - `refund_amount_total = paid_amount_total` 인 경우:
     - 더 이상 부분 환불 불가
     - 사실상 FULL 환불 상태
   - 마지막 환불로 `paid_amount_total`과 동일해질 경우:
     - `refund_type = FULL`로 자동 전환 가능
     - `order_status = REFUNDED` 유지

10. **예약금 특수 케이스 및 부분 환불 예시**:
    - 예시: `total_price = 100,000`, `paid_amount_total = 30,000` (예약금)
      - 10,000 환불: `refund_amount_total = 10,000`, `refund_type = PARTIAL`, `order_status = REFUNDED`
      - 이후 20,000 추가 환불: `refund_amount_total = 30,000`, `refund_type = FULL`, 상태 정합성 유지

11. **상태 정합성 정리**:
    - 부분 환불은 `refund_type = PARTIAL`로 관리
    - `order_status`는 환불이 발생하면 `REFUNDED`가 될 수 있음
    - 진행 중 일부 환불은 `order_status = ASSIGNED` 유지 가능
    - `CANCELED` 상태에서 부분 환불 발생 시 `REFUNDED` 전환

**운영 리스크 통제 포인트**:
- 부분 환불은 반드시 `remaining_refundable_amount` 기반 검증 필요
- 다회 환불 누적 오류 방지
- 정산 확정 이후 환불은 승인 프로세스 필요
- 서비스 완료 후 부분 환불은 전문가 수익 재계산 필요
- BI 집계 시 `PARTIAL`과 `FULL` 환불 분리 집계 필요

#### 시나리오 10: 결제 링크 재발송
본 시나리오는 다음 상황을 포함합니다: 상담 후 결제 대기 상태, 예약금 결제 링크 재발송, 잔금 결제 링크 재발송, 결제 링크 만료 후 재생성, 고객 분실/미수신으로 인한 재전송.

1. **관리자 로그인 및 주문관리 메뉴 진입**:
   - 관리자 계정으로 로그인
   - 백오피스 주문관리 메뉴 진입

2. **결제 대기 주문 검색**:
   - 검색 조건:
     - `expert_progress_status = WAIT_PAYMENT`
     - 또는 `payment_status = UNPAID`
     - `order_status = ASSIGNED`

3. **주문 상세 화면 진입 및 결제 정보 확인**:
   - 결제 정보 확인:
     - `total_price`, `paid_amount_total`, `remaining_payable_amount`
     - 기존 결제 링크 발송 이력
     - 결제 링크 만료 여부
     - 결제 트랜잭션 상태

4. **재발송 필요 사유 확인**:
   - 고객이 링크 미수신
   - 결제 링크 만료
   - 금액 수정 후 신규 링크 필요
   - 예약금 → 잔금 결제 전환
   - 일부 결제 후 잔여 금액 결제

5. **결제 링크 재생성 여부 판단**:
   - 기존 링크 유효 여부 확인:
     - 만료되지 않은 링크: 단순 재전송 가능
     - 만료된 링크: 신규 링크 생성 필요
   - 금액 변경 여부 확인:
     - 금액 변경 없음: 기존 결제 금액 기준
     - 금액 변경 있음: 결제 금액 재산정, 신규 링크 필수 생성

6. **결제 링크 재발송 실행 및 시스템 검증**:
   - "결제 링크 재발송" 버튼 클릭
   - 시스템 검증:
     - `remaining_payable_amount > 0` 확인
     - `order_status = ASSIGNED` 확인
     - `CANCELED` 또는 `REFUNDED` 상태가 아님 확인

7. **결제 링크 생성 로직**:
   - 결제 대상 금액 계산:
     - 예약금 결제 단계: `payable_amount = 예약금`
     - 잔금 결제 단계: `payable_amount = total_price - paid_amount_total`
     - 부분 조정 결제: `payable_amount = 수정된 잔여 금액`
   - 결제 트랜잭션 생성:
     - `payment_intent` 생성
     - `order_id` 매핑
     - 금액 및 만료시간 설정
     - 결제 URL 생성
   - 결제 링크 이력 저장: `payment_link_id`, 생성 시각, 만료 시각, 생성자 `admin_id`, 결제 금액

8. **고객에게 링크 발송**:
   - 발송 채널 선택: SMS, 카카오 알림톡, 이메일, 앱 푸시
   - 발송 실행
   - 발송 성공 여부 기록

9. **상태 유지 및 대기**:
   - `expert_progress_status` 유지 = `WAIT_PAYMENT`
   - `order_status` 유지 = `ASSIGNED`
   - 결제 완료 이벤트 대기

10. **결제 완료 시 후속 처리 (연동 시나리오)**:
    - 결제 성공 이벤트 수신
    - `paid_amount_total` 업데이트
    - `remaining_payable_amount` 재계산
    - 전액 결제 완료 시: `expert_progress_status` → `CONFIRMED`, 구매확정 단계로 전환
    - 일부 결제 완료 시: `expert_progress_status` 유지 또는 단계별 정책 적용

11. **예외 케이스 처리**:
    - 주문이 `CANCELED` 상태일 경우: 결제 링크 재발송 불가
    - `REFUNDED` 상태일 경우: 신규 결제 링크 생성 불가
    - `HOLD` 상태 주문: `assignment_delivery_status = HOLD` 인 경우, 결제 링크 발송은 원칙적으로 상담 후에만 허용
    - 금액 수정 직후: 반드시 기존 결제 링크 만료 처리 후 신규 링크 생성

**운영 리스크 통제 포인트**:
- 동일 주문에 대해 복수 활성 결제 링크가 동시에 존재하면 안 됨
- 결제 금액 변경 시 이전 링크는 자동 비활성화 필요
- 부분 결제 구조에서는 `remaining_payable_amount` 기반 계산 필수
- 결제 링크 만료 정책 명확화 필요 (예: 24시간)
- 결제 완료 이벤트는 반드시 idempotent 처리 필요

