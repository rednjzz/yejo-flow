---
paths:
  - app/frontend/components/**
  - app/frontend/pages/**
  - app/controllers/**
---

# Inertia 폼 처리 규칙

## 폼 구조

- `<Form method={method} action={action}>` (Inertia.js `Form` 컴포넌트)
- name 속성: `model[field_name]` (Rails strong parameters convention)
- 중첩 속성: `model[nested_attributes][idx][field]` + 모델에 `accepts_nested_attributes_for`

## 에러 처리

- 서버: `redirect_to ..., inertia: { errors: @model.errors }`
- 프론트: `<InputError messages={errors?.field_name} />` 패턴

## 자동 계산 필드

- 프론트에서 실시간 계산하여 사용자에게 즉시 표시
- 서버 `before_validation`에서 동일 계산 수행 — 이중 검증 필수
- 자동 계산 필드는 `readOnly` + `className="bg-muted"` 스타일 적용

## 필수/읽기전용 표시

- 필수 필드 라벨: `<span className="text-destructive">*</span>` 접미사
- 읽기전용 필드: `readOnly` 속성 + `bg-muted` 배경색

## 폼 컴포넌트 분리

- 생성/수정 폼이 동일 구조면 하나의 Form 컴포넌트로 통합 (`action`, `method` prop으로 구분)
- `as_form_props`로 Presenter가 편집용 데이터를 내려주면, 폼 초기값으로 사용
- 파일 업로드 필드는 `input type="file"` + `accept` 속성으로 허용 형식 제한
