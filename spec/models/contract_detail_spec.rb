# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContractDetail do
  subject { build(:contract_detail) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:item_name) }

    it "validates amount is not negative" do
      detail = build(:contract_detail, quantity: nil, unit_price: nil, amount: -1)
      expect(detail).not_to be_valid
      expect(detail.errors[:amount]).to be_present
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:contract) }
    it { is_expected.to belong_to(:project) }
    it { is_expected.to belong_to(:work_type) }
  end

  describe "#calculate_amount" do
    it "auto-calculates amount from quantity and unit_price" do
      detail = build(:contract_detail, quantity: 150.5, unit_price: 10_000, amount: nil)
      detail.valid?
      expect(detail.amount).to eq(1_505_000)
    end

    it "truncates decimal in amount calculation" do
      detail = build(:contract_detail, quantity: 3.333, unit_price: 10_000, amount: nil)
      detail.valid?
      expect(detail.amount).to eq(33_330)
    end

    it "does not calculate when quantity is nil" do
      detail = build(:contract_detail, quantity: nil, unit_price: 10_000, amount: 5_000_000)
      detail.valid?
      expect(detail.amount).to eq(5_000_000)
    end
  end
end
