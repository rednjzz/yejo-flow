# frozen_string_literal: true

require "rails_helper"

RSpec.describe Contract do
  subject { build(:contract) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:contract_no) }
    it { is_expected.to validate_presence_of(:contract_type) }
    it { is_expected.to validate_inclusion_of(:contract_type).in_array(Contract::TYPES) }
    it { is_expected.to validate_presence_of(:contract_date) }
    it { is_expected.to validate_presence_of(:contract_amount) }
    it { is_expected.to validate_numericality_of(:contract_amount).is_greater_than(0) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:project) }
    it { is_expected.to have_many(:contract_details).dependent(:destroy) }
  end

  describe "scopes" do
    let(:project) { create(:project) }
    let!(:original) { create(:contract, :original, project: project) }
    let!(:change1) { create(:contract, :change, project: project, change_seq: 1) }
    let!(:change2) { create(:contract, :change, project: project, change_seq: 2) }

    describe ".original" do
      it "returns only original contracts" do
        expect(described_class.original).to contain_exactly(original)
      end
    end

    describe ".changes" do
      it "returns change contracts ordered by change_seq" do
        result = described_class.changes
        expect(result).to eq([change1, change2])
      end
    end
  end

  describe "#details_total" do
    it "sums contract detail amounts" do
      contract = create(:contract)
      create(:contract_detail, contract: contract, quantity: nil, unit_price: nil, amount: 1_000_000)
      create(:contract_detail, contract: contract, quantity: nil, unit_price: nil, amount: 2_000_000)
      expect(contract.details_total).to eq(3_000_000)
    end
  end

  describe "#amount_mismatch?" do
    it "returns true when details total differs from contract amount" do
      contract = create(:contract, contract_amount: 5_000_000)
      create(:contract_detail, contract: contract, quantity: nil, unit_price: nil, amount: 3_000_000)
      expect(contract.amount_mismatch?).to be true
    end

    it "returns false when details total matches contract amount" do
      contract = create(:contract, contract_amount: 5_000_000)
      create(:contract_detail, contract: contract, quantity: nil, unit_price: nil, amount: 5_000_000)
      expect(contract.amount_mismatch?).to be false
    end

    it "returns false when no details exist" do
      contract = create(:contract)
      expect(contract.amount_mismatch?).to be false
    end
  end

  describe "#type_label" do
    it "returns '원도급' for original type" do
      expect(build(:contract, :original).type_label).to eq("원도급")
    end

    it "returns '변경(N차)' for change type" do
      expect(build(:contract, :change, change_seq: 2).type_label).to eq("변경(2차)")
    end
  end
end
