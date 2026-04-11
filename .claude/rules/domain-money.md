---
paths:
  - app/models/**
  - app/frontend/**
  - db/migrate/**
---

# 금액/수량/비율 처리 규칙

## DB 컬럼 타입

- **금액(원화)**: `bigint` (건설 프로젝트 금액은 수십억 단위, integer 오버플로 방지)
- **비율(%)**: `decimal(5,2)` — 지체상환율 등 정밀 비율은 `decimal(5,3)`
- **수량**: `decimal(12,3)` (소수 3자리까지)
- 금액 컬럼에 `integer`를 쓰지 말 것 — 반드시 `bigint`

## 서버 계산 규칙

- 금액 = 수량 × 단가 → `.to_i` (원 미만 절사)
- 부가세 = 공급가액 × 10% → `.to_i`
- 계약금액 = 공급가액 + 부가세
- 자동 계산은 `before_validation` 콜백에서 수행

## 프론트엔드 입력

- **금액 입력**: `CurrencyInput` 컴포넌트(`@/components/ui/currency-input`) 사용
  - 표시: 3자리 콤마 포맷 (1,000,000)
  - 서버 전송: hidden input으로 raw 숫자 전달
  - `type="number"`로 금액을 입력받지 말 것
- **비율(%), 수량, 개월 수** 등 금액이 아닌 숫자: `Input type="number"` 사용

## 프론트엔드 표시 (읽기 전용)

- `formatCurrency()` 유틸 함수(`@/lib/format`) 사용
- 증감액은 부호(+/-)와 색상으로 구분 (양수: blue, 음수: red)
