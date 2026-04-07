# frozen_string_literal: true

class WorkType < ApplicationRecord
  belongs_to :parent, class_name: "WorkType", optional: true
  has_many :children, class_name: "WorkType", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :contract_details, dependent: :restrict_with_error

  validates :work_type_code, presence: true, uniqueness: true
  validates :work_type_name, presence: true

  scope :active, -> { where(is_active: true) }
  scope :roots, -> { where(parent_id: nil) }
  scope :ordered, -> { order(:sort_order, :work_type_name) }
end
