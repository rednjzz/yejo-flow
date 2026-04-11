# frozen_string_literal: true

require "rails_helper"

RSpec.describe Contract do
  subject { build(:contract) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:contract_no) }
    it { is_expected.to validate_presence_of(:contract_type) }
    it { is_expected.to validate_inclusion_of(:contract_type).in_array(Contract::TYPES) }
    it { is_expected.to validate_presence_of(:contract_date) }
    it { is_expected.to validate_presence_of(:supply_amount) }
    it { is_expected.to validate_numericality_of(:supply_amount).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_presence_of(:vat_amount) }
    it { is_expected.to validate_numericality_of(:vat_amount).is_greater_than_or_equal_to(0) }

    context "when contract_type is change" do
      subject { build(:contract, :change) }

      it { is_expected.to validate_presence_of(:change_amount) }
    end

    context "when contract_type is original" do
      it "does not require change_amount" do
        contract = build(:contract, :original, change_amount: nil)
        expect(contract).to be_valid
      end
    end

    context "when supply_amount and vat_amount are both 0" do
      it "is invalid because contract_amount must be positive" do
        contract = build(:contract, supply_amount: 0, vat_amount: 0)
        expect(contract).not_to be_valid
        expect(contract.errors[:contract_amount]).to be_present
      end
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:project) }
    it { is_expected.to have_many(:contract_items).dependent(:destroy) }
    it { is_expected.to have_many(:contract_payment_terms).dependent(:destroy) }
  end

  describe "callbacks" do
    describe "#calculate_contract_amount" do
      it "auto-calculates contract_amount from supply_amount + vat_amount" do
        contract = build(:contract, supply_amount: 100_000_000, vat_amount: 10_000_000)
        contract.valid?
        expect(contract.contract_amount).to eq(110_000_000)
      end
    end
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
      create(:contract_item, contract: contract, quantity: nil, unit_price: nil, amount: 1_000_000)
      create(:contract_item, contract: contract, quantity: nil, unit_price: nil, amount: 2_000_000)
      expect(contract.details_total).to eq(3_000_000)
    end
  end

  describe "#amount_mismatch?" do
    it "returns true when details total differs from contract amount" do
      contract = create(:contract, supply_amount: 4_545_455, vat_amount: 454_545)
      create(:contract_item, contract: contract, quantity: nil, unit_price: nil, amount: 3_000_000)
      expect(contract.amount_mismatch?).to be true
    end

    it "returns false when details total matches contract amount" do
      contract = create(:contract, supply_amount: 4_545_455, vat_amount: 454_545)
      create(:contract_item, contract: contract, quantity: nil, unit_price: nil, amount: 5_000_000)
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

  describe "#defect_warranty_amount" do
    it "calculates defect warranty amount" do
      contract = build(:contract, supply_amount: 116_000_000, vat_amount: 11_600_000,
                        defect_warranty_rate: 3.0)
      contract.valid?
      expect(contract.defect_warranty_amount).to eq(3_828_000)
    end

    it "returns nil when rate is not set" do
      contract = build(:contract)
      expect(contract.defect_warranty_amount).to be_nil
    end
  end

  describe "#max_late_penalty" do
    it "calculates max late penalty" do
      contract = build(:contract, supply_amount: 116_000_000, vat_amount: 11_600_000,
                        late_penalty_cap_rate: 3.0)
      contract.valid?
      expect(contract.max_late_penalty).to eq(3_828_000)
    end

    it "returns nil when cap rate is not set" do
      contract = build(:contract)
      expect(contract.max_late_penalty).to be_nil
    end
  end

  describe "#original_contract" do
    let(:project) { create(:project) }
    let!(:original) { create(:contract, :original, project: project) }
    let!(:change1) { create(:contract, :change, project: project, change_seq: 1) }

    it "returns the original contract for a change contract" do
      expect(change1.original_contract).to eq(original)
    end

    it "returns self for an original contract" do
      expect(original.original_contract).to eq(original)
    end
  end

  describe "#previous_contract" do
    let(:project) { create(:project) }
    let!(:original) { create(:contract, :original, project: project) }
    let!(:change1) { create(:contract, :change, project: project, change_seq: 1) }
    let!(:change2) { create(:contract, :change, project: project, change_seq: 2) }

    it "returns nil for an original contract" do
      expect(original.previous_contract).to be_nil
    end

    it "returns original contract for first change" do
      expect(change1.previous_contract).to eq(original)
    end

    it "returns previous change for subsequent changes" do
      expect(change2.previous_contract).to eq(change1)
    end
  end
end
