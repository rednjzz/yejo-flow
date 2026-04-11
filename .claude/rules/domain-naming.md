# 건설 도메인 용어 매핑

## SSoT (Single Source of Truth)

도메인 용어의 정의는 `docs/domain.md`가 유일한 원본이다. 새 용어 추가 시 반드시 `docs/domain.md`를 먼저 업데이트할 것.

## 핵심 용어 매핑

| 한국어 | 영문 코드 | 모델/테이블 |
|--------|-----------|------------|
| 현장 / 프로젝트 | project | `Project` |
| 발주처 (도급인) | client | `Company(company_type: "client")` |
| 시공사 (수급인) | contractor | `Company(company_type: "contractor")` |
| 도급계약 | contract | `Contract` |
| 공급가액 | supply_amount | `contracts.supply_amount` |
| 부가세 | vat_amount | `contracts.vat_amount` |
| 도급금액 (총 계약금액) | contract_amount | `contracts.contract_amount` |
| 내역항목 | contract_item | `ContractItem` |
| 공종 | work_type | `WorkType` |
| 결제조건 | contract_payment_term | `ContractPaymentTerm` |
| 기성 | progress_billing | `ProgressBilling` (향후) |
| 현장공사일지 | daily_site_log | `DailySiteLog` (향후) |
| 설계변경 | design_change | `DesignChange` (향후) |
| 적산 | estimation | (향후) |

## 규칙

- UI 텍스트: 한국어 — 코드(변수, 메서드, 컬럼): 영문 snake_case
- 모델명 변경 시 도메인 용어 사전과 일치시킬 것 (예: `ContractDetail` → `ContractItem`)
- 약어 사용 금지: `cont` 대신 `contract`, `proj` 대신 `project`
- 건설 업계 표준 용어 우선: "기성" = progress_billing (invoice X), "공종" = work_type (category X)
