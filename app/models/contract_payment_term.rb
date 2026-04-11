# frozen_string_literal: true

class ContractPaymentTerm < ApplicationRecord
  TERM_TYPES = %w[advance interim final].freeze
  INTERIM_METHODS = %w[milestone monthly_billing].freeze

  belongs_to :contract

  validates :term_type, presence: true, inclusion: {in: TERM_TYPES}
  validates :seq, presence: true, numericality: {greater_than: 0}
  validates :interim_method, inclusion: {in: INTERIM_METHODS}, if: -> { interim? }
  validates :interim_method, absence: true, unless: -> { interim? }
  validates :sort_order, presence: true
  validates :seq, uniqueness: {scope: [:contract_id, :term_type]}

  validate :single_advance_or_final
  validate :consistent_interim_method

  scope :ordered, -> { order(:sort_order, :term_type, :seq) }

  def advance? = term_type == "advance"
  def interim? = term_type == "interim"
  def final? = term_type == "final"
  def monthly_billing? = interim_method == "monthly_billing"

  def display_label
    case term_type
    when "advance" then "착수금"
    when "interim"
      monthly_billing? ? "중도금(월기성)" : "중도금 #{seq}차"
    when "final" then "잔금"
    end
  end

  private

  def single_advance_or_final
    return if interim?
    return unless contract_id

    existing = self.class.where(contract_id: contract_id, term_type: term_type)
    existing = existing.where.not(id: id) if persisted?

    if existing.exists?
      label = advance? ? "착수금" : "잔금"
      errors.add(:term_type, "#{label}은(는) 1건만 등록할 수 있습니다")
    end
  end

  def consistent_interim_method
    return unless interim? && contract_id

    existing = self.class.where(contract_id: contract_id, term_type: "interim")
    existing = existing.where.not(id: id) if persisted?

    first_existing = existing.first
    return unless first_existing

    if first_existing.interim_method != interim_method
      errors.add(:interim_method, "동일 계약의 중도금은 모두 같은 지급 방식이어야 합니다")
    end
  end
end
