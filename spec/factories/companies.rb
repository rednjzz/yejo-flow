# frozen_string_literal: true

FactoryBot.define do
  factory :company do
    sequence(:company_code) { |n| "CO-#{n.to_s.rjust(3, "0")}" }
    company_name { "테스트 회사" }
    company_type { "client" }
    is_active { true }

    trait :client do
      company_type { "client" }
    end

    trait :contractor do
      company_type { "contractor" }
    end

    trait :inactive do
      is_active { false }
    end
  end
end
