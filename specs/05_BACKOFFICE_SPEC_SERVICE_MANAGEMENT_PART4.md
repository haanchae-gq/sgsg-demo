**이 문서는 [백오피스 스펙 개요](./05_BACKOFFICE_SPEC_OVERVIEW.md)의 분할 문서입니다.**

← [서비스 관리 파트3](./05_BACKOFFICE_SPEC_SERVICE_MANAGEMENT_PART3.md) | [운영 및 시스템 관리](./05_BACKOFFICE_SPEC_OPERATIONS_SYSTEM.md) →

---

#### 시나리오 15: 일정 변경에 따른 주문 정보 수정
본 시나리오는 예약/방문 일정이 변경될 때
 주문 정보와 일정(캘린더) 정보를 어떻게 함께 수정·동기화할지에 대한 운영 절차를 정의한다.
1. **관리자 로그인**:
 - 운영 계정으로 백오피스에 로그인한다
 - 로그인 성공 후 메뉴 02 주문관리로 이동한다
2. **일정 변경 요청이 들어온 주문 검색**:
- 검색 조건 설정
   - 주문번호로 검색
   - 고객 전화번호로 검색
   - `service_date`(예약일) 기준으로 오늘/내일 일정 필터
   - `expert_progress_status` IN (RESERVED, IN_SERVICE, AS_REQUEST) 등 일정이 연관된 상태만 필터
- 검색 결과에서 일정 변경 요청이 들어온 주문을 선택한다
3. **주문 상세 화면 진입 및 현재 상태 확인**:
- 주문 상세 화면 진입
 - 기본 정보 확인
   - `order_status` (ASSIGNED, CANCELED 등)
   - `expert_progress_status` (RESERVED, IN_SERVICE 등)
   - `assignment_delivery_status` (SENT/HOLD 등)
   - 현재 `service_date`, `service_time` 정보
   - 배정된 `expert_master_id`, `expert_worker_id`
- 일정 이벤트 연동 여부 확인
   - 해당 주문과 연결된 캘린더 이벤트 존재 여부
   - `event_type` (SERVICE / AS)
   - `event_start_time`, `event_end_time`
4. **일정 변경 요청 내용 파악**:
- 고객 또는 전문가로부터 전달받은 변경 내용 확인
   - 날짜 변경 요청 (예: 3/10 → 3/12)
   - 시간대 변경 요청 (예: 오전 → 오후)
   - 동일 일자 내 시간만 이동
   - 날짜 + 시간 모두 변경
- 추가 조건 확인
   - 당일/당일 직전 변경인지 여부 (페널티/정책 연동 가능)
   - 주소 변경 수반 여부 (`region_group` 변경 여부 확인)
   - 기존 전문가 일정과의 충돌 가능성
5. **변경 가능 여부 검토**:
- 상태 기반 검토
   - `expert_progress_status` = RESERVED 인 경우: 일반적인 일정 변경 허용
   - `expert_progress_status` = IN_SERVICE 인 경우: 원칙적으로 일정 변경이 아닌 "실제 서비스 중"이므로, 시간 변경보다는 이력 메모 위주 처리
   - `expert_progress_status` = CONFIRMED 인 경우: 서비스 종료로 간주, 일정 변경 불가 (예외 시 강제 상태 수정 시나리오 연계)
- 전문가 스케줄 기반 검토
   - 동일 전문가의 해당 시간대 다른 서비스 일정 유무 확인
   - 충돌 시, 다른 시간 제안 또는 재배정 필요 여부 판단
- 채널/정책 기반 검토
   - 채널별 일정 변경 가능 마감 시간 확인
   - 일정 변경 수수료/제한 정책 존재 시 해당 여부 확인
6. **일정 변경 실행 – 기본 케이스 (주소/권역 불변, 전문가 유지)**:
- "일정 변경" 액션 클릭
 - 새로운 날짜/시간 입력
   - `service_date`_new, `service_time`_new 선택
   - 시스템에서 과거 시점, 영업 불가 시간대 차단
- 시스템 처리 – 주문 정보 업데이트
   - 주문의 `service_date`, `service_time`을 새로운 값으로 업데이트
   - `expert_progress_status`는 RESERVED 상태 유지
   - `order_status`, `assignment_delivery_status`는 변경 없음
- 시스템 처리 – 캘린더 이벤트 업데이트
   - 기존 이벤트를 삭제하지 않고 start_time, end_time을 수정한다
   - event 변경 이력을 event_history에 기록한다(이전 시간 → 변경 시간)
   - 전문가웹/앱의 일정 화면에서 해당 이벤트가 새 시간으로 표시된다
- 알림 발송
   - 고객에게 일정 변경 알림 발송 (SMS/알림톡 등)
   - 전문가에게 일정 변경 알림 발송 (앱 푸시 등)
- 메모 기록
   - 주문 메모에 일정 변경 사유 및 변경 전/후 시간을 기록한다
   - `memo_type` = SCHEDULE_CHANGE 로 저장
7. **일정 변경 실행 – 주소/권역 변경이 수반되는 케이스**:
- 고객 주소 변경 요청 확인
   - `address`, 상세주소, 동/호수 변경 여부 확인
   - `region_group`이 변경되는지 여부 확인
- `region_group` 변경 여부 판단
   - 기존 주소 기반 `region_group`_old
   - 변경된 주소 기반 `region_group`_new
   - `region_group`_old ≠ `region_group`_new 인 경우, 기존 전문가가 해당 권역을 지원하는지 확인
- 기존 전문가가 새 권역 지원 불가인 경우
   - 현재 배정을 해제해야 할지 판단
   - 정책에 따라 다음 중 하나 선택
     - 기존 전문가 유지(예외 허용)
     - 기존 배정 취소 후 UNASSIGNED로 되돌려 재배정(재배정 시나리오 연계)
- 주소 정보 및 `region_group` 업데이트
   - 주문의 `address`, `region_group` 값을 새로운 값으로 수정
   - 고객 기본 주소와 동기화 여부는 별도 정책에 따름
- 캘린더 이벤트 반영
   - 동일 전문가 유지 시: 이벤트 시간/장소 메모만 수정
   - 전문가 변경 시: 기존 이벤트 is_active = false 처리, 새 전문가 기준으로 신규 이벤트 생성
- 메모 기록
   - 주소/권역 변경 사유 및 전문가 유지/변경 여부 기록
   - 정책 예외가 있었다면 반드시 명시
8. **일정 변경 실행 – 전문가 교체가 수반되는 케이스**:
- 일정 변경 요청 + 기존 전문가 일정 충돌 발생
   - 새 시간대에 해당 전문가의 다른 예약이 이미 존재
   - 또는 전문가가 해당 시간에 불가 응답
- 전문가 재배정 필요 여부 판단
   - 고객이 날짜/시간 변경보다 전문가 교체를 우선하는지 확인
   - 동일 권역 내 다른 전문가 후보 탐색
- 전문가 변경 처리
   - 기존 주문 배정 해제
     - `order_status`: ASSIGNED → UNASSIGNED (필요 시)
     - `expert_master_id`, `expert_worker_id` 초기화 또는 변경
     - `assignment_delivery_status`: SENT → NONE
     - `order_assignment_history`에 REASSIGN_FROM_SCHEDULE_CHANGE 기록
  - 새 전문가 배정
     - 자동/수동 배정 로직을 사용해 새 전문가 선택
     - ASSIGNED 및 SENT 상태로 전환
     - 새 전문가 기준 캘린더 이벤트 생성
- 고객/전문가 알림
   - 전문가 교체 사실 + 변경된 방문 일정 고객에게 안내
   - 새 전문가에게 신규 일정 알림 발송
- 메모 기록
   - 일정 변경으로 인한 전문가 교체 사유 기록
   - 고객 동의 여부, 통화 내용 저장

9. **일정 변경 불가 케이스 처리**:
- 일정 변경 요청이 정책 범위를 벗어나거나
   - 너무 임박한 시간(예: 방문 1시간 전)
   - 이미 서비스 완료/구매확정 상태
   - 정산 확정 이후 특별 변경 요청
- 변경 불가 안내
   - 고객에게 불가 사유 설명
   - 필요 시 취소/환불/재예약 대안 제시
- 메모 기록
   - 일정 변경 요청 거절 사유 기록
   - 향후 CS 이력 확인용
10. **운영 리스크 및 정책 포인트**:
- 일정 변경은
   - 주문의 `service_date`/time
   - 전문가 캘린더 이벤트
   - 전문가 배정 상태
 를 동시에 다루므로, 반드시 트랜잭션/동기화 고려가 필요하다
- 일정 변경 이력이 많을수록 CS/품질 이슈 가능성이 있으므로
   - 주문별 일정 변경 횟수를 집계
   - 특정 고객/전문가/채널에서 빈번하게 발생하는지 통계로 관리
- 당일/임박 변경에 대한 수수료, 패널티, 페널티 점수 등은 별도 정책 문서와 연동
- 강제 일정 변경(운영이 임의로 전문가나 일정을 바꾼 경우)은
   - 반드시 메모와 함께 남기고
   - 필요 시 "강제 상태 수정" 시나리오와 연계해 감사 가능해야 한다

#### 시나리오 16: 서비스 금액 수정(상담 후 금액 조정)
본 시나리오는 상담 과정 또는 운영 개입에 의해 주문의 `total_price`를 변경해야 하는 경우를 정의한다.
본 기능은 결제·환불·정산에 직접적인 영향을 미치므로 권한 기반 접근 제어가 필요하다.
1. **관리자 로그인**:
- 금액 수정 권한을 보유한 관리자 계정으로 로그인한다
 - 권한이 없는 계정에는 "금액 수정" 버튼이 노출되지 않는다
2. **주문 상세 화면 진입**:
- 주문관리 메뉴에서 대상 주문을 검색한다
 - 주문 상세 화면으로 이동한다
 - 현재 금액 상태 확인
  - `total_price`
   - `paid_amount_total`
   - `refund_amount_total`
   - `remaining_payable_amount` = `total_price` - `paid_amount_total`
   - 결제 트랜잭션 내역
3. **금액 수정 가능 여부 판단**:
- 금액 수정 불가 상태
  - `order_status` = REFUNDED 이고 `refund_amount_total` = `paid_amount_total` 인 경우
   - 정산 확정 완료 상태에서 환불 없이 금액 하향 조정 시
   - 법적 분쟁으로 잠금 처리된 주문
- 금액 수정 허용 상태
  - 결제 전 상태
   - 일부 결제 상태
   - 전액 결제 상태이지만 환불 가능 상태
   - 서비스 진행 전 상태
4. **금액 수정 액션 실행**:
- "금액 수정" 버튼 클릭
 - 수정 입력 팝업 노출
  - 기존 `total_price` 표시
   - 신규 `total_price` 입력 필드
   - 변경 사유 코드 선택
    - OPTION_CHANGE
     - PRICE_ADJUSTMENT
     - DISCOUNT_APPLIED
     - INPUT_ERROR
     - INTERNAL_EXCEPTION
  - 상세 사유 메모 입력 필수
5. **시스템 사전 검증**:
- 신규 `total_price` ≥ 0 확인
- `paid_amount_total`와의 관계 검증
  - 신규 `total_price` ≥ `paid_amount_total` 인 경우
 → 추가 결제 필요 또는 정상 유지
  - 신규 `total_price` < `paid_amount_total` 인 경우
 → 초과 결제 발생
 → 부분 환불 필요 경고 표시
- `refund_amount_total`와의 관계 검증
  - `refund_amount_total` > 신규 `total_price` 인 경우 차단
6. **금액 수정 분기 처리**:
- 케이스 A: 결제 전 금액 수정
  - `total_price`를 신규 값으로 업데이트
   - `remaining_payable_amount` 재계산
   - 기존 발송된 결제 링크 자동 만료 처리
   - 필요 시 신규 결제 링크 발송 가능 상태 유지
   - `order_status`, `expert_progress_status` 변경 없음
- 케이스 B: 일부 결제 상태에서 금액 상향 조정
  - `total_price` 증가
   - `remaining_payable_amount` 증가
   - 기존 결제 트랜잭션 유지
   - 추가 결제 링크 발송 필요
   - `expert_progress_status` = WAIT_PAYMENT 유지
- 케이스 C: 일부 결제 상태에서 금액 하향 조정
  - 신규 `total_price` ≥ `paid_amount_total` 인 경우
 → `remaining_payable_amount` 감소
 → 추가 환불 없음
  - 신규 `total_price` < `paid_amount_total` 인 경우
 → 초과 결제 금액 = `paid_amount_total` - 신규 `total_price`
 → 자동 부분 환불 실행 여부 선택
    - 즉시 부분 환불 실행
     - 환불 예약 상태로 전환
- 케이스 D: 전액 결제 완료 상태에서 금액 하향 조정
  - 초과 금액 발생
   - 초과 금액 = `paid_amount_total` - 신규 `total_price`
   - 부분 환불 시나리오 9로 자동 연계
   - `refund_type` = PARTIAL
7. **데이터 업데이트 처리**:
- `total_price` 업데이트
 - `remaining_payable_amount` 재계산
 - 필요 시 `refund_amount_total` 업데이트
 - 금액 변경 이력 기록
  - `event_type` = PRICE_UPDATED
   - old_`total_price`
   - new_`total_price`
   - `admin_id`
   - 변경 시각
- 주문 메모 자동 생성
  - `memo_type` = PRICE_CHANGE
   - 변경 전/후 금액 기록
   - 사유 코드 및 상세 사유 저장
8. **정산 연동 처리**:
- 정산 미확정 상태
  - 전문가 정산 예정 금액 재계산
   - 수수료 재산정
- 정산 확정 상태
  - 재정산 필요 플래그 설정
   - 관리자 승인 후 반영
9. **알림 처리**:
- 고객 알림
  - 금액 증가 시 추가 결제 요청 알림
   - 금액 감소 및 환불 시 환불 안내 알림
- 전문가 알림
  - 금액 변경이 정산 금액에 영향을 주는 경우 알림
10. **운영 리스크 통제 포인트**:
- 금액 수정은 환불/정산과 직결되므로 감사 로그 필수
 - 결제 링크가 존재하는 경우 반드시 기존 링크 무효화 처리 필요
 - 금액 변경 후 결제/환불 불일치가 발생하지 않도록 트랜잭션 처리
 - BI 통계에서 "원래 금액"과 "최종 금액"을 구분 저장 권장
 - 반복 금액 변경 주문은 이상 패턴으로 모니터링 필요

#### 시나리오 17: 수동 전문가 변경(운영 직접 교체)
본 시나리오는 자동 재배정이 아닌,  운영자가 특정 전문가를 지정하여 배정을 교체하는 경우를 정의한다.
본 기능은 일반 배정과 달리 "강제 배정" 성격을 가지며, 배정 정책을 우회할 수 있으므로 권한 통제가 필요하다.
1. **관리자 로그인**:
- "전문가 수동 변경 권한"을 보유한 계정으로 로그인한다
 - 권한이 없는 계정에는 "전문가 변경" 버튼이 노출되지 않는다
2. **주문 상세 화면 진입**:
- 주문관리 메뉴에서 대상 주문을 검색한다
 - 주문 상세 화면에 진입한다
 - 현재 배정 상태 확인
  - `order_status`
   - `expert_progress_status`
   - `assignment_delivery_status`
   - `expert_master_id`
   - `region_group`
   - `service_date` / `service_time`
3. **수동 변경 가능 여부 판단**:
- 변경 불가 상태
  - `order_status` = CANCELED
   - `order_status` = REFUNDED
   - `expert_progress_status` = CONFIRMED (서비스 종료)
   - 정산 확정 완료 상태
- 변경 가능 상태
  - ASSIGNED 상태
   - `assignment_delivery_status` = HOLD 또는 SENT
   - UNASSIGNED 상태에서도 직접 지정 가능
4. **전문가 변경 액션 실행**:
- "전문가 변경" 버튼 클릭
 - 전문가 선택 팝업 노출
  - 필터 조건
     - `region_group` 일치
     - 서비스 카테고리 수행 가능 여부
     - 활성 전문가만 표시
     - 멤버십 여부 표시
  - 일정 충돌 체크 기능 제공
     - 해당 날짜/시간 기존 예약 여부 표시
     - 충돌 시 경고 메시지 노출
5. **변경 사유 입력**:
- 사유 코드 선택 필수
  - CUSTOMER_REQUEST
   - EXPERT_REQUEST
   - SCHEDULE_CONFLICT
   - QUALITY_ISSUE
   - INTERNAL_EXCEPTION
- 상세 사유 메모 입력 필수
6. **상태 전환 처리 로직**:
- 기존 전문가 배정 해제
  - 기존 `expert_master_id` 저장
   - 기존 `assignment_delivery_status` 종료 처리
   - 기존 전문가 일정 이벤트 is_active = false
   - `order_assignment_history`에 type = MANUAL_UNASSIGN 기록
- 신규 전문가 배정
  - `order_status` = ASSIGNED 유지
   - `expert_master_id` = 신규 전문가 ID
   - `assignment_delivery_status` = SENT
   - `expert_progress_status` = NEW_ASSIGN
   - `order_assignment_history`에 type = MANUAL_ASSIGN 기록
   - 배정 시각 기록
7. **HOLD 상태 주문의 수동 변경**:
- `assignment_delivery_status` = HOLD 상태인 경우
  - 기존 HOLD 배정 전문가 제거
   - 신규 전문가 지정 시
     - 멤버십 전문가일 경우 HOLD 유지 가능
     - 일반 전문가일 경우 즉시 SENT 처리
  - HOLD 변경 이력 별도 기록
8. **캘린더 및 일정 처리**:
- 기존 전문가 일정 삭제 또는 비활성화
 - 신규 전문가 기준으로 신규 일정 이벤트 생성
 - 전문가웹/앱 캘린더에 즉시 반영
9. **알림 처리**:
- 기존 전문가에게 배정 해제 알림 발송
 - 신규 전문가에게 신규 배정 알림 발송
 - 고객에게 전문가 변경 안내 발송 여부는 정책 선택
10. **자동 배정 로직과의 관계**:
- 수동 변경은 자동 라운드로빈 포인터에 영향을 주지 않는다
 - 수동 변경된 주문은 재배정 자동 트리거 대상에서 제외 가능
 - 멤버십 우선 정책을 우회할 수 있으므로 변경 이력 필수 기록
11. **정산 연동**:
- 정산은 최종 수행 전문가 기준으로 계산
 - 변경 전 전문가에게는 정산 영향 없음
 - 이미 일부 서비스 진행된 경우 예외 처리 필요
12. **이력 및 감사 로그**:
- `event_type` = MANUAL_EXPERT_CHANGE 기록
 - 이전 전문가 ID
 - 신규 전문가 ID
 - 변경 사유 코드
 - `admin_id`
 - 변경 시각
- 주문 메모 자동 생성
   - `memo_type` = EXPERT_CHANGE

13. **운영 리스크 통제 포인트**:
- 수동 변경은 배정 통계에 왜곡을 줄 수 있음
 - 멤버십 우선 정책을 무력화할 수 있으므로 남용 방지 필요
 - 일정 충돌 무시 배정은 시스템에 명확히 표시 필요
### 관리자 개입 기능
1. **전문가 재배정**: 현재 전문가에서 다른 전문가로 변경 (동일 서비스 지역 필터)
2. **환불 처리**: 전체/부분 환불, 환불 사유 입력, Hecto 환불 API 호출
3. **주문 취소**: 고객/전문가 요청 시 강제 취소, 취소 수수료 정책 적용
4. **수동 상태 변경**: 특수 상황에서 상태 강제 변경 (활동 로그 기록)
5. **엑셀 업로드/다운로드**: 주문 데이터 일괄 등록 및 추출
6. **배치 작업**: 대량 주문 상태 변경, 메모 추가 등
---



