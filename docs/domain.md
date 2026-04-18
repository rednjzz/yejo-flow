# Domain Knowledge — 예조건설 ERP (Neo)

건설 프로젝트 관리 시스템의 도메인 모델, 업무 규칙, 용어를 정의한다.

---

## 1. 도메인 용어 사전 (Ubiquitous Language)

| 모델명 (EN) | 한국어 업무용어 | 설명 |
|---|---|---|
| `Company` | 회사 | 시공사(원청) 또는 협력업체(하청) |
| `Project` | 공사 / 현장 | 개별 건설 현장 단위 |
| `Phase` | 공종 | 토목, 건축, 기계, 전기 등 공사 분류 |
| `Task` | 세부공종 / 작업 | Phase 하위의 구체적 작업 항목 |
| `Contract` | 계약 | 원도급·하도급 계약 |
| `ContractItem` | 내역항목 | 계약 내 개별 공종·품목 (단가·수량 포함) |
| `Subcontractor` | 하도급자 | 하도급 계약 당사자 |
| `ProgressBilling` | 기성 | 공사 진행에 따른 대금 청구 |
| `DesignChange` | 설계변경 | 설계 도면·내역 변경 및 정산 |
| `DailySiteLog` | 현장공사일지 | 일일 공사 현황 기록 |
| `Estimation` | 적산 | 자재·노무·경비 물량 산출 |
| `Worker` | 작업자 / 인력 | 현장 투입 인력 (직영·일용) |
| `Material` | 자재 | 투입 자재 및 입출고 관리 |
| `Equipment` | 장비 | 중장비·소형장비 투입 관리 |
| `SafetyLog` | 안전일지 | 안전점검·TBM 기록 |
| `Document` | 문서 | 도면, 시방서, 공문 등 첨부 문서 |

---

## 2. 사용자 역할 (User Roles)

| Role (EN) | 한국어 | 주요 권한 |
|---|---|---|
| `site_staff` | 현장 실무자 | 담당 현장 일지 작성, 담당 프로젝트 관련 입력,조회,변경 |
| `site_manager` | 현장 소장 | 담당 현장 데이터 승인, 검토 |
| `hq_staff` | 본사 공무 | 담당 현장 일지 작성, 담당 프로젝트 관련 입력,조회,변경 |
| `hq_manager` | 본사 공무팀장 | 모든 현장 데이터 승인, 검토 |
| `admin` | 시스템관리자 | 사용자 관리·권한 부여·기초코드 관리 및 모든 권한 |

---

## 3. 핵심 도메인 모델 관계

```
Company
 └── Project
      ├── Contract
      │    └── ContractItem
      ├── DailySiteLog
      │    ├── WorkerEntry   (인력 투입)
      │    ├── MaterialEntry (자재 투입)
      │    └── EquipmentEntry(장비 투입)
      ├── DesignChange
      │    └── DesignChangeItem → ContractItem
      ├── Phase
      │    └── Task
      ├── ProgressBilling
      │    └── ProgressBillingItem → ContractItem
      ├── SafetyLog
      └── Document
```

- `User` → belongs to `Company`, assigned to one or more `Project`
- `ProgressBillingItem` → references `ContractItem` (내역 기준 수량·금액 청구)
- `DesignChangeItem` → 기존 `ContractItem` 수정 또는 신규 항목 추가

---

## 4. 핵심 업무 흐름 (Workflows)

### 4.1 일일 공사일지

```
작성(draft) → 제출(submitted) → 승인(approved) → 보관(archived)
```

- 현장직원,본사공무이 당일 인력·자재·장비·작업내용을 기록
- 현장소장이 확인·승인
- 본사에서 조회·집계

### 4.2 기성 청구

```
작성(draft) → 제출(submitted) → 검토(under_review) → 승인(approved) → 수금(paid)
```

1. 공무담당이 계약 내역 기준으로 당월 시공 수량 산출
2. 기성 청구서 작성 (내역항목별 금회·누계)
3. 감리·발주처 검토 및 승인
4. 승인된 금액 기준 세금계산서 발행·대금 수령

### 4.3 설계변경

```
요청(requested) → 검토(under_review) → 승인(approved) → 내역반영(applied) → 정산(settled)
```

1. 변경 사유 발생 (현장 여건, 발주처 지시 등)
2. 설계변경 내역 작성 (증감 물량·금액)
3. 발주처 승인
4. 계약 내역에 반영 → 이후 기성에 포함

### 4.4 계약 관리

```
원도급 계약 체결 → 내역항목 등록 → 하도급 계약 체결 → 하도급 내역 연결
```

---

## 5. 비즈니스 규칙 (Business Rules)

### 기성

- 기성 청구 누계 금액은 계약 총액을 초과할 수 없다
- 설계변경 미승인 항목은 기성 청구에 포함할 수 없다
- 기성률(%) = 기성 누계 금액 / 계약 금액 × 100

### 일지

- 공사일지는 해당 공사일 기준 익영업일까지 작성 가능 (이후는 소장 승인 필요)
- 승인 완료된 일지는 수정 불가 (반려 후 재작성)

### 계약

- 하도급 계약 금액은 해당 공종 원도급 금액을 초과할 수 없다 (하도급법 준수)
- 계약 변경 시 변경 이력을 반드시 보존한다

### 금액 계산

- 내역 금액 = 수량 × 단가
- 부가세 별도가 기본, 부가세 포함 여부는 계약 단위로 설정
- 원 단위 절사 (원 미만 버림)

---

## 6. 상태 머신 (State Machines)

### DailySiteLog

| 상태 | 전이 가능 | 조건 |
|---|---|---|
| `draft` | `submitted` | 필수 항목 입력 완료 |
| `submitted` | `approved`, `rejected` | 공무 팀장 or 현장소장 검토 |
| `rejected` | `draft` | 반려 사유 입력 필수 |
| `approved` | `archived` | 자동 또는 월말 일괄 |

### ProgressBilling

| 상태 | 전이 가능 | 조건 |
|---|---|---|
| `draft` | `submitted` | 내역항목 1건 이상 |
| `submitted` | `under_review` | 공무 팀장, 현장 소장 확인 |
| `under_review` | `approved`, `rejected` | 감리/발주처 검토 |
| `approved` | `paid` | 입금 확인 |
| `rejected` | `draft` | 반려 사유 입력 필수 |

### DesignChange

| 상태 | 전이 가능 | 조건 |
|---|---|---|
| `requested` | `under_review` | 변경 내역 작성 완료 |
| `under_review` | `approved`, `rejected` | 발주처 검토 |
| `approved` | `applied` | 계약 내역 반영 완료 |
| `applied` | `settled` | 정산 완료 |

---

## 7. 단위·측정 체계

### 수량 단위

| 단위 | 코드 | 용도 |
|---|---|---|
| m | `m` | 길이 (배관, 전선 등) |
| m² | `m2` | 면적 (바닥, 벽체 등) |
| m³ | `m3` | 체적 (콘크리트, 토공 등) |
| ton | `ton` | 중량 (철근, 형강 등) |
| 인 | `man_day` | 인력 (1일 기준 인공) |
| 식 | `lump_sum` | 일식 (세부 산출 없이 일괄) |
| 개소 | `unit` | 개수 (맨홀, 접속함 등) |
| kg | `kg` | 소량 중량 |
| EA | `ea` | 개별 수량 |

### 금액

- 통화: KRW (원)
- 소수점: 수량은 소수 3자리까지, 금액은 정수 (원 미만 절사)
- 부가세: 계약 단위로 별도/포함 설정

---

## 8. 외부 연동 포인트 (향후)

| 시스템 | 설명 | 우선순위 |
|---|---|---|
| CALS | 건설사업관리시스템 (공공공사 의무) | 중 |
| 전자세금계산서 | 국세청 e세금계산서 발행 | 상 |
| 하도급지킴이 | 하도급대금 직접지급 확인 | 중 |
| 건설근로자공제회 | 퇴직공제 신고 | 하 |
| KOICA/조달청 | 나라장터 입찰 연동 | 하 |

---

## 9. 참고: 건설 업무 주기

| 주기 | 업무 |
|---|---|
| 일간 | 공사일지, 안전일지, 인력·자재·장비 투입 기록 |
| 주간 | 주간 공정회의, 진도율 점검 |
| 월간 | 기성 청구, 원가 정산, 경영보고 |
| 수시 | 설계변경, 계약 변경, 클레임 |
