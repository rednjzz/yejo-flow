---
paths:
  - app/models/contract*
  - app/controllers/contract*
  - app/controllers/contracts/**
  - app/frontend/**/contract*
  - spec/**/contract*
---

# 도급계약 관리 규칙

## 계약 구조

- 원도급(`original`) 1건 + 변경계약(`change`) N건, `change_seq`로 차수 관리
- 프로젝트의 **현재 유효 계약** = 가장 높은 `change_seq`의 계약
- 현재 유효 계약금액 = `project.latest_contract.contract_amount`

## 금액 계산

- `contract_amount` = `supply_amount` + `vat_amount` (`before_validation`에서 자동 계산)
- 변경계약의 `change_amount` = 변경 후 금액 - 직전 계약 금액

## 내역항목 (ContractItem)

- Contract에 종속: `contract.contract_items`
- 금액 = 수량 × 단가 (`before_validation :calculate_amount`)
- 내역 합계 ≠ 계약금액이면 `amount_mismatch?` = true로 UI 경고 표시

## 결제조건 (ContractPaymentTerm)

- 착수금(`advance`) / 중도금(`interim`) / 잔금(`final`)
- 착수금, 잔금은 각 1건만 허용 — 중도금은 복수 건 가능
- 중도금 방식: `milestone`(마일스톤 분할) 또는 `monthly_billing`(월기성)
- 동일 계약 내 중도금 방식은 통일
- `[contract_id, term_type, seq]` 유니크 제약

## 변경계약 처리

- 변경계약은 별도 레코드로 생성 (실제 변경계약서도 별도 문서)
- 하자책임기간 등 계약조건: 변경계약에 값이 있으면 해당 값, null이면 원도급 값 참조
- 결제조건: 각 Contract가 자체 `contract_payment_terms` 소유, 최신 계약의 것이 유효
- 변경 이력은 항상 보존 — 이전 계약 삭제/덮어쓰기 금지

## 파일 첨부

- `has_many_attached :contract_files`
- 허용 형식: PDF, JPG, PNG만
- 개별 파일 최대 20MB
- 커스텀 검증: `validate :validate_contract_file_content_type_and_size`

## 비즈니스 규칙

- 하도급 계약 금액 ≤ 해당 공종 원도급 금액 (하도급법 준수)
- 기성 청구 누계 금액은 계약 총액 초과 불가
- 승인 완료된 기성은 수정 불가
