# 거래처(Company) 관리 페이지 구현 명세서

> **문서 목적**: Neo 건설 ERP의 거래처(Company) 관리 모듈을 Rails 8 + Hotwire 스택 위에 구현하기 위한 단일 실행 프롬프트.
> 이 문서 하나로 마이그레이션, 모델, 라우팅, 컨트롤러, 뷰, Stimulus, 시드, 테스트까지 모두 구현 가능해야 함.

---

## 1. 모듈 개요

### 1.1 명칭
- 모듈명: **거래처 관리 (Companies)**
- 모델: `Company` (기존 `companies` 테이블 확장)
- 포함 역할: **발주처(Client)**, **하도급 업체(Subcontractor)**
- URL 베이스: `/companies`

### 1.2 핵심 설계 결정 — 역할은 두 개의 독립 boolean

기존 `company_type` 단일 컬럼(`'client'` / `'contractor'`)을 제거하고 **두 개의 독립 boolean 컬럼**으로 전환한다.

```
is_client          : 발주처 역할 여부
is_subcontractor   : 하도급 역할 여부
```

**이유:**
- 한 법인이 발주처이자 하도급일 수 있다 (예: 우리 하도급 업체가 자기 공장을 지을 때 우리를 시공사로 고용 → 그 프로젝트에서는 우리의 발주처가 됨).
- `company_type` 단일 값으로 표현하면 같은 회사를 두 번 등록해야 하는 데이터 중복이 발생.
- 두 개의 boolean은 역할이 **독립적으로** 켜지고 꺼지므로, 나중에 역할 추가/제거가 자연스럽다.
- 역할 종류가 늘어날 가능성이 낮으므로 별도 `roles` 테이블로 정규화할 만큼은 아님.

**용어 변경:** 기존 `'contractor'` → `'subcontractor'`. "contractor"는 원도급자를 가리키는 단어인데, Neo 사용자(GC) 자신이 contractor이므로 하도급 업체를 contractor로 부르면 혼란이 생긴다.

### 1.3 주요 기능
1. 거래처 목록 조회 (탭: 전체 / 발주처 / 하도급)
2. 검색 (업체명, 사업자번호, 대표자명)
3. 필터 (활성 여부, 공종, 면허 종류)
4. 거래처 신규 등록 (역할 1개 또는 2개 모두 선택)
5. 거래처 상세 보기
6. 거래처 정보 수정 (역할 추가/제거 가능)
7. 거래처 비활성화 (소프트 삭제 — `is_active = false`)
8. 담당자 다건 등록/수정/삭제
9. 사업자등록번호 중복 체크 (실시간)
10. 사업자등록번호 체크섬 검증
11. 거래처 코드(`company_code`) 자동 생성 — `00001`형식

---

## 2. 데이터베이스 마이그레이션

### 2.1 Migration 1: `company_type` → boolean 두 개로 전환

```ruby
class ConvertCompanyTypeToRoleBooleans < ActiveRecord::Migration[8.0]
  def up
    add_column :companies, :is_client,        :boolean, null: false, default: false
    add_column :companies, :is_subcontractor, :boolean, null: false, default: false

    # 기존 데이터 백필
    execute "UPDATE companies SET is_client        = true WHERE company_type = 'client'"
    execute "UPDATE companies SET is_subcontractor = true WHERE company_type = 'contractor'"

    remove_index  :companies, name: 'index_companies_on_company_type_and_is_active'
    remove_column :companies, :company_type

    add_index :companies, [:is_client,        :is_active]
    add_index :companies, [:is_subcontractor, :is_active]

    # 최소 한 역할은 true여야 함 — DB 레벨 안전장치
    execute <<~SQL
      ALTER TABLE companies
      ADD CONSTRAINT companies_at_least_one_role
      CHECK (is_client = true OR is_subcontractor = true)
    SQL
  end

  def down
    execute "ALTER TABLE companies DROP CONSTRAINT companies_at_least_one_role"
    add_column :companies, :company_type, :string
    execute "UPDATE companies SET company_type = 'client'     WHERE is_client = true"
    execute "UPDATE companies SET company_type = 'contractor' WHERE is_subcontractor = true AND is_client = false"
    change_column_null :companies, :company_type, false

    remove_index  :companies, [:is_client, :is_active]
    remove_index  :companies, [:is_subcontractor, :is_active]
    remove_column :companies, :is_client
    remove_column :companies, :is_subcontractor

    add_index :companies, [:company_type, :is_active]
  end
end
```

### 2.2 Migration 2: 거래처 상세 필드 추가

```ruby
class ExtendCompaniesForPartnerDetails < ActiveRecord::Migration[8.0]
  def change
    change_table :companies do |t|
      # 사업자 정보
      t.string  :business_number                                # 10자리, 하이픈 제거
      t.string  :representative_name
      t.string  :business_type                                  # 업태
      t.string  :business_item                                  # 종목

      # 주소
      t.string  :postal_code
      t.string  :address
      t.string  :address_detail

      # 연락처
      t.string  :phone
      t.string  :fax
      t.string  :email
      t.string  :website

      # 계좌 (지급 대상인 하도급에서 주로 사용)
      t.string  :bank_name
      t.string  :bank_account_number
      t.string  :bank_account_holder

      # 하도급 전용 필드 (is_subcontractor = false면 NULL)
      t.string  :license_number
      t.string  :license_types, array: true, default: []
      t.string  :trade_category

      # 발주처 전용 필드 (is_client = false면 NULL)
      t.string  :client_category                                # 'public' | 'private'

      t.text    :memo
    end

    add_index :companies, :business_number, unique: true, where: 'business_number IS NOT NULL'
    add_index :companies, :company_name
  end
end
```

### 2.3 Migration 3: 담당자 테이블 신규

```ruby
class CreateCompanyContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :company_contacts do |t|
      t.references :company, null: false, foreign_key: true
      t.string  :name,     null: false
      t.string  :position                                       # 직책 (과장, 대리 등)
      t.string  :department                                     # 부서
      t.string  :phone
      t.string  :mobile
      t.string  :email
      t.boolean :is_primary, null: false, default: false
      t.timestamps
    end
  end
end
```

### 2.4 `common_codes` 시드 추가

| 코드 그룹 | 용도 | 예시 값 |
|---|---|---|
| `CLIENT_CATEGORY` | 발주처 분류 | `public:공공`, `private:민간` |
| `LICENSE_TYPE` | 건설업 면허 종류 | `general:종합건설업`, `specialty_cc:철근콘크리트`, `specialty_elec:전기공사업` 등 |
| `TRADE_CATEGORY` | 공종 분류 | `structure:구조`, `finish:마감`, `mep:설비`, `elec:전기` 등 |
| `BANK_CODE` | 은행 코드 | `kb:국민은행`, `shinhan:신한은행`, `woori:우리은행` 등 |

> `COMPANY_TYPE` / `PARTNER_TYPE` 코드 그룹은 **만들지 않는다** (boolean으로 표현하므로 불필요).

---

## 3. 모델

### 3.1 `app/models/company.rb`

```ruby
class Company < ApplicationRecord
  has_many :projects, foreign_key: :client_id,
                      dependent: :restrict_with_error, inverse_of: :client
  has_many :contacts, class_name: 'CompanyContact', dependent: :destroy
  accepts_nested_attributes_for :contacts, allow_destroy: true, reject_if: :all_blank

  validates :company_code, presence: true, uniqueness: true
  validates :company_name, presence: true, length: { maximum: 100 }
  validates :business_number, uniqueness: true, allow_blank: true,
                              format: { with: /\A\d{10}\z/, message: '10자리 숫자로 입력하세요' }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :client_category, inclusion: { in: %w[public private] }, allow_blank: true
  validate  :valid_business_number_checksum, if: -> { business_number.present? }
  validate  :at_least_one_role

  before_validation :normalize_business_number
  before_validation :generate_company_code, on: :create

  scope :active,         -> { where(is_active: true) }
  scope :clients,        -> { where(is_client: true) }
  scope :subcontractors, -> { where(is_subcontractor: true) }
  scope :both_roles,     -> { where(is_client: true, is_subcontractor: true) }
  scope :search, ->(q) {
    return all if q.blank?
    where('company_name ILIKE :q OR business_number LIKE :q OR representative_name ILIKE :q',
          q: "%#{q}%")
  }

  def roles
    [].tap do |r|
      r << 'client'        if is_client?
      r << 'subcontractor' if is_subcontractor?
    end
  end

  def both_roles?
    is_client? && is_subcontractor?
  end

  def role_labels
    roles.map { |r| r == 'client' ? '발주처' : '하도급' }
  end

  def formatted_business_number
    return '' if business_number.blank?
    "#{business_number[0,3]}-#{business_number[3,2]}-#{business_number[5,5]}"
  end

  private

  def normalize_business_number
    self.business_number = business_number.to_s.gsub(/\D/, '') if business_number.present?
  end

  # company_code 자동 생성 — 등록 시점의 역할 기준 prefix
  # is_client가 true면 'C', 그 외엔 'S' (겸업이면 'C' 우선)
  def generate_company_code
    return if company_code.present?
    return unless is_client? || is_subcontractor?  # 역할 검증은 별도

    prefix = is_client? ? 'C' : 'S'
    last_code = Company.where('company_code LIKE ?', "#{prefix}%")
                       .order(company_code: :desc)
                       .limit(1)
                       .pick(:company_code)
    next_num = last_code ? last_code[1..].to_i + 1 : 1
    self.company_code = "#{prefix}#{next_num.to_s.rjust(4, '0')}"
  end

  def at_least_one_role
    return if is_client? || is_subcontractor?
    errors.add(:base, '발주처 또는 하도급 중 하나 이상을 선택해야 합니다')
  end

  # 한국 사업자등록번호 체크섬 검증
  def valid_business_number_checksum
    return if business_number.length != 10
    digits  = business_number.chars.map(&:to_i)
    weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    sum = digits[0..8].zip(weights).sum { |d, w| d * w }
    sum += (digits[8] * 5) / 10
    check = (10 - sum % 10) % 10
    errors.add(:business_number, '유효하지 않은 사업자등록번호입니다') if check != digits[9]
  end
end
```

### 3.2 `app/models/company_contact.rb`

```ruby
class CompanyContact < ApplicationRecord
  belongs_to :company

  validates :name, presence: true, length: { maximum: 50 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  before_save :ensure_single_primary

  private

  # 한 거래처 내 주 담당자는 1명만
  def ensure_single_primary
    return unless is_primary? && (is_primary_changed? || new_record?)
    self.class.where(company_id: company_id, is_primary: true)
              .where.not(id: id)
              .update_all(is_primary: false)
  end
end
```

---

## 4. 라우팅

`config/routes.rb`에 추가:

```ruby
resources :companies do
  resources :contacts, controller: 'company_contacts', only: %i[create update destroy]

  collection do
    get :check_business_number
  end

  member do
    patch :toggle_active
  end
end
```

최종 URL:
- `GET    /companies`                                   — 목록
- `GET    /companies/new`                               — 등록 폼
- `POST   /companies`                                   — 생성
- `GET    /companies/:id`                               — 상세
- `GET    /companies/:id/edit`                          — 수정 폼
- `PATCH  /companies/:id`                               — 수정
- `DELETE /companies/:id`                               — 비활성화 (`is_active=false`)
- `PATCH  /companies/:id/toggle_active`
- `GET    /companies/check_business_number?number=...`
- `POST   /companies/:id/contacts`
- `PATCH  /companies/:id/contacts/:id`
- `DELETE /companies/:id/contacts/:id`

---

## 5. 컨트롤러

### 5.1 `app/controllers/companies_controller.rb`

```ruby
class CompaniesController < ApplicationController
  before_action :require_login
  before_action :set_company, only: %i[show edit update destroy toggle_active]

  def index
    @companies = Company.search(params[:q])
    @companies = filter_by_role(@companies, params[:role])
    @companies = @companies.active unless params[:include_inactive] == '1'
    @companies = @companies.order(:company_name).page(params[:page]).per(20)
  end

  def show
    @contacts = @company.contacts.order(is_primary: :desc, name: :asc)
  end

  def new
    @company = Company.new(default_role_attributes)
    @company.contacts.build(is_primary: true)
  end

  def create
    @company = Company.new(company_params)
    if @company.save
      redirect_to @company, notice: '거래처가 등록되었습니다.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @company.update(company_params)
      redirect_to @company, notice: '거래처 정보가 수정되었습니다.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @company.update(is_active: false)
    redirect_to companies_path, notice: '거래처가 비활성화되었습니다.'
  end

  def toggle_active
    @company.update(is_active: !@company.is_active)
    redirect_to @company
  end

  def check_business_number
    number = params[:number].to_s.gsub(/\D/, '')
    exists = Company.where(business_number: number)
                    .where.not(id: params[:exclude_id])
                    .exists?
    render partial: 'business_number_check', locals: { number: number, exists: exists }
  end

  private

  def set_company
    @company = Company.find(params[:id])
  end

  def filter_by_role(scope, role)
    case role
    when 'client'        then scope.clients
    when 'subcontractor' then scope.subcontractors
    when 'both'          then scope.both_roles
    else scope
    end
  end

  # /companies/new?role=subcontractor 같은 진입점 지원
  def default_role_attributes
    case params[:role]
    when 'client'        then { is_client: true }
    when 'subcontractor' then { is_subcontractor: true }
    else { is_subcontractor: true }  # 기본값
    end
  end

  def company_params
    params.require(:company).permit(
      :company_name, :is_client, :is_subcontractor,
      :business_number, :representative_name, :business_type, :business_item,
      :postal_code, :address, :address_detail,
      :phone, :fax, :email, :website,
      :bank_name, :bank_account_number, :bank_account_holder,
      :license_number, :trade_category, :client_category,
      :memo, :is_active,
      license_types: [],
      contacts_attributes: %i[id name position department phone mobile email is_primary _destroy]
    )
  end
end
```

---

## 6. 화면 설계 (UI/UX)

### 6.1 공통 레이아웃
- 사이드바 위치: 별도 메뉴 그룹 (또는 `설정` 하위)
- 헤더: 모듈명 + 우측 `+ 거래처 등록` 버튼 (shadcn 스타일 primary)
- **역할 배지 컬러:**
  - 발주처: `bg-blue-100 text-blue-700`
  - 하도급: `bg-amber-100 text-amber-700`
  - 한 회사가 두 역할이면 배지를 2개 나란히 표시

### 6.2 목록 화면 (`index`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 거래처 관리                                       [+ 거래처 등록]   │
├─────────────────────────────────────────────────────────────────────┤
│ [전체] [발주처] [하도급]               🔍 [검색창_____] [검색]      │
│                                        ☐ 비활성 포함                │
├─────────────────────────────────────────────────────────────────────┤
│ 코드   │ 역할         │ 업체명       │ 사업자번호    │ 대표자 │상태│
│ ------ │ ------------ │ ------------ │ ------------ │ ------ │----│
│ C0001  │ [발주처]     │ ㈜한국주택    │ 123-45-67890 │ 김한국 │활성│
│ S0001  │ [하도급]     │ 대한콘크리트  │ 234-56-78901 │ 이대한 │활성│
│ C0002  │ [발주처][하도│ ㈜종합건설    │ 345-67-89012 │ 최종합 │활성│
│        │ 급]          │              │              │        │    │
│ ...                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                       < 1 2 3 ... >                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**탭 동작 (Turbo Frame):**
- `[전체]`   → 모든 활성 거래처
- `[발주처]` → `is_client = true` (겸업도 포함됨)
- `[하도급]` → `is_subcontractor = true` (겸업도 포함됨)
- 즉 겸업 거래처는 발주처 탭과 하도급 탭 양쪽에 모두 노출됨 (의도된 동작)

**행 동작:**
- 행 클릭 → 상세 페이지 이동
- 비활성 거래처는 `bg-slate-50 text-slate-400`으로 흐리게 표시

### 6.3 등록/수정 화면 (`new`, `edit`)

**섹션 1: 역할 및 기본 정보**
```
┌─ 역할 (하나 이상 선택) ─────────────────────────┐
│ ☑ 발주처      ☑ 하도급                          │
└─────────────────────────────────────────────────┘

업체명 *      [_______________________]
사업자등록번호 [___-__-_____]   ← blur 시 중복/체크섬 검증
대표자명      [_______________________]
업태          [____________]   종목 [____________]
```

> 둘 다 체크 해제 시 클라이언트에서 즉시 에러 표시. 서버에서도 `at_least_one_role`로 차단.

**섹션 2: 분류 정보 (체크된 역할에 따라 동적 표시)**
- ☑ 발주처일 때 표시: 발주처 분류 (라디오: 공공/민간)
- ☑ 하도급일 때 표시: 면허번호, 면허 종류(다중 선택), 공종 분류
- 두 역할 모두 체크 시 두 블록 모두 표시

**섹션 3: 주소 및 연락처**
- 우편번호 + [주소 검색] (Daum API는 v2)
- 주소, 상세주소
- 전화, 팩스, 이메일, 홈페이지

**섹션 4: 계좌 정보** (collapsible, 기본 접힘)
- 은행명, 계좌번호, 예금주

**섹션 5: 담당자** (Stimulus로 동적 추가/삭제)
- 담당자 카드 여러 개
- 각 카드: 이름, 직책, 부서, 전화, 휴대폰, 이메일, [주 담당자]
- [+ 담당자 추가] 버튼

**섹션 6: 메모** (textarea 4행)

**하단 액션**
- 좌: [취소]
- 우: [저장]

> `company_code`는 폼에서 입력받지 않음 (자동 생성). 수정 시에는 readonly로 표시만.

### 6.4 상세 화면 (`show`)

```
┌──────────────────────────────────────────────────────────────────┐
│ ㈜종합건설  C0002  [발주처][하도급]      [수정] [비활성화]       │
├──────────────────────────────────────────────────────────────────┤
│ [기본정보] [담당자] [거래 이력]                                  │
├──────────────────────────────────────────────────────────────────┤
│ 기본 정보                                                        │
│   사업자등록번호   345-67-89012                                  │
│   대표자           최종합                                        │
│   업태/종목        건설업 / 종합건설                             │
│   ...                                                            │
│                                                                  │
│ 발주처 정보                                                      │
│   분류             민간                                          │
│                                                                  │
│ 하도급 정보                                                      │
│   면허번호         서울-12345                                    │
│   면허 종류        종합건설업                                    │
│   공종 분류        구조                                          │
│                                                                  │
│ 담당자 (2명)                                                     │
│ ┌──────────────┐ ┌──────────────┐                                │
│ │ 박담당 [주]   │ │ 최담당        │                                │
│ │ 과장 · 공무팀 │ │ 대리 · 현장   │                                │
│ │ 010-...       │ │ 010-...       │                                │
│ └──────────────┘ └──────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
```

> `발주처 정보` 섹션은 `is_client?`일 때만, `하도급 정보` 섹션은 `is_subcontractor?`일 때만 렌더링.

---

## 7. Stimulus 컨트롤러

### 7.1 `business_number_controller.js`
- 입력 중 자동 하이픈 (xxx-xx-xxxxx)
- blur 시 `/companies/check_business_number?number=...&exclude_id=...` 호출
- 중복일 경우 input 하단에 에러 + 빨간 테두리

### 7.2 `role_toggle_controller.js`
- `is_client`, `is_subcontractor` 두 체크박스의 변경을 감지
- `is_client` → `data-role-toggle-target="clientSection"` 표시 토글
- `is_subcontractor` → `data-role-toggle-target="subcontractorSection"` 표시 토글
- 둘 다 해제 시 폼 하단에 경고 메시지 표시 + 저장 버튼 비활성화

```html
<div data-controller="role-toggle">
  <input type="checkbox" name="company[is_client]"
         data-role-toggle-target="clientCheck"
         data-action="change->role-toggle#refresh">
  <input type="checkbox" name="company[is_subcontractor]"
         data-role-toggle-target="subcontractorCheck"
         data-action="change->role-toggle#refresh">

  <section data-role-toggle-target="clientSection">발주처 전용 필드…</section>
  <section data-role-toggle-target="subcontractorSection">하도급 전용 필드…</section>

  <p data-role-toggle-target="warning" class="hidden text-red-600">
    발주처 또는 하도급 중 하나 이상을 선택해야 합니다.
  </p>
</div>
```

### 7.3 `contacts_fields_controller.js`
- [+ 담당자 추가] 클릭 시 템플릿 복제하여 DOM 삽입 (인덱스 갱신)
- [삭제] 클릭 시 `_destroy` hidden을 `1`로 설정하고 hide
- [주 담당자] 체크박스는 한 번에 하나만 선택되도록 라디오처럼 동작

---

## 8. 뷰 파일 구조

```
app/views/companies/
├── index.html.erb
├── show.html.erb
├── new.html.erb
├── edit.html.erb
├── _form.html.erb                    # new/edit 공용
├── _company_row.html.erb             # index 테이블 행
├── _role_section.html.erb            # form 섹션 1: 역할 체크박스 + 기본정보
├── _classification_section.html.erb  # form 섹션 2: 발주처/하도급 분류
├── _address_section.html.erb         # form 섹션 3
├── _bank_section.html.erb            # form 섹션 4
├── _contacts_section.html.erb        # form 섹션 5
├── _contact_fields.html.erb          # 담당자 1명 필드 세트
├── _role_badges.html.erb             # 역할 배지 (발주처/하도급)
└── _business_number_check.html.erb   # 사업자번호 중복 체크 응답
```

---

## 9. 시드 데이터

`db/seeds/companies.rb` 생성:

```ruby
# 발주처 단독 2건
Company.create!(
  is_client: true,
  is_subcontractor: false,
  company_name: '㈜한국주택공사',
  business_number: '1048108100',         # 실제 유효 체크섬 번호로 교체 필요
  representative_name: '김한국',
  client_category: 'public',
  business_type: '공기업',
  phone: '02-1234-5678',
  address: '서울특별시 강남구 테헤란로 123',
  is_active: true,
  contacts_attributes: [
    { name: '박발주', position: '부장', department: '사업관리팀',
      mobile: '010-1111-2222', email: 'park@khc.kr', is_primary: true }
  ]
)

# 하도급 단독 5건 (공종별)
Company.create!(
  is_client: false,
  is_subcontractor: true,
  company_name: '대한철근콘크리트',
  business_number: '2118612344',
  representative_name: '이대한',
  license_types: ['specialty_cc'],
  trade_category: 'structure',
  bank_name: 'kb',
  bank_account_number: '123456-01-789012',
  bank_account_holder: '대한철근콘크리트',
  is_active: true
)
# ... (전기, 설비, 마감, 토공 각 1건)

# 겸업 1건 — 자기 공장 발주 + 평소엔 하도급
Company.create!(
  is_client: true,
  is_subcontractor: true,
  company_name: '㈜종합건설',
  business_number: '3058612355',
  representative_name: '최종합',
  client_category: 'private',
  license_types: ['general'],
  trade_category: 'structure',
  is_active: true
)
```

`db/seeds.rb`에 `load Rails.root.join('db/seeds/companies.rb')` 추가.

---

## 10. 테스트 시나리오

### 10.1 모델 테스트 (`test/models/company_test.rb`)
- [ ] `is_client`, `is_subcontractor` 둘 다 false면 invalid (`at_least_one_role`)
- [ ] `business_number`가 10자리가 아니면 invalid
- [ ] `business_number` 체크섬이 맞지 않으면 invalid
- [ ] `business_number` 중복이면 invalid
- [ ] `business_number`가 blank면 valid (선택 필드)
- [ ] `is_client: true`로 생성 시 `company_code`가 `C` prefix로 자동 생성
- [ ] `is_subcontractor: true`만 true로 생성 시 `S` prefix
- [ ] `is_client`와 `is_subcontractor` 모두 true면 `C` prefix (client 우선)
- [ ] 같은 prefix 연속 생성 시 번호가 1씩 증가 (`C0001` → `C0002`)
- [ ] `roles`가 `['client', 'subcontractor']` 반환
- [ ] `both_roles?`가 두 역할 모두일 때 true
- [ ] `formatted_business_number`가 `123-45-67890` 형식 반환
- [ ] `clients` 스코프가 겸업 거래처도 포함
- [ ] `subcontractors` 스코프가 겸업 거래처도 포함
- [ ] `both_roles` 스코프가 겸업만 반환
- [ ] `search` 스코프가 업체명/사업자번호/대표자명 LIKE 매칭

### 10.2 컨트롤러 테스트
- [ ] 비로그인 시 모든 액션 302 리다이렉트
- [ ] `GET /companies?role=client` → `is_client=true`인 거래처만
- [ ] `GET /companies?role=subcontractor` → `is_subcontractor=true`인 거래처만
- [ ] `POST /companies` 두 역할 모두 체크하여 생성 성공
- [ ] `POST /companies` 두 역할 모두 미체크 시 422 + `at_least_one_role` 에러
- [ ] `DELETE /companies/:id` → `is_active=false`로 변경, 레코드 보존
- [ ] `PATCH /companies/:id/toggle_active` → 활성 상태 반전
- [ ] `GET /companies/check_business_number` → 중복일 때 `exists: true` 응답

### 10.3 시스템 테스트 (주요 플로우)
- [ ] 목록 → [거래처 등록] → 두 역할 모두 체크 → 두 분류 섹션 표시 확인
- [ ] 두 역할 모두 해제 → 저장 버튼 비활성화 + 경고 표시
- [ ] 사업자번호 중복 입력 시 실시간 에러 표시
- [ ] 수정 화면에서 `is_client` 체크 추가 → 발주처 분류 섹션 등장 → 저장 → 반영 확인
- [ ] 담당자 1명 추가 → 저장 → 상세 페이지에서 표시 확인
- [ ] 담당자 1명 삭제 → 저장 → 삭제 반영 확인
- [ ] 탭 전환 (전체 ↔ 발주처 ↔ 하도급) Turbo Frame 동작 확인
- [ ] 겸업 거래처가 발주처 탭과 하도급 탭 양쪽에 노출되는지 확인

---

## 11. 구현 체크리스트

### Phase 1: 마이그레이션 및 모델
- [ ] Migration 1 (`ConvertCompanyTypeToRoleBooleans`) 작성 및 실행
- [ ] Migration 2 (`ExtendCompaniesForPartnerDetails`) 작성 및 실행
- [ ] Migration 3 (`CreateCompanyContacts`) 작성 및 실행
- [ ] `common_codes` 시드에 `CLIENT_CATEGORY`, `LICENSE_TYPE`, `TRADE_CATEGORY`, `BANK_CODE` 추가
- [ ] `Company` 모델 업데이트 (역할 boolean, validation, 자동 코드 생성)
- [ ] `CompanyContact` 모델 신규 작성
- [ ] 모델 유닛 테스트 통과

### Phase 2: CRUD 최소 동작
- [ ] 라우팅 설정
- [ ] `CompaniesController` 7개 액션 구현
- [ ] `CompanyContactsController` 구현
- [ ] 뷰 최소 버전 (index, show, new/edit form) 구현
- [ ] 시드 데이터로 목록 표시 확인

### Phase 3: UX 고도화
- [ ] Stimulus 3개 (사업자번호, 역할 토글, 담당자 동적 추가)
- [ ] 탭 + 검색 + 필터를 Turbo Frame으로 최적화
- [ ] 사업자번호 실시간 중복 체크
- [ ] 역할 배지 partial (`_role_badges.html.erb`)

### Phase 4: 완성도
- [ ] 상세 페이지 탭 레이아웃
- [ ] 비활성화/재활성화 토글
- [ ] 전체 시스템 테스트 통과

---

## 12. 제외 범위 (향후 과제)

- Daum 우편번호 API 연동 (v2)
- 국세청 사업자번호 실시간 검증 API (v2)
- 엑셀 일괄 업로드/다운로드 (v2)
- 거래처 상세의 `거래 이력` 탭 실데이터 (하도급 계약 모듈 이후)
- 거래처 평가/등급 관리 (별도 모듈)
- 발주처-하도급 역할이 같은 회사인 경우의 이해상충 경고 (정책 결정 후)

---

## 13. 참고 규약 (Neo 공통)

- 모든 사용자 인터페이스 텍스트는 **한국어**
- 폼 에러 메시지는 필드 하단에 빨간 텍스트
- 성공 메시지는 `flash[:notice]`, 에러는 `flash[:alert]`
- 단일 테넌트 전제 — `company_id` 스코프 없음 (※ 여기서 `company`는 거래처를 의미하며 테넌트 회사가 아님)
- 세션 기반 인증: `before_action :require_login`
- 테이블 헤더 `sticky top-0`, 행 hover 시 `bg-slate-50`
- 버튼 primary: `bg-slate-900 text-white hover:bg-slate-800`
- 버튼 secondary: `bg-white border border-slate-300 hover:bg-slate-50`
- `company_code`는 표시 전용, 사용자가 입력하지 않음
