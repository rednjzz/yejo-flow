# 프롬프트: 도급계약 관리 기능 확장

## 배경

실제 공사도급계약서를 분석한 결과, 현재 `Contract` 모델에 누락된 필드와 기능이 있다.
아래 계약서 데이터를 기준으로 도급계약 관리 기능을 확장해야 한다.

---

## 실제 계약서 데이터 (양벌동 55-9 근생 증축공사)

| 항목 | 값 |
|------|-----|
| 공사명 | 양벌동 55-9 근생 증축공사 |
| 공사현장 | 경기도 광주시 양벌동 55-9 |
| 착공일 | 2024-12-23 |
| 준공일 | 2025-03-31 (기상악화로 연장 가능) |
| 계약금액 | ₩127,600,000 |
| 공급가액 | ₩116,000,000 |
| 부가가치세 | ₩11,600,000 |
| 결제방법 | 착수금 40% (₩51,040,000, 계약후 15일이내) / 중도금 40% (₩51,040,000, 2층 바닥 con.c타설 후) / 잔금 20% (₩25,520,000, 준공후 15일이내) — *중도금은 공사 규모에 따라 1차·2차·3차 등 여러 건으로 분할될 수 있음* |
| 하자책임기간 | 24개월 |
| 하자보증보율 | 보증보험증권 (계약금액의 3%) |
| 지체상환율 | 0.1%/일, 총 상한 계약금액의 3% |
| 도급인 | 문용하 (경기도 광주시 양벌동 55-9, 사업자번호 820-23-01703) |
| 수급인 | (주)예조종합건설 대표이사 이규섭 (경기도 광주시 곤지암읍 광여로 63, 201호) |
| 계약일 | 2024-12-10 |

---

## 현재 스키마와의 Gap 분석

### Contract 테이블 (현재)
- `contract_no`, `contract_type`, `change_seq`, `contract_date`, `contract_amount`, `change_amount`, `description`

### 누락된 항목
1. **공급가액 / 부가세 분리** — 현재 `contract_amount`만 존재. 공급가액(`supply_amount`)과 부가세(`vat_amount`) 분리 필요
2. **결제조건 (Payment Terms)** — 착수금/중도금/잔금의 비율, 금액, 지급조건을 별도 테이블로 관리 필요. 중도금은 공사 규모에 따라 여러 건(1차, 2차, 3차...)으로 분할 가능
3. **하자책임기간** — `defect_liability_months` (개월 수)
4. **하자보증보율** — `defect_warranty_rate` (%, 보증보험증권 금액 산출 기준)
5. **지체상환율** — `late_penalty_rate` (일률), `late_penalty_cap_rate` (상한율)
6. **공사기간 연장 사유** — 기상악화 등 연장 가능 조건 기록
7. **계약서 파일 첨부** — 체결된 계약서 원본(PDF/스캔본)을 첨부할 수 있어야 함. 변경계약 시 변경계약서도 별도 첨부. (기존 `Document` 도메인 모델과의 혼동을 피하기 위해 `contract_files`로 명명)
8. **변경계약 처리 규칙** — 변경계약 시 금액·결제조건·계약조건이 어떻게 변경되는지 명확한 규칙 필요

> 참고: 도급인(발주처)은 `project.client`로 이미 관리됨. 수급인(시공사)은 항상 자사이므로 별도 필드 불필요.

### Projects 테이블 중복 필드 정리

현재 `projects` 테이블에 `contract_amount`, `vat_amount`, `advance_amount`, `advance_rate`, `retention_rate`가 존재한다. Contract 확장 후 정본(Single Source of Truth)은 **Contract 및 ContractPaymentTerm**으로 이전하며, Project의 해당 필드는 다음과 같이 처리한다:

| Project 필드 | 처리 방침 |
|---|---|
| `contract_amount` | 유지. `project.latest_contract.contract_amount`로부터 동기화하는 콜백 또는 서비스에서 갱신. 목록 조회 시 JOIN 비용을 줄이기 위한 요약 캐시 역할. |
| `vat_amount` | 유지. 동일하게 요약 캐시. |
| `advance_amount`, `advance_rate` | **이번 작업에서 제거**. `ContractPaymentTerm`으로 완전 대체. |
| `retention_rate` | 유지. 하자보수 보증금 비율은 프로젝트 레벨 설정으로 남겨둠. |

### 변경계약 처리 방식

현재 Contract 모델은 `contract_type`(original/change)과 `change_seq`(차수)로 원도급과 변경계약을 분리하고 있다. **변경계약은 별도 레코드로 생성**한다 (실제 변경계약서도 별도 문서로 체결되므로).

| 항목 | 원도급 | 변경계약 |
|------|--------|----------|
| `contract_amount` | 원 계약금액 | **변경 후** 총 계약금액 |
| `supply_amount` | 원 공급가액 | **변경 후** 총 공급가액 |
| `vat_amount` | 원 부가세 | **변경 후** 총 부가세 |
| `change_amount` | null | 증감액 (+/-) = 본 계약금액 - **직전 계약**금액 |
| `ContractPaymentTerm` | 원 결제조건 | 변경 후 결제조건 (새로 등록) |
| `defect_liability_months` 등 | 원 조건 | 변경 시 해당 값 기입, 변경 없으면 null |
| `contract_files` | 원도급 계약서 | 변경계약서 첨부 |

**핵심 규칙:**
- 프로젝트의 **현재 유효 계약** = 가장 높은 `change_seq`의 계약 (원도급이면 원도급 자체)
- 현재 유효 계약금액 = `latest_contract.contract_amount`
- **`change_amount` 산출 기준**: 변경계약의 `change_amount` = 해당 계약의 `contract_amount` - **직전 계약**(previous_contract)의 `contract_amount`. 예) 원도급 1억 → 1차 변경 1.2억 → change_amount = +2천만, 2차 변경 1.15억 → change_amount = -5백만
- 하자책임기간 등 계약조건 → 변경계약에 값이 있으면 해당 값, null이면 원도급 값 참조
- 결제조건 → 각 Contract가 자체 `contract_payment_terms`를 소유. 현재 유효 결제조건 = 최신 계약의 것

---

## 프롬프트

```
@docs/domain.md @docs/schema.md

## 요청사항

도급계약서의 실제 데이터 구조를 반영하여 Contract 모델을 확장해줘.

### 1단계: Contract 테이블 필드 추가 (마이그레이션)

다음 필드를 `contracts` 테이블에 추가하는 마이그레이션을 생성해줘:

- `supply_amount` (bigint, null: false) — 공급가액
- `vat_amount` (bigint, null: false) — 부가가치세
- `defect_liability_months` (integer) — 하자책임기간(개월)
- `defect_warranty_rate` (decimal, precision: 5, scale: 2) — 하자보증보율(%)
- `late_penalty_rate` (decimal, precision: 5, scale: 3) — 지체상환율(%/일)
- `late_penalty_cap_rate` (decimal, precision: 5, scale: 2) — 지체상환금 상한율(%)
- `period_note` (text) — 공기 관련 특기사항 (예: "기상악화로 공기 연장 가능")
- `special_conditions` (text) — 계약 특이사항 (계약서 9번 "특기사항 첨부" 등 자유 기술)

기존 `contract_amount`는 공급가액+부가세 합계(총 계약금액)로 유지한다.

> **⚠ 금액 필드 타입**: 건설 계약은 수십억~수백억 규모가 가능하므로, 모든 금액 필드는 `bigint`를 사용한다. PostgreSQL `integer`의 최대값은 약 21.5억원으로 대규모 공사에서 오버플로우 위험이 있다. 기존 `contract_amount`(integer) 및 `projects.contract_amount`(integer)도 `bigint`로 변경하는 마이그레이션을 별도 포함한다.

> **⚠ 기존 데이터 마이그레이션**: `supply_amount`와 `vat_amount`는 `null: false`이므로, 기존 Contract 레코드의 백필이 필요하다. 마이그레이션에서 다음과 같이 처리한다:
> 1. 먼저 컬럼을 `null: true`로 추가
> 2. 기존 데이터 백필: `supply_amount = (contract_amount / 1.1).floor`, `vat_amount = contract_amount - supply_amount` (부가세 10% 기준 역산)
> 3. `change_column_null`로 `null: false` 제약 추가

### 2단계: 결제조건(ContractPaymentTerm) 모델 신규 생성

계약별 결제 조건(착수금, 중도금, 잔금 등)을 관리하는 `ContractPaymentTerm` 모델을 생성해줘.

**인덱스:**
- `[contract_id, term_type, seq]` 유니크 인덱스 (DB 레벨 유니크 보장)
- `[contract_id]` 외래키 인덱스

**중도금 지급 방식은 크게 두 가지가 있다:**
- **기성 방식(monthly_billing)**: 매월 기성 청구 금액에 따라 지급. 사전에 건수·금액이 정해지지 않으며, 실제 기성 승인 금액 기준으로 지급됨.
- **분할 방식(milestone)**: 공정 마일스톤(예: "2층 바닥 타설 후")에 따라 사전 약정된 비율/금액으로 지급. 1차·2차·3차 등 여러 건으로 분할 가능.

- `contract_id` (references, null: false) — 소속 계약
- `term_type` (string, null: false) — 구분: advance(착수금), interim(중도금), final(잔금)
- `seq` (integer, null: false, default: 1) — 동일 term_type 내 차수 (착수금 1, 중도금 1차·2차·3차, 잔금 1)
- `interim_method` (string) — 중도금 지급 방식: milestone(마일스톤 분할) / monthly_billing(월기성). term_type이 interim일 때만 사용.
- `rate` (decimal, precision: 5, scale: 2) — 비율(%). 월기성의 경우 null 허용 (기성 금액에 따라 유동적)
- `amount` (bigint) — 금액. 월기성의 경우 null 허용 (기성 금액에 따라 유동적)
- `condition` (string) — 지급 조건 (예: "계약후 15일이내", "2층 바닥 con.c타설 후", "매월 기성 청구 승인 후")
- `due_date` (date) — 지급 예정일 (선택)
- `paid_date` (date) — 실제 지급일 (선택)
- `paid_amount` (bigint) — 실제 지급 금액 (선택)
- `sort_order` (integer, null: false, default: 0) — 정렬 순서

비즈니스 규칙:
- term_type은 advance, interim, final만 허용
- interim_method는 milestone, monthly_billing만 허용 (term_type이 interim일 때 필수)
- **하나의 계약 내 중도금은 모두 동일한 `interim_method`여야 한다** (마일스톤과 월기성 혼재 불가)
- advance와 final은 각 1건만 허용, interim은 복수 건 허용
- `[contract_id, term_type, seq]` 조합은 유니크해야 한다 → **DB 레벨 유니크 인덱스 필수**
- **마일스톤 분할 방식**: 모든 ContractPaymentTerm의 비율 합계 = 100%, 금액 합계 = contract_amount
- **월기성 방식**: 중도금 항목은 rate·amount를 null로 등록 가능. 이 경우 착수금 + 잔금의 비율 합계만 검증하고, 나머지(100% - 착수금% - 잔금%)가 기성 지급분임을 표시
- `display_label` 메서드: advance → "착수금", interim(milestone) → "중도금 N차", interim(monthly_billing) → "중도금(월기성)", final → "잔금"
- `monthly_billing?` 메서드: 월기성 여부 판별

예시 A — 마일스톤 분할 (소규모 공사):
| term_type | seq | interim_method | rate | amount | condition |
|-----------|-----|----------------|------|--------|-----------|
| advance | 1 | — | 30.00 | 38,280,000 | 계약후 15일이내 |
| interim | 1 | milestone | 25.00 | 31,900,000 | 2층 바닥 con.c타설 후 |
| interim | 2 | milestone | 25.00 | 31,900,000 | 골조공사 완료 후 |
| final | 1 | — | 20.00 | 25,520,000 | 준공후 15일이내 |

예시 B — 월기성 (대규모·장기 공사):
| term_type | seq | interim_method | rate | amount | condition |
|-----------|-----|----------------|------|--------|-----------|
| advance | 1 | — | 10.00 | 50,000,000 | 계약후 15일이내 |
| interim | 1 | monthly_billing | — | — | 매월 기성 청구 승인 후 |
| final | 1 | — | 10.00 | 50,000,000 | 준공후 15일이내 |

### 3단계: 계약서 파일 첨부 (Active Storage)

Contract 모델에 계약서 파일을 첨부할 수 있도록 Active Storage를 설정해줘.

- Active Storage 마이그레이션이 없으면 `bin/rails active_storage:install`로 먼저 설치
- `has_many_attached :contract_files` — 계약서 원본, 특기사항 첨부 등 복수 파일 첨부 가능 (기존 `Document` 도메인 모델과의 네이밍 충돌을 피하기 위해 `contract_files`로 명명)
- 허용 파일 형식: PDF, JPG, PNG (계약서 스캔본/원본)
- 파일 크기 제한: 개별 파일 최대 20MB
- 유효성 검사: `validate :validate_contract_file_content_type_and_size` (커스텀 검증)

### 4단계: Contract 모델 업데이트

- `has_many :contract_payment_terms, dependent: :destroy` 연관관계 추가
- `has_many_attached :contract_files` 추가
- `supply_amount`, `vat_amount` 유효성 검사 추가
- `before_validation :calculate_contract_amount` — supply_amount + vat_amount = contract_amount 자동 계산
- `defect_warranty_amount` 메서드 — 하자보증금액 계산 (contract_amount * defect_warranty_rate / 100)
- `max_late_penalty` 메서드 — 최대 지체상환금 계산 (contract_amount * late_penalty_cap_rate / 100)

변경계약 관련:
- `change_amount` 검증 추가 — contract_type이 "change"일 때 필수, 증감액 = 본 계약의 `contract_amount` - **직전 계약**(previous_contract)의 `contract_amount`
- `original_contract` 메서드 — 같은 프로젝트의 원도급 계약 반환
- `previous_contract` 메서드 — 직전 차수 계약 반환 (원도급 또는 이전 변경계약)
- `validate :change_amount_matches_difference` — change_amount가 직전 계약 대비 증감액과 일치하는지 자동 검증

### 4-1단계: Project 모델에 계약 조회 헬퍼 추가

- `latest_contract` 메서드 — 현재 유효 계약 (가장 높은 change_seq, 없으면 원도급)
- `current_contract_amount` 메서드 — 현재 유효 계약금액
- `effective_defect_liability_months` 메서드 — 최신 계약부터 역순 탐색, null이 아닌 첫 번째 값 반환
- `effective_late_penalty_rate` / `effective_late_penalty_cap_rate` — 동일 로직
- `effective_contract_payment_terms` 메서드 — 최신 계약의 결제조건 반환

### 4-2단계: Projects 테이블 중복 필드 정리

- `advance_amount`, `advance_rate` 컬럼을 제거하는 마이그레이션 생성 (ContractPaymentTerm으로 대체)
- `contract_amount`, `vat_amount`는 요약 캐시로 유지 (bigint로 타입 변경)
- Project 모델에서 `advance_amount`, `advance_rate` 관련 코드 제거

### 4-3단계: 기존 금액 필드 bigint 변경

기존 `contracts.contract_amount`, `contracts.change_amount`, `projects.contract_amount`, `projects.vat_amount`, `contract_details.amount`, `contract_details.unit_price` 필드를 `bigint`로 변경하는 마이그레이션을 생성한다. (PostgreSQL integer 최대값 약 21.5억원 → 대규모 공사 오버플로우 방지)

### 5단계: RSpec 테스트

- Contract 모델 스펙에 새 필드 유효성 검사 테스트 추가
- ContractPaymentTerm 모델 스펙 신규 작성
- 비율 합계 100% 검증, 금액 합계 일치 검증 테스트 포함
- 파일 첨부 유효성 검사 테스트 (허용 형식, 크기 제한)
- 변경계약 시나리오 테스트:
  - 원도급 → 1차 변경 → 2차 변경 순서로 생성
  - `project.latest_contract`가 최신 변경계약을 반환하는지 검증
  - `effective_defect_liability_months` 등이 null 폴백 로직을 따르는지 검증
  - 변경계약의 `change_amount`가 직전 계약 대비 증감액과 일치하는지 검증
- FactoryBot factory 업데이트/생성 (Contract factory에 `:change` trait 추가)

### 제약사항

- TDD 순서(Red → Green → Refactor) 준수
- 기존 테스트가 깨지지 않도록 할 것
- 기존 contract_amount 필드는 유지 (하위 호환)
- 콜백은 데이터 정규화 용도만 사용
- 모든 금액 필드는 `bigint` 사용 (PostgreSQL integer 오버플로우 방지)
- `null: false` 컬럼 추가 시 기존 데이터 백필 전략 포함 필수
```

---

## 참고: 향후 확장 가능 항목 (이번에는 구현하지 않음)

- 계약서 PDF 자동 생성
- 결제조건 입금 확인 알림 (Job)
- 도급인/수급인 서명 이미지 관리
