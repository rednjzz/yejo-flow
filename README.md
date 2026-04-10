# Flow — 건설현장 관리 시스템

건설현장의 프로젝트 진행 상황을 체계적으로 관리하고, 현장 활동을 기록·추적하는 사내 웹 애플리케이션입니다.

## 핵심 기능

- **프로젝트(현장) 관리** — 현장 등록/수정/조회, 상태 관리 (준비중 → 진행중 → 준공 → 하자보수 → 종료)
- **도급계약 관리** — 원도급/변경계약 등록, 도급내역 관리
- **사용자 인증** — 회원가입, 로그인, 이메일 인증, 비밀번호 재설정
- **역할 기반 접근** — 관리자, 본사 공무팀장/공무, 현장 소장/실무

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Ruby 3.4, Rails 8.1, SQLite |
| Frontend | React 19, TypeScript, Inertia.js 3, Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui (Radix UI) |
| 인증 | `has_secure_password` (Rails 8 built-in) |
| Background Jobs | Solid Queue |
| Assets | Vite 8 |
| Testing | RSpec, FactoryBot, Shoulda Matchers, Capybara |
| Linting | ESLint 10, RuboCop, Prettier |
| 배포 | Kamal 2 + Thruster |

## 프로젝트 구조

```
app/
├── controllers/     # Inertia 응답. 서비스에 위임
├── models/          # 영속성: 유효성 검사, 연관관계, 스코프
├── services/        # 비즈니스 로직 (Projects::CreateService 등)
├── presenters/      # Inertia props 직렬화 (SimpleDelegator)
├── frontend/
│   ├── components/  # React 컴포넌트 (shadcn/ui 기반)
│   ├── pages/       # Inertia 페이지
│   ├── layouts/     # 레이아웃 (AppLayout, AuthLayout, ProjectLayout)
│   ├── lib/         # 유틸리티 (format, project-status)
│   └── types/       # TypeScript 타입 정의
spec/
├── models/          # 모델 스펙
├── services/        # 서비스 스펙
├── presenters/      # 프레젠터 스펙
└── requests/        # 요청 스펙
```

## 시작하기

### 요구사항

- Ruby 3.4+
- Node.js 22+
- SQLite 3

### 설치

```bash
bin/setup
```

### 개발 서버

```bash
bin/dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 시드 데이터

```bash
bin/rails db:seed
```

- 관리자: `admin@example.com` / `Password1234!`
- 샘플 프로젝트 4개, 발주처 4개, 공종 6개

### 테스트

```bash
bundle exec rspec              # 전체 테스트
bundle exec rspec spec/models/ # 모델만
```

### 린트

```bash
npm run lint                   # ESLint
npm run check                  # TypeScript 타입 체크
bundle exec rubocop -a         # RuboCop
```

## 라이선스

MIT License
