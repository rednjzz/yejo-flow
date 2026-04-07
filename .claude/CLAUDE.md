# Construction Site Manager — CLAUDE.md

> Claude Code는 항상 **한국어**로 응답할 것.
> 새 작업 시작 전 **[필수 참조 문서]** 섹션의 파일을 먼저 읽을 것.

---

## 프로젝트 개요

건설현장의 프로젝트 진행 상황을 체계적으로 관리하고, 현장 활동을 기록·추적하는 사내 웹 애플리케이션.

**핵심 도메인:** 프로젝트 관리 / 현장일지(Daily Site Report) / 사용자 & 권한

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Ruby 3.4, Rails 8.1, PostgreSQL |
| Frontend | Inertia.js + React (TypeScript), Tailwind CSS 4 |
| 인증 | `has_secure_password` (Rails 8 built-in) |
| 인가 | Pundit (default deny) |
| Background Jobs | Solid Queue (Redis 없음) |
| 파일 저장 | Active Storage |
| Assets | Vite (vite_rails gem) |
| 배포 | Kamal 2 + Thruster |
| Testing | RSpec, FactoryBot, Shoulda Matchers, Capybara |

---

## 아키텍처 원칙

```
controllers/   — 얇게. 서비스에 위임. Inertia 응답 반환.
models/        — 영속성: 유효성 검사, 연관관계, 스코프.
services/      — 비즈니스 로직. 도메인별 네임스페이스.
queries/       — 복잡한 DB 쿼리. Relation 또는 Hash 반환.
policies/      — Pundit 인가. 기본 거부(default deny).
presenters/    — Inertia props 직렬화 (SimpleDelegator).
forms/         — 멀티모델 폼 객체.
jobs/          — 백그라운드 작업. 멱등성 보장 필수.
frontend/      — React 컴포넌트 및 Inertia 페이지.
```

**핵심 규칙:**
- Skinny Everything: Controller는 조율, Model은 영속성, Service는 비즈니스 로직
- 콜백은 데이터 정규화 전용 (`before_validation`, `before_save`). 이메일/잡/API 호출은 Service에서
- Service는 `.call` 클래스 메서드, Result 객체 반환, 도메인 네임스페이스 사용 (`Projects::CreateService`)
- 섣부른 추상화 금지. 명시적 > 암묵적

---

## 네이밍 컨벤션

| Layer | 패턴 | 예시 |
|-------|------|------|
| Model | Singular PascalCase | `Project`, `DailySiteLog` |
| Controller | Plural PascalCase | `ProjectsController` |
| Service | Namespaced + `Service` | `Projects::CreateService` |
| Query | Namespaced + `Query` | `Projects::SearchQuery` |
| Policy | Singular + `Policy` | `ProjectPolicy` |
| Job | Descriptive + `Job` | `NotifyApprovalJob` |
| Presenter | Singular + `Presenter` | `ProjectPresenter` |
| Form | Descriptive + `Form` | `DailySiteLogForm` |

---

## 사용자 역할

| 역할(코드) | 영어 | 한국어 | 주요 권한 |
|---|---|---|---|
| `admin` | Administrator | 관리자 | 시스템/조직 전체 권한 |
| `hq_manager` | Headquarter Manager | 본사 공무 팀장 | 전체 현장 관리 권한 |
| `hq_staff` | Headquarter Staff | 본사 공무 | 담당 현장 관리 권한 |
| `site_manager` | Site Manager | 현장 소장 | 담당 현장 관리 권한 | 
| `site_staff` | Site Staff | 현장 실무 | 담당 현장 관리 권한 |
- 사용자는 **여러 프로젝트**에 소속 가능하며, 프로젝트별로 역할이 다를 수 있음
- 권한 상세 → `@docs/permissions.md`

---

## 주요 워크플로우

```
현장일지: 작성(hq_staff,site_staff) → 검토, 승인(construction_manager,site_manager)
프로젝트: 등록(admin,construction_manager) → 현황 대시보드
```

---

## 개발 워크플로우

**TDD 필수: Red → Green → Refactor**

```bash
# 테스트
bundle exec rspec                              # 전체
bundle exec rspec spec/path/to_spec.rb:25      # 특정 라인

# 린팅
bundle exec rubocop -a                         # 자동 수정

# 보안
bin/brakeman --no-pager
bundle exec bundler-audit check --update

# DB
bin/rails db:migrate
bin/rails db:migrate:status
```

---

## 필수 참조 문서

새 작업 시작 전 **항상** 읽을 것:

- `@docs/domain.md` — 도메인 용어 사전 (기성, 내역서 등 건설 업계 용어)
- `@docs/schema.md` — 테이블 구조 및 연관관계

작업 유형에 따라 추가로 읽을 것:

- 권한/역할 관련 → `@docs/permissions.md`
- 코딩 패턴 상세 → `@docs/rails-development-principles.md`
- 아키텍처 결정 배경 → `@docs/adr/` (최신 파일)

---

## 현재 구현 범위 외 (향후 확장)

아래 기능은 **현재 구현하지 않음**. 별도 지시 없이 코드에 포함하지 말 것.

- 자재/장비 재고 관리
- 안전점검 체크리스트
- 공정률 기반 기성 관리
- 외부 API 연동 (기상청 등)
- PWA / 모바일 앱
