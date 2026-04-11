# frozen_string_literal: true

# 관리자 계정
admin = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.name = "시스템관리자"
  u.password = "Password1234!"
  u.role = "admin"
  u.verified = true
end

# 발주처
clients = [
  Company.find_or_create_by!(company_code: "CL-001") do |c|
    c.company_name = "대한건설개발(주)"
    c.company_type = "client"
  end,
  Company.find_or_create_by!(company_code: "CL-002") do |c|
    c.company_name = "판교로지스(주)"
    c.company_type = "client"
  end,
  Company.find_or_create_by!(company_code: "CL-003") do |c|
    c.company_name = "일산디벨롭(주)"
    c.company_type = "client"
  end,
  Company.find_or_create_by!(company_code: "CL-004") do |c|
    c.company_name = "수원하우징(주)"
    c.company_type = "client"
  end
]

# 공종
work_types = [
  WorkType.find_or_create_by!(work_type_code: "WT-01") { |wt| wt.work_type_name = "토공사"; wt.level = 1; wt.sort_order = 1 },
  WorkType.find_or_create_by!(work_type_code: "WT-02") { |wt| wt.work_type_name = "RC공사"; wt.level = 1; wt.sort_order = 2 },
  WorkType.find_or_create_by!(work_type_code: "WT-03") { |wt| wt.work_type_name = "철골공사"; wt.level = 1; wt.sort_order = 3 },
  WorkType.find_or_create_by!(work_type_code: "WT-04") { |wt| wt.work_type_name = "방수공사"; wt.level = 1; wt.sort_order = 4 },
  WorkType.find_or_create_by!(work_type_code: "WT-05") { |wt| wt.work_type_name = "기계설비"; wt.level = 1; wt.sort_order = 5 },
  WorkType.find_or_create_by!(work_type_code: "WT-06") { |wt| wt.work_type_name = "전기공사"; wt.level = 1; wt.sort_order = 6 }
]

# 프로젝트 4개
projects_data = [
  {code: "2024-003", name: "강남 오피스텔 신축", client: clients[0], amount: 8_200_000_000, start: "2024-03-01", end_date: "2025-04-30", status: "in_progress"},
  {code: "2024-005", name: "판교 물류센터", client: clients[1], amount: 6_400_000_000, start: "2024-05-01", end_date: "2025-08-31", status: "in_progress"},
  {code: "2024-008", name: "일산 상업시설", client: clients[2], amount: 3_800_000_000, start: "2024-08-01", end_date: "2025-06-30", status: "in_progress"},
  {code: "2025-001", name: "수원 공동주택", client: clients[3], amount: 4_800_000_000, start: "2025-01-15", end_date: "2026-06-30", status: "in_progress"}
]

projects_data.each do |pd|
  p = Project.find_or_create_by!(project_code: pd[:code]) do |proj|
    proj.project_name = pd[:name]
    proj.client = pd[:client]
    proj.contract_amount = pd[:amount]
    proj.start_date = pd[:start]
    proj.end_date = pd[:end_date]
    proj.status = pd[:status]
    proj.manager = admin
  end

  # 원도급 계약
  contract = Contract.find_or_create_by!(project: p, contract_type: "original") do |con|
    con.contract_no = "#{pd[:code]}-ORG"
    con.contract_date = pd[:start]
    con.contract_amount = pd[:amount]
  end

  # 도급내역 (원도급 계약에 샘플 내역 3건)
  next if contract.contract_items.any?

  [
    {wt: work_types[0], name: "터파기", unit: "m3", qty: 5000, price: 15_000},
    {wt: work_types[1], name: "콘크리트 타설", unit: "m3", qty: 3000, price: 180_000},
    {wt: work_types[2], name: "철골 제작 설치", unit: "ton", qty: 500, price: 3_500_000}
  ].each_with_index do |d, i|
    contract.contract_items.create!(
      project: p,
      work_type: d[:wt],
      item_name: d[:name],
      unit: d[:unit],
      quantity: d[:qty],
      unit_price: d[:price],
      sort_order: i + 1
    )
  end
end

puts "Seed data created successfully!"
puts "  Admin: admin@example.com / Password1234!"
puts "  Companies: #{Company.count}"
puts "  Work Types: #{WorkType.count}"
puts "  Projects: #{Project.count}"
puts "  Contracts: #{Contract.count}"
puts "  Contract Details: #{ContractItem.count}"
