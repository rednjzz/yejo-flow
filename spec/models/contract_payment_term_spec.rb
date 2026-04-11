# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContractPaymentTerm do
  subject { build(:contract_payment_term) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:term_type) }
    it { is_expected.to validate_inclusion_of(:term_type).in_array(ContractPaymentTerm::TERM_TYPES) }
    it { is_expected.to validate_presence_of(:seq) }
    it { is_expected.to validate_presence_of(:sort_order) }

    context "when term_type is interim" do
      subject { build(:contract_payment_term, :interim_milestone) }

      it { is_expected.to validate_inclusion_of(:interim_method).in_array(ContractPaymentTerm::INTERIM_METHODS) }
    end

    context "when term_type is advance" do
      it "rejects interim_method" do
        term = build(:contract_payment_term, :advance, interim_method: "milestone")
        expect(term).not_to be_valid
        expect(term.errors[:interim_method]).to be_present
      end
    end

    context "advance/final 단일 제한" do
      let(:contract) { create(:contract) }

      it "advance는 1건만 허용" do
        create(:contract_payment_term, :advance, contract: contract)
        dup = build(:contract_payment_term, :advance, contract: contract)
        expect(dup).not_to be_valid
        expect(dup.errors[:term_type]).to include("착수금은(는) 1건만 등록할 수 있습니다")
      end

      it "final은 1건만 허용" do
        create(:contract_payment_term, :final, contract: contract)
        dup = build(:contract_payment_term, :final, contract: contract)
        expect(dup).not_to be_valid
        expect(dup.errors[:term_type]).to include("잔금은(는) 1건만 등록할 수 있습니다")
      end

      it "interim은 복수 건 허용" do
        create(:contract_payment_term, :interim_milestone, contract: contract, seq: 1, sort_order: 1)
        second = build(:contract_payment_term, :interim_milestone, contract: contract, seq: 2, sort_order: 2)
        expect(second).to be_valid
      end
    end

    context "중도금 지급 방식 일관성" do
      let(:contract) { create(:contract) }

      it "동일 계약 내 중도금은 같은 interim_method여야 함" do
        create(:contract_payment_term, :interim_milestone, contract: contract, seq: 1, sort_order: 1)
        mixed = build(:contract_payment_term, term_type: "interim", interim_method: "monthly_billing",
                       contract: contract, seq: 2, sort_order: 2)
        expect(mixed).not_to be_valid
        expect(mixed.errors[:interim_method]).to include("동일 계약의 중도금은 모두 같은 지급 방식이어야 합니다")
      end
    end

    context "uniqueness" do
      let(:contract) { create(:contract) }

      it "[contract_id, term_type, seq] 조합은 유니크" do
        create(:contract_payment_term, :interim_milestone, contract: contract, seq: 1, sort_order: 1)
        dup = build(:contract_payment_term, :interim_milestone, contract: contract, seq: 1, sort_order: 2)
        expect(dup).not_to be_valid
        expect(dup.errors[:seq]).to be_present
      end
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:contract) }
  end

  describe "#display_label" do
    it "착수금" do
      expect(build(:contract_payment_term, :advance).display_label).to eq("착수금")
    end

    it "중도금 N차 (milestone)" do
      term = build(:contract_payment_term, :interim_milestone, seq: 2)
      expect(term.display_label).to eq("중도금 2차")
    end

    it "중도금(월기성)" do
      expect(build(:contract_payment_term, :interim_monthly).display_label).to eq("중도금(월기성)")
    end

    it "잔금" do
      expect(build(:contract_payment_term, :final).display_label).to eq("잔금")
    end
  end

  describe "#monthly_billing?" do
    it "returns true for monthly_billing interim" do
      expect(build(:contract_payment_term, :interim_monthly).monthly_billing?).to be true
    end

    it "returns false for milestone interim" do
      expect(build(:contract_payment_term, :interim_milestone).monthly_billing?).to be false
    end

    it "returns false for advance" do
      expect(build(:contract_payment_term, :advance).monthly_billing?).to be false
    end
  end
end
