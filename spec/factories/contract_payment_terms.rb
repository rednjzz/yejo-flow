# frozen_string_literal: true

FactoryBot.define do
  factory :contract_payment_term do
    association :contract
    term_type { "advance" }
    seq { 1 }
    rate { 30.00 }
    amount { 300_000_000 }
    condition { "계약후 15일이내" }
    sort_order { 0 }

    trait :advance do
      term_type { "advance" }
    end

    trait :interim_milestone do
      term_type { "interim" }
      interim_method { "milestone" }
      condition { "공정 완료 후" }
    end

    trait :interim_monthly do
      term_type { "interim" }
      interim_method { "monthly_billing" }
      rate { nil }
      amount { nil }
      condition { "매월 기성 청구 승인 후" }
    end

    trait :final do
      term_type { "final" }
      rate { 20.00 }
      amount { 200_000_000 }
      condition { "준공후 15일이내" }
    end
  end
end
