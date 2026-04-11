---
paths:
  - app/models/**
  - app/frontend/**
---

# 상태 머신 규칙

## 모델 정의 패턴

```ruby
STATUSES = %w[draft submitted approved rejected].freeze

STATUS_FLOW = {
  "draft" => ["submitted"],
  "submitted" => ["approved", "rejected"],
  "rejected" => ["draft"],
  "approved" => []
}.freeze

STATUS_LABELS = {
  "draft" => "작성중",
  "submitted" => "제출",
  "approved" => "승인",
  "rejected" => "반려"
}.freeze
```

## 규칙

- DB 컬럼: `string` (문자열 상태값), enum 정수 사용하지 말 것
- 상태 상수 3종(`STATUSES`, `STATUS_FLOW`, `STATUS_LABELS`)을 모델 상단에 정의
- `can_transition_to?(new_status)` 메서드로 전이 가능 여부 검증
- 상태 변경은 Service에서 전이 검증 후 수행 — 모델에서 직접 변경하지 말 것
- 한국어 라벨의 SSoT(Single Source of Truth)는 모델의 `STATUS_LABELS`
- 프론트엔드 Select에는 현재 상태 + `allowed_transitions`만 노출
- 프론트에서 상태 라벨이 필요하면 Presenter가 서버에서 내려줌 — 프론트에 라벨 하드코딩 금지
