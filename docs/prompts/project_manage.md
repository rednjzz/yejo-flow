# 건설 ERP - 프로젝트 관리 기능 개발 프롬프트

## 1. 프로젝트 개요

건설 종합건설업체(시공사)의 ERP 시스템에서 **프로젝트(현장) 관리** 기능을 개발합니다.

---

## 2. 구현 대상 화면

프로젝트 모듈은 3개 화면 + 8개 탭으로 구성됩니다.

### 2.1 화면 목록

| 화면ID | 화면명 | URL | 유형 |
|--------|-------|-----|------|
| PRJ-001 | 현장 목록 | `GET /projects` | 목록/조회 |
| PRJ-002 | 현장 등록/수정 | `GET /projects/new`, `GET /projects/:id/edit` | 등록/수정 |
| PRJ-003 | 현장 상세 (탭 컨테이너) | `GET /projects/:id` | 조회 |

### 2.2 현장 상세 내부 탭 (1차 범위: 종합현황 + 도급계약)

| 탭 | URL | 설명 |
|----|-----|------|
| 종합현황 | `GET /projects/:id` (기본) | KPI + 비목별 현황 + 하도급 요약 |
| 도급계약 | `GET /projects/:id/contracts` | 도급계약 관리 + 내역 |

> **참고:** 원가관리, 기성관리, 하도급, 노무, 장비, 자재 탭은 후속 단계에서 구현. 탭 UI는 미리 만들되 "준비 중" 표시.

---

## 3. 데이터베이스 테이블

### 3.1 projects (현장 마스터)

```sql
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  project_code VARCHAR(20) NOT NULL UNIQUE,       -- 현장코드 (예: 2025-001)
  project_name VARCHAR(200) NOT NULL,              -- 현장명
  client_id BIGINT NOT NULL REFERENCES companies(id), -- 발주처
  site_address VARCHAR(300),                       -- 현장 소재지
  contract_amount DECIMAL(15,0) NOT NULL,          -- 도급금액 (부가세 별도)
  vat_amount DECIMAL(15,0),                        -- 부가세
  start_date DATE NOT NULL,                        -- 착공일
  end_date DATE NOT NULL,                          -- 준공예정일
  actual_end_date DATE,                            -- 실제 준공일
  status VARCHAR(20) NOT NULL DEFAULT 'preparing', -- preparing/in_progress/completed/defect_period/closed
  manager_id BIGINT REFERENCES users(id),          -- 현장소장
  advance_rate DECIMAL(5,2),                       -- 선급금 비율 (%)
  advance_amount DECIMAL(15,0),                    -- 선급금액
  retention_rate DECIMAL(5,2),                     -- 하자보증금 비율 (%)
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.2 contracts (도급계약)

```sql
CREATE TABLE contracts (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id),
  contract_no VARCHAR(50) NOT NULL,                -- 계약번호
  contract_type VARCHAR(20) NOT NULL,              -- original/change
  change_seq INT,                                  -- 변경차수
  contract_date DATE NOT NULL,                     -- 계약일
  contract_amount DECIMAL(15,0) NOT NULL,          -- 계약금액
  change_amount DECIMAL(15,0),                     -- 증감금액
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.3 contract_details (도급내역)

```sql
CREATE TABLE contract_details (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id),
  project_id BIGINT NOT NULL REFERENCES projects(id),
  work_type_id BIGINT NOT NULL REFERENCES work_types(id),
  item_name VARCHAR(200) NOT NULL,                 -- 내역명
  unit VARCHAR(20),                                -- 단위 (식/m2/m3/EA/ton 등)
  quantity DECIMAL(12,3),                          -- 수량
  unit_price DECIMAL(12,0),                        -- 단가
  amount DECIMAL(15,0) NOT NULL,                   -- 금액
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3.4 참조 테이블

```sql
-- 이 부분도 생성
-- companies (id, company_code, company_name, company_type, ...)
-- users (id, user_code, name, email, role, is_active, ...)
-- work_types (id, work_type_code, work_type_name, parent_id, level, sort_order, is_active, ...)
```

---

## 4. 화면별 상세 요구사항

### 4.1 PRJ-001 현장 목록

#### 조회 조건
- **상태 필터:** 드롭다운 (전체 / preparing / in_progress / completed / closed)
- **현장명 검색:** 텍스트 입력, LIKE 검색
- **기본값:** 전체 상태, 검색어 없음

#### 목록 컬럼

| 컬럼 | 소스 | 정렬 |
|------|------|------|
| 현장코드 | projects.project_code | ○ |
| 현장명 | projects.project_name | ○ |
| 발주처 | companies.company_name (JOIN) | |
| 도급금액 | projects.contract_amount | 포맷: 억 단위 |
| 공사기간 | start_date ~ end_date | |
| 상태 | projects.status | Badge 표시 |
| 기성률 | 산출값 (기성누계 / 도급금액 × 100) | % 표시 |
| 손익률 | 산출값 ((기성수령 - 투입원가) / 기성수령 × 100) | Badge 색상 분기 |

#### 기능
- 행 클릭 → `GET /projects/:id` (현장 상세)
- "+ 신규 현장" 버튼 → `GET /projects/new`
- "엑셀" 버튼 → 목록 엑셀 다운로드

#### 구현 참고
```ruby
# app/controllers/projects_controller.rb
class ProjectsController < ApplicationController
  def index
    @projects = Project.includes(:client)
    @projects = @projects.where(status: params[:status]) if params[:status].present?
    @projects = @projects.where("project_name LIKE ?", "%#{params[:q]}%") if params[:q].present?
    @projects = @projects.order(created_at: :desc)
  end
end
```

---

### 4.2 PRJ-002 현장 등록/수정

#### 입력 필드

| 필드 | HTML 타입 | 필수 | 비즈니스 규칙 |
|------|----------|------|-------------|
| 현장코드 | text (readonly) | Y | 자동생성: `YYYY-NNN` (현재연도 + 3자리 순번) |
| 현장명 | text | Y | 최대 200자 |
| 발주처 | select (검색) | Y | companies WHERE company_type = 'client' AND is_active = true |
| 현장 소재지 | text | N | |
| 도급금액 | number | Y | 부가세 별도, 천단위 콤마 표시 |
| 부가세 | number (readonly) | N | 도급금액 × 10% 자동계산 |
| 착공일 | date | Y | |
| 준공예정일 | date | Y | 착공일 이후만 허용 |
| 현장소장 | select (검색) | N | users WHERE role IN ('admin', 'manager') AND is_active = true |
| 상태 | select | Y | preparing(기본) / in_progress / completed / defect_period / closed |
| 선급금비율 | number | N | % |
| 하자보증금비율 | number | N | % |
| 비고 | textarea | N | |

#### 현장코드 자동생성 로직
```ruby
# app/models/project.rb
def self.generate_project_code
  year = Date.current.year
  last = where("project_code LIKE ?", "#{year}-%").order(:project_code).last
  seq = last ? last.project_code.split("-").last.to_i + 1 : 1
  "#{year}-#{seq.to_s.rjust(3, '0')}"
end
```

#### 부가세 자동계산
- Stimulus 컨트롤러로 도급금액 입력 시 실시간 계산
- `vat_amount = contract_amount * 0.1`

#### 상태 전이 규칙
```
preparing → in_progress → completed → defect_period → closed
```
- 역방향 전이 불가
- completed 전이 시 actual_end_date 자동 세팅

#### 저장 후 이동
- 신규: 저장 후 `GET /projects/:id` (현장 상세)
- 수정: 저장 후 현장 상세로 복귀

---

### 4.3 PRJ-003 현장 상세 (탭 컨테이너)

#### 상단 공통 영역
```erb
<!-- 모든 탭에서 공통으로 표시 -->
<div class="flex items-center gap-3">
  <%= link_to "← 목록", projects_path, class: "..." %>
  <div>
    <h2><%= @project.project_name %></h2>
    <p><%= @project.project_code %> | <%= @project.client.company_name %> | <%= @project.start_date %> ~ <%= @project.end_date %></p>
  </div>
  <span class="badge"><%= @project.status_label %></span>
</div>
```

#### 탭 바 (Turbo Frame 활용)
```erb
<!-- 탭 네비게이션 -->
<div class="tab-bar">
  <%= link_to "종합현황", project_path(@project), data: { turbo_frame: "project_tab_content" } %>
  <%= link_to "도급계약", project_contracts_path(@project), data: { turbo_frame: "project_tab_content" } %>
  <%= link_to "원가관리", "#", class: "disabled" %>  <!-- 준비 중 -->
  <%= link_to "기성관리", "#", class: "disabled" %>
  <%= link_to "하도급", "#", class: "disabled" %>
  <%= link_to "노무", "#", class: "disabled" %>
  <%= link_to "장비", "#", class: "disabled" %>
  <%= link_to "자재", "#", class: "disabled" %>
</div>

<!-- 탭 콘텐츠 영역 -->
<turbo-frame id="project_tab_content">
  <%= yield %>  <!-- 또는 각 탭 partial -->
</turbo-frame>
```

---

### 4.4 종합현황 탭 (기본 탭)

`GET /projects/:id`의 show 액션.

#### KPI 카드 (4개)

| KPI | 산출 로직 |
|-----|----------|
| 도급금액 | `@project.contract_amount` |
| 기성 누계 | `@project.billings.where(status: ['approved','paid']).sum(:cumulative_amount)` → 최신 차수의 cumulative (향후 구현, 지금은 0 표시) |
| 투입원가 | `SUM(노무비) + SUM(장비비) + SUM(재료비) + SUM(외주비)` (향후 구현, 지금은 0 표시) |
| 현장 손익 | 기성수령 - 투입원가 (향후 구현, 지금은 0 표시) |

> **1차 구현:** KPI 카드 UI는 만들되, 기성/원가 데이터는 아직 없으므로 0 또는 "-" 표시. 도급금액만 실제 데이터.

#### 원가 비목별 현황
- 재료비 / 노무비 / 장비비 / 외주비 프로그래스바
- 1차에서는 예산 데이터가 없으므로 빈 상태 또는 더미 표시

#### 하도급 현황 테이블
- 1차에서는 빈 테이블

---

### 4.5 도급계약 탭

`GET /projects/:id/contracts`

#### 도급계약 헤더
- 원도급 계약 1건 + 변경계약 N건 이력
- "+ 계약 등록" 버튼

#### 도급계약 등록/수정

| 필드 | 타입 | 필수 | 규칙 |
|------|------|------|------|
| 계약번호 | text | Y | |
| 유형 | select | Y | original(원도급) / change(변경) |
| 변경차수 | number | N | 변경계약 시 자동증가 |
| 계약일 | date | Y | |
| 계약금액 | number | Y | 원도급: 전체금액 / 변경: 변경 후 금액 |
| 증감금액 | number | N | 변경계약 시: 변경금액 - 직전금액 |
| 내용/사유 | textarea | N | |

#### 도급내역 (contract_details)
- 계약 선택 후 내역 그리드 표시
- 행 추가/삭제 가능
- Turbo Stream으로 행 동적 추가

| 필드 | 규칙 |
|------|------|
| 공종 | work_types 드롭다운 |
| 내역명 | 자유 텍스트 |
| 단위 | 식/m2/m3/EA/ton 등 |
| 수량 | 소수점 3자리 |
| 단가 | 정수 |
| 금액 | 수량×단가 자동계산 (또는 일식일 때 직접입력) |

#### 비즈니스 규칙
- 내역 합계 ≠ 계약금액이면 경고 표시 (저장은 허용)
- 엑셀 가져오기: 양식 다운로드 → 업로드 → 미리보기 → 확정

---

## 5. 라우팅

```ruby
# config/routes.rb
resources :projects do
  resources :contracts, shallow: true do
    resources :contract_details, shallow: true
  end
end
```

| Method | URL | Controller#Action | 설명 |
|--------|-----|-------------------|------|
| GET | /projects | projects#index | 현장 목록 |
| GET | /projects/new | projects#new | 현장 등록 폼 |
| POST | /projects | projects#create | 현장 저장 |
| GET | /projects/:id | projects#show | 현장 상세 (종합현황) |
| GET | /projects/:id/edit | projects#edit | 현장 수정 폼 |
| PATCH | /projects/:id | projects#update | 현장 업데이트 |
| GET | /projects/:project_id/contracts | contracts#index | 도급계약 목록 (탭) |
| POST | /projects/:project_id/contracts | contracts#create | 계약 저장 |
| GET | /contracts/:id | contracts#show | 계약 상세 |
| GET | /contracts/:id/edit | contracts#edit | 계약 수정 |
| PATCH | /contracts/:id | contracts#update | 계약 업데이트 |

---

## 6. 모델 관계

```ruby
# app/models/project.rb
class Project < ApplicationRecord
  belongs_to :client, class_name: "Company"
  belongs_to :manager, class_name: "User", optional: true
  has_many :contracts, dependent: :destroy
  has_many :contract_details, dependent: :destroy

  validates :project_code, presence: true, uniqueness: true
  validates :project_name, presence: true, length: { maximum: 200 }
  validates :contract_amount, presence: true, numericality: { greater_than: 0 }
  validates :start_date, :end_date, presence: true
  validates :status, inclusion: { in: %w[preparing in_progress completed defect_period closed] }
  validate :end_date_after_start_date

  before_validation :set_project_code, on: :create
  before_validation :calculate_vat

  STATUS_FLOW = {
    "preparing" => ["in_progress"],
    "in_progress" => ["completed"],
    "completed" => ["defect_period"],
    "defect_period" => ["closed"],
    "closed" => []
  }.freeze

  def status_label
    { "preparing" => "준비중", "in_progress" => "진행중", "completed" => "준공",
      "defect_period" => "하자보수", "closed" => "종료" }[status]
  end

  def can_transition_to?(new_status)
    STATUS_FLOW[status]&.include?(new_status)
  end

  private

  def set_project_code
    self.project_code ||= self.class.generate_project_code
  end

  def calculate_vat
    self.vat_amount = (contract_amount * 0.1).to_i if contract_amount.present?
  end

  def end_date_after_start_date
    return unless start_date && end_date
    errors.add(:end_date, "은 착공일 이후여야 합니다") if end_date <= start_date
  end

  def self.generate_project_code
    year = Date.current.year
    last = where("project_code LIKE ?", "#{year}-%").order(:project_code).last
    seq = last ? last.project_code.split("-").last.to_i + 1 : 1
    "#{year}-#{seq.to_s.rjust(3, '0')}"
  end
end

# app/models/contract.rb
class Contract < ApplicationRecord
  belongs_to :project
  has_many :contract_details, dependent: :destroy

  validates :contract_no, presence: true
  validates :contract_type, inclusion: { in: %w[original change] }
  validates :contract_date, presence: true
  validates :contract_amount, presence: true, numericality: { greater_than: 0 }

  scope :original, -> { where(contract_type: "original") }
  scope :changes, -> { where(contract_type: "change").order(:change_seq) }

  def details_total
    contract_details.sum(:amount)
  end

  def amount_mismatch?
    contract_details.any? && details_total != contract_amount
  end
end

# app/models/contract_detail.rb
class ContractDetail < ApplicationRecord
  belongs_to :contract
  belongs_to :project
  belongs_to :work_type

  validates :item_name, presence: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_validation :calculate_amount

  private

  def calculate_amount
    if quantity.present? && unit_price.present?
      self.amount = (quantity * unit_price).to_i
    end
  end
end
```

---

## 7. 뷰 구조 (ERB + Turbo)

```
app/views/
  projects/
    index.html.erb          # PRJ-001 현장 목록
    new.html.erb            # PRJ-002 등록 폼
    edit.html.erb           # PRJ-002 수정 폼
    show.html.erb           # PRJ-003 현장 상세 (탭 컨테이너 + 종합현황)
    _form.html.erb          # 등록/수정 공통 폼 partial
    _project_row.html.erb   # 목록 행 partial (Turbo Stream용)
    _tab_nav.html.erb       # 탭 네비게이션 partial
    _overview.html.erb      # 종합현황 탭 콘텐츠
  contracts/
    index.html.erb          # 도급계약 탭 (Turbo Frame)
    new.html.erb            # 계약 등록
    edit.html.erb           # 계약 수정
    show.html.erb           # 계약 상세 + 내역
    _form.html.erb          # 계약 폼 partial
  contract_details/
    _form.html.erb          # 내역 행 partial
    _row.html.erb           # 내역 행 (Turbo Stream)
```

---

## 8. Stimulus 컨트롤러

```
app/javascript/controllers/
  vat_calculator_controller.js    # 도급금액 입력 시 부가세 자동계산
  amount_calculator_controller.js  # 수량×단가 = 금액 자동계산 (도급내역)
  number_format_controller.js      # 천단위 콤마 포맷
  confirm_controller.js            # 삭제 확인 다이얼로그
```

### vat_calculator 예시
```javascript
// app/javascript/controllers/vat_calculator_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["contractAmount", "vatAmount"]

  calculate() {
    const amount = parseInt(this.contractAmountTarget.value.replace(/,/g, '')) || 0
    this.vatAmountTarget.value = Math.floor(amount * 0.1).toLocaleString()
  }
}
```

---

## 9. UI 디자인 가이드

shadcn/ui 스타일을 Tailwind CSS로 구현합니다.

### 핵심 컴포넌트 스타일

```css
/* 카드 */
.card { @apply bg-white rounded-lg border border-zinc-200 shadow-sm; }
.card-header { @apply p-6 pb-3; }
.card-content { @apply p-6 pt-0; }

/* 버튼 */
.btn-primary { @apply bg-zinc-900 text-white hover:bg-zinc-800 h-9 px-4 text-sm rounded-md font-medium; }
.btn-outline { @apply border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 h-9 px-4 text-sm rounded-md; }
.btn-ghost { @apply text-zinc-600 hover:bg-zinc-100 h-9 px-4 text-sm rounded-md; }
.btn-sm { @apply h-8 px-3 text-xs; }

/* 입력 필드 */
.input { @apply h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400; }
.select { @apply h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm; }
.label { @apply text-sm font-medium text-zinc-700; }

/* Badge */
.badge { @apply inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border; }
.badge-success { @apply bg-emerald-50 text-emerald-700 border-emerald-200; }
.badge-warning { @apply bg-amber-50 text-amber-700 border-amber-200; }
.badge-danger { @apply bg-red-50 text-red-700 border-red-200; }

/* 테이블 */
.table th { @apply h-10 px-3 text-left text-xs font-medium text-zinc-500; }
.table td { @apply px-3 py-2.5 text-sm; }
.table tr { @apply border-b border-zinc-100 hover:bg-zinc-50; }

/* 탭 바 */
.tab-bar { @apply bg-zinc-100 p-1 rounded-lg flex gap-1; }
.tab-item { @apply px-4 py-2 text-sm font-medium rounded-md transition-all; }
.tab-item.active { @apply bg-white text-zinc-900 shadow-sm; }
.tab-item:not(.active) { @apply text-zinc-500 hover:text-zinc-700; }
.tab-item.disabled { @apply text-zinc-300 cursor-not-allowed; }

/* KPI 카드 */
.kpi-value { @apply text-2xl font-bold tracking-tight; }
.kpi-label { @apply text-xs text-zinc-500; }
```

### 금액 표시 규칙
- 억 단위: `82억`, `51.2억` (목록, KPI)
- 원 단위: `8,200,000,000` (상세 폼, 도급내역)
- 천단위 콤마 필수

### 상태 Badge 색상
| 상태 | 색상 |
|------|------|
| preparing (준비중) | outline (회색) |
| in_progress (진행중) | success (초록) |
| completed (준공) | info (파랑) |
| defect_period (하자보수) | warning (주황) |
| closed (종료) | default (회색) |

---

## 10. 사이드바 네비게이션

```
사이드바 메뉴 (4개):
  ⬡ 대시보드          → /dashboard
  📋 현장일지          → /daily_reports
  ✓ 결재              → /approvals
  ▦ 프로젝트          → /projects
     ├ 강남 오피스텔 신축  → /projects/1  (호버 시 펼침)
     ├ 판교 물류센터       → /projects/2
     ├ 일산 상업시설       → /projects/3
     └ 수원 공동주택       → /projects/4
```

- 프로젝트 메뉴에 마우스 호버 시 사이드바 내부에서 하위 현장명이 아코디언으로 펼쳐짐
- 현장명 클릭 → 해당 프로젝트 상세 페이지로 바로 이동
- 프로젝트 자체 클릭 → 현장 목록

---

## 11. 구현 순서

1. **마이그레이션:** projects, contracts, contract_details 테이블 생성
2. **모델:** Project, Contract, ContractDetail + 관계, 검증, 콜백
3. **컨트롤러:** ProjectsController, ContractsController
4. **뷰 - 목록:** projects/index (필터, 검색, 테이블)
5. **뷰 - 등록/수정:** projects/new, edit, _form (Stimulus 부가세 자동계산)
6. **뷰 - 상세:** projects/show (탭 컨테이너 + 종합현황)
7. **뷰 - 도급계약 탭:** contracts/index (Turbo Frame)
8. **뷰 - 도급내역:** contract_details 행 추가/삭제 (Turbo Stream)
9. **사이드바:** 프로젝트 호버 시 현장 목록 아코디언
10. **Stimulus:** vat_calculator, amount_calculator, number_format

---

## 12. 시드 데이터

```ruby
# db/seeds.rb

# 발주처
clients = [
  Company.find_or_create_by!(company_code: "CL-001", company_name: "대한건설개발(주)", company_type: "client"),
  Company.find_or_create_by!(company_code: "CL-002", company_name: "판교로지스(주)", company_type: "client"),
  Company.find_or_create_by!(company_code: "CL-003", company_name: "일산디벨롭(주)", company_type: "client"),
  Company.find_or_create_by!(company_code: "CL-004", company_name: "수원하우징(주)", company_type: "client"),
]

# 공종
work_types = [
  WorkType.find_or_create_by!(work_type_code: "WT-01", work_type_name: "토공사", level: 1, sort_order: 1),
  WorkType.find_or_create_by!(work_type_code: "WT-02", work_type_name: "RC공사", level: 1, sort_order: 2),
  WorkType.find_or_create_by!(work_type_code: "WT-03", work_type_name: "철골공사", level: 1, sort_order: 3),
  WorkType.find_or_create_by!(work_type_code: "WT-04", work_type_name: "방수공사", level: 1, sort_order: 4),
  WorkType.find_or_create_by!(work_type_code: "WT-05", work_type_name: "기계설비", level: 1, sort_order: 5),
  WorkType.find_or_create_by!(work_type_code: "WT-06", work_type_name: "전기공사", level: 1, sort_order: 6),
]

# 프로젝트 (4개)
projects_data = [
  { code: "2024-003", name: "강남 오피스텔 신축", client: clients[0], amount: 8_200_000_000, start: "2024-03-01", end: "2025-04-30", status: "in_progress" },
  { code: "2024-005", name: "판교 물류센터", client: clients[1], amount: 6_400_000_000, start: "2024-05-01", end: "2025-08-31", status: "in_progress" },
  { code: "2024-008", name: "일산 상업시설", client: clients[2], amount: 3_800_000_000, start: "2024-08-01", end: "2025-06-30", status: "in_progress" },
  { code: "2025-001", name: "수원 공동주택", client: clients[3], amount: 4_800_000_000, start: "2025-01-15", end: "2026-06-30", status: "in_progress" },
]

projects_data.each do |pd|
  p = Project.find_or_create_by!(project_code: pd[:code]) do |proj|
    proj.project_name = pd[:name]
    proj.client = pd[:client]
    proj.contract_amount = pd[:amount]
    proj.start_date = pd[:start]
    proj.end_date = pd[:end]
    proj.status = pd[:status]
  end

  # 원도급 계약
  c = Contract.find_or_create_by!(project: p, contract_type: "original") do |con|
    con.contract_no = "#{pd[:code]}-ORG"
    con.contract_date = pd[:start]
    con.contract_amount = pd[:amount]
  end
end
```

---

## 13. 테스트 시나리오

| # | 시나리오 | 예상 결과 |
|---|---------|---------|
| 1 | 현장 목록 접속 | 4개 현장 표시, 상태/검색 필터 동작 |
| 2 | "+ 신규 현장" 클릭 | 등록 폼, 현장코드 자동생성 (2025-002) |
| 3 | 도급금액 입력 | 부가세 실시간 자동계산 |
| 4 | 필수항목 누락 저장 | 에러 메시지 표시 |
| 5 | 저장 성공 | 현장 상세 페이지로 이동 |
| 6 | 현장 상세 접속 | 상단 정보 + 탭 바 + 종합현황 기본 표시 |
| 7 | "도급계약" 탭 클릭 | Turbo Frame으로 계약 내용 로드 |
| 8 | 도급내역 행 추가 | Turbo Stream으로 행 동적 추가 |
| 9 | 수량×단가 입력 | 금액 자동계산 |
| 10 | 내역 합계 ≠ 계약금액 | 경고 메시지 표시 |
| 11 | 사이드바 프로젝트 호버 | 현장명 아코디언 펼침 |
| 12 | 현장명 클릭 | 해당 프로젝트 상세로 바로 이동 |
