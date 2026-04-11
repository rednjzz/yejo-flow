# frozen_string_literal: true

class Contract < ApplicationRecord
  TYPES = %w[original change].freeze

  ALLOWED_CONTRACT_FILE_TYPES = %w[application/pdf image/jpeg image/png].freeze
  MAX_CONTRACT_FILE_SIZE = 20.megabytes

  belongs_to :project
  has_many :contract_items, dependent: :destroy
  has_many :contract_payment_terms, dependent: :destroy
  has_many_attached :contract_files

  validates :contract_no, presence: true
  validates :contract_type, presence: true, inclusion: {in: TYPES}
  validates :contract_date, presence: true
  validates :supply_amount, presence: true, numericality: {greater_than_or_equal_to: 0}
  validates :vat_amount, presence: true, numericality: {greater_than_or_equal_to: 0}
  validate :contract_amount_must_be_positive
  validates :change_amount, presence: true, if: -> { contract_type == "change" }

  before_validation :calculate_contract_amount

  validate :validate_contract_file_content_type_and_size

  scope :original, -> { where(contract_type: "original") }
  scope :changes, -> { where(contract_type: "change").order(:change_seq) }

  def details_total
    contract_items.sum(:amount)
  end

  def amount_mismatch?
    contract_items.any? && details_total != contract_amount
  end

  def type_label
    contract_type == "original" ? "원도급" : "변경(#{change_seq}차)"
  end

  def defect_warranty_amount
    return nil unless defect_warranty_rate

    (contract_amount * defect_warranty_rate / 100).to_i
  end

  def max_late_penalty
    return nil unless late_penalty_cap_rate

    (contract_amount * late_penalty_cap_rate / 100).to_i
  end

  def original_contract
    return self if contract_type == "original"

    project.contracts.find_by(contract_type: "original")
  end

  def previous_contract
    return nil if contract_type == "original"

    prev_seq = (change_seq || 1) - 1
    if prev_seq <= 0
      original_contract
    else
      project.contracts.find_by(contract_type: "change", change_seq: prev_seq)
    end
  end

  private

  def contract_amount_must_be_positive
    return unless supply_amount.present? && vat_amount.present?

    errors.add(:contract_amount, "은(는) 0보다 커야 합니다") if contract_amount.to_i <= 0
  end

  def calculate_contract_amount
    return unless supply_amount.present? && vat_amount.present?

    self.contract_amount = supply_amount + vat_amount
  end

  def validate_contract_file_content_type_and_size
    contract_files.each do |file|
      unless ALLOWED_CONTRACT_FILE_TYPES.include?(file.content_type)
        errors.add(:contract_files, "는 PDF, JPG, PNG 형식만 허용됩니다")
      end

      if file.blob.byte_size > MAX_CONTRACT_FILE_SIZE
        errors.add(:contract_files, "의 개별 파일 크기는 20MB를 초과할 수 없습니다")
      end
    end
  end
end
