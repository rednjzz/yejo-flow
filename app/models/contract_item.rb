# frozen_string_literal: true

class ContractItem < ApplicationRecord
  belongs_to :contract
  belongs_to :project
  belongs_to :work_type

  validates :item_name, presence: true
  validates :amount, presence: true, numericality: {greater_than_or_equal_to: 0}

  before_validation :calculate_amount

  private

  def calculate_amount
    if quantity.present? && unit_price.present?
      self.amount = (quantity * unit_price).to_i
    end
  end
end
