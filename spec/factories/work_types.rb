# frozen_string_literal: true

FactoryBot.define do
  factory :work_type do
    sequence(:work_type_code) { |n| "WT-#{n.to_s.rjust(2, "0")}" }
    work_type_name { "토공사" }
    level { 1 }
    sort_order { 0 }
    is_active { true }

    trait :inactive do
      is_active { false }
    end

    trait :with_parent do
      association :parent, factory: :work_type
      level { 2 }
    end
  end
end
