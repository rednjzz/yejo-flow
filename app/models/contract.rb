# frozen_string_literal: true

class Contract < ApplicationRecord
  TYPES = %w[original change].freeze

  belongs_to :project
  has_many :contract_details, dependent: :destroy

  validates :contract_no, presence: true
  validates :contract_type, presence: true, inclusion: {in: TYPES}
  validates :contract_date, presence: true
  validates :contract_amount, presence: true, numericality: {greater_than: 0}

  scope :original, -> { where(contract_type: "original") }
  scope :changes, -> { where(contract_type: "change").order(:change_seq) }

  def details_total
    contract_details.sum(:amount)
  end

  def amount_mismatch?
    contract_details.any? && details_total != contract_amount
  end

  def type_label
    contract_type == "original" ? "원도급" : "변경(#{change_seq}차)"
  end
end
