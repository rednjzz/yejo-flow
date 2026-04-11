# frozen_string_literal: true

FactoryBot.define do
  factory :contract_item do
    association :contract
    project { contract.project }
    association :work_type
    item_name { "토공사 - 터파기" }
    unit { "m3" }
    quantity { 100.0 }
    unit_price { 50_000 }
    amount { 5_000_000 }
    sort_order { 0 }
  end
end
