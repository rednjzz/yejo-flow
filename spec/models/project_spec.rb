# frozen_string_literal: true

require "rails_helper"

RSpec.describe Project do
  subject { build(:project) }

  describe "validations" do
    it "validates uniqueness of project_code" do
      create(:project, project_code: "2026-TEST")
      project = build(:project, project_code: "2026-TEST")
      expect(project).not_to be_valid
      expect(project.errors[:project_code]).to include("has already been taken")
    end
    it { is_expected.to validate_presence_of(:project_name) }
    it { is_expected.to validate_length_of(:project_name).is_at_most(200) }
    it { is_expected.to validate_presence_of(:contract_amount) }
    it { is_expected.to validate_numericality_of(:contract_amount).is_greater_than(0) }
    it { is_expected.to validate_presence_of(:start_date) }
    it { is_expected.to validate_presence_of(:end_date) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(Project::STATUSES) }

    context "when end_date is before start_date" do
      subject { build(:project, start_date: Date.current, end_date: Date.current - 1.day) }

      it "is invalid" do
        expect(subject).not_to be_valid
        expect(subject.errors[:end_date]).to include("은 착공일 이후여야 합니다")
      end
    end

    context "when end_date equals start_date" do
      subject { build(:project, start_date: Date.current, end_date: Date.current) }

      it "is invalid" do
        expect(subject).not_to be_valid
      end
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:client).class_name("Company") }
    it { is_expected.to belong_to(:manager).class_name("User").optional }
    it { is_expected.to have_many(:contracts).dependent(:destroy) }
    it { is_expected.to have_many(:contract_details).dependent(:destroy) }
  end

  describe "callbacks" do
    describe "#set_project_code" do
      it "auto-generates project code on create" do
        project = build(:project, project_code: nil)
        project.valid?
        expect(project.project_code).to match(/\A\d{4}-\d{3}\z/)
      end

      it "does not overwrite existing project code" do
        project = build(:project, project_code: "CUSTOM-001")
        project.valid?
        expect(project.project_code).to eq("CUSTOM-001")
      end
    end

    describe "#calculate_vat" do
      it "calculates VAT as 10% of contract amount" do
        project = build(:project, contract_amount: 1_000_000_000)
        project.valid?
        expect(project.vat_amount).to eq(100_000_000)
      end
    end
  end

  describe ".generate_project_code" do
    it "generates YYYY-NNN format code" do
      code = described_class.generate_project_code
      expect(code).to eq("#{Date.current.year}-001")
    end

    it "increments sequence number" do
      create(:project, project_code: "#{Date.current.year}-003")
      code = described_class.generate_project_code
      expect(code).to eq("#{Date.current.year}-004")
    end
  end

  describe "#status_label" do
    it "returns Korean label for status" do
      project = build(:project, status: "in_progress")
      expect(project.status_label).to eq("진행중")
    end
  end

  describe "#can_transition_to?" do
    it "allows valid transitions" do
      project = build(:project, status: "preparing")
      expect(project.can_transition_to?("in_progress")).to be true
    end

    it "rejects invalid transitions" do
      project = build(:project, status: "preparing")
      expect(project.can_transition_to?("completed")).to be false
    end

    it "rejects reverse transitions" do
      project = build(:project, status: "in_progress")
      expect(project.can_transition_to?("preparing")).to be false
    end
  end

  describe "scopes" do
    let!(:active_project) { create(:project, :in_progress) }
    let!(:closed_project) { create(:project, status: "closed") }

    describe ".active" do
      it "excludes closed projects" do
        expect(described_class.active).to contain_exactly(active_project)
      end
    end
  end

  describe "#latest_contract" do
    let(:project) { create(:project) }

    it "returns the contract with highest change_seq" do
      create(:contract, :original, project: project, change_seq: nil)
      change1 = create(:contract, :change, project: project, change_seq: 1)
      create(:contract, :change, project: project, change_seq: 2)

      # change_seq DESC → 2, 1, nil. First = change_seq 2
      expect(project.latest_contract.change_seq).to eq(2)
    end

    it "returns original when no changes exist" do
      original = create(:contract, :original, project: project)
      expect(project.latest_contract).to eq(original)
    end
  end

  describe "#current_contract_amount" do
    let(:project) { create(:project) }

    it "returns the latest contract amount" do
      create(:contract, :original, project: project, supply_amount: 90_909_091, vat_amount: 9_090_909)
      create(:contract, :change, project: project, change_seq: 1,
              supply_amount: 109_090_909, vat_amount: 10_909_091)
      expect(project.current_contract_amount).to eq(120_000_000)
    end
  end

  describe "#effective_defect_liability_months" do
    let(:project) { create(:project) }

    it "returns value from latest contract that has it" do
      create(:contract, :original, project: project, defect_liability_months: 24)
      create(:contract, :change, project: project, change_seq: 1, defect_liability_months: nil)
      expect(project.effective_defect_liability_months).to eq(24)
    end

    it "returns latest value if set on change contract" do
      create(:contract, :original, project: project, defect_liability_months: 24)
      create(:contract, :change, project: project, change_seq: 1, defect_liability_months: 36)
      expect(project.effective_defect_liability_months).to eq(36)
    end
  end

  describe "#effective_contract_payment_terms" do
    let(:project) { create(:project) }

    it "returns payment terms from latest contract" do
      original = create(:contract, :original, project: project)
      create(:contract_payment_term, :advance, contract: original)

      change1 = create(:contract, :change, project: project, change_seq: 1)
      term = create(:contract_payment_term, :advance, contract: change1, rate: 40.0)

      expect(project.effective_contract_payment_terms).to contain_exactly(term)
    end
  end
end
