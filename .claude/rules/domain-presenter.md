---
paths:
  - app/presenters/**
  - app/controllers/**
---

# Presenter 직렬화 규칙

## 기본 패턴

- `SimpleDelegator` 상속, 모델당 1 Presenter
- 파일 위치: `app/presenters/`
- 네이밍: `{Model}Presenter` (예: `ContractPresenter`)

## 메서드 패턴

| 메서드 | 용도 | 사용처 |
|--------|------|--------|
| `as_list_props` | 목록 화면용 (최소 필드) | index 액션 |
| `as_detail_props` | 상세 화면용 (전체 필드) | show 액션 |
| `as_form_props` | 편집 폼용 (편집 가능 필드) | edit 액션 |
| `as_props` | 범용 (deprecated 지양) | — |

## 타입 변환 규칙

- 날짜(`Date`, `DateTime`) → `.iso8601` 문자열
- 금액(`bigint`) → 정수 그대로 전달 (프론트에서 `formatCurrency()`로 포맷)
- 비율(`decimal`) → `.to_f` (JSON 호환)
- nil 가능 필드 → `&.to_f`, `&.iso8601` (safe navigation)

## 사용 규칙

- 컨트롤러에서 `includes`로 eager load 후 Presenter에 전달
- 비즈니스 계산(예: `amount_in_billion`, `formatted_period`)은 Presenter에서 수행
- 연관 데이터 직렬화(예: `contract_items`, `contract_payment_terms`)는 Presenter의 private 메서드로 분리
- Presenter에 비즈니스 로직(상태 변경, 저장 등)을 넣지 말 것 — 읽기 전용
