# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "Test User" }
    password { "Secret1*3*5*" }
    verified { true }
    role { "site_staff" }

    trait :admin do
      role { "admin" }
    end

    trait :hq_manager do
      role { "hq_manager" }
    end

    trait :hq_staff do
      role { "hq_staff" }
    end

    trait :site_manager do
      role { "site_manager" }
    end
  end
end
