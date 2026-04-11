# 금액 입력 필드 규칙

- 금액(원화)을 입력받는 모든 필드는 `CurrencyInput` 컴포넌트(`@/components/ui/currency-input`)를 사용할 것
- `type="number"`로 금액을 입력받지 말 것 — 3자리마다 콤마(1,000,000)로 표시되어야 사용자가 금액을 쉽게 확인 가능
- `CurrencyInput`은 표시값은 콤마 포맷, 서버 전송은 hidden input으로 raw 숫자를 전달
- 비율(%), 수량, 개월 수 등 금액이 아닌 숫자 필드는 기존 `Input type="number"` 사용
- 금액 표시(읽기 전용)에는 기존 `formatCurrency()` 유틸 함수 사용
