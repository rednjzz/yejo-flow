# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password

  generates_token_for :email_verification, expires_in: 2.days do
    email
  end

  generates_token_for :password_reset, expires_in: 20.minutes do
    password_salt.last(10)
  end


  ROLES = %w[admin hq_manager hq_staff site_manager site_staff].freeze

  has_many :sessions, dependent: :destroy
  has_many :managed_projects, class_name: "Project", foreign_key: :manager_id, dependent: :nullify, inverse_of: :manager

  validates :name, presence: true
  validates :role, presence: true, inclusion: {in: ROLES}
  validates :email, presence: true, uniqueness: true, format: {with: URI::MailTo::EMAIL_REGEXP}
  validates :password, allow_nil: true, length: {minimum: 12}

  normalizes :email, with: -> { _1.strip.downcase }

  before_validation if: :email_changed?, on: :update do
    self.verified = false
  end

  after_update if: :password_digest_previously_changed? do
    sessions.where.not(id: Current.session).delete_all
  end

  scope :managers, -> { where(role: %w[admin hq_manager site_manager]) }

  def admin? = role == "admin"
  def manager? = role.in?(%w[hq_manager site_manager])
end
