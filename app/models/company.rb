# frozen_string_literal: true

class Company < ApplicationRecord
  TYPES = %w[client contractor].freeze

  has_many :projects, foreign_key: :client_id, dependent: :restrict_with_error, inverse_of: :client

  validates :company_code, presence: true, uniqueness: true
  validates :company_name, presence: true
  validates :company_type, presence: true, inclusion: {in: TYPES}

  scope :active, -> { where(is_active: true) }
  scope :clients, -> { where(company_type: "client") }
  scope :contractors, -> { where(company_type: "contractor") }
end
