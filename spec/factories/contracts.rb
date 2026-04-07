# frozen_string_literal: true

FactoryBot.define do
  factory :contract do
    association :project
    sequence(:contract_no) { |n| "CON-#{n.to_s.rjust(3, "0")}" }
    contract_type { "original" }
    contract_date { Date.current }
    contract_amount { 1_000_000_000 }

    trait :original do
      contract_type { "original" }
    end

    trait :change do
      contract_type { "change" }
      change_seq { 1 }
      change_amount { 100_000_000 }
    end
  end
end
