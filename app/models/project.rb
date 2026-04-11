# frozen_string_literal: true

class Project < ApplicationRecord
  STATUSES = %w[preparing in_progress completed defect_period closed].freeze

  STATUS_FLOW = {
    "preparing" => ["in_progress"],
    "in_progress" => ["completed"],
    "completed" => ["defect_period"],
    "defect_period" => ["closed"],
    "closed" => []
  }.freeze

  STATUS_LABELS = {
    "preparing" => "준비중",
    "in_progress" => "진행중",
    "completed" => "준공",
    "defect_period" => "하자보수",
    "closed" => "종료"
  }.freeze

  belongs_to :client, class_name: "Company"
  belongs_to :manager, class_name: "User", optional: true
  has_many :contracts, dependent: :destroy
  has_many :contract_details, dependent: :destroy

  validates :project_code, presence: true, uniqueness: true
  validates :project_name, presence: true, length: {maximum: 200}
  validates :contract_amount, presence: true, numericality: {greater_than: 0}
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :status, presence: true, inclusion: {in: STATUSES}
  validate :end_date_after_start_date

  before_validation :set_project_code, on: :create
  before_validation :calculate_vat

  scope :active, -> { where.not(status: "closed") }

  def latest_contract
    contracts.order(change_seq: :desc).first
  end

  def current_contract_amount
    latest_contract&.contract_amount
  end

  def effective_defect_liability_months
    effective_contract_value(:defect_liability_months)
  end

  def effective_late_penalty_rate
    effective_contract_value(:late_penalty_rate)
  end

  def effective_late_penalty_cap_rate
    effective_contract_value(:late_penalty_cap_rate)
  end

  def effective_contract_payment_terms
    latest_contract&.contract_payment_terms&.ordered || ContractPaymentTerm.none
  end

  def status_label
    STATUS_LABELS[status]
  end

  def can_transition_to?(new_status)
    STATUS_FLOW[status]&.include?(new_status)
  end

  def self.generate_project_code
    year = Date.current.year
    last = where("project_code LIKE ?", "#{year}-%").order(:project_code).last
    seq = last ? last.project_code.split("-").last.to_i + 1 : 1
    "#{year}-#{seq.to_s.rjust(3, "0")}"
  end

  private

  def set_project_code
    self.project_code ||= self.class.generate_project_code
  end

  def calculate_vat
    self.vat_amount = (contract_amount * 0.1).to_i if contract_amount.present?
  end

  def end_date_after_start_date
    return unless start_date && end_date
    errors.add(:end_date, "은 착공일 이후여야 합니다") if end_date <= start_date
  end

  def effective_contract_value(field)
    contracts.order(change_seq: :desc).each do |contract|
      value = contract.public_send(field)
      return value if value.present?
    end
    nil
  end
end
