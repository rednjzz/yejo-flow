# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    sequence(:project_code) { |n| "#{Date.current.year}-#{n.to_s.rjust(3, "0")}" }
    project_name { "테스트 현장" }
    association :client, factory: [:company, :client]
    contract_amount { 1_000_000_000 }
    start_date { Date.current }
    end_date { 1.year.from_now.to_date }
    status { "preparing" }

    trait :in_progress do
      status { "in_progress" }
    end

    trait :completed do
      status { "completed" }
      actual_end_date { Date.current }
    end

    trait :with_manager do
      association :manager, factory: [:user, :site_manager]
    end
  end
end
