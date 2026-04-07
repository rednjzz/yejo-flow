# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPresenter do
  let(:project) { create(:project, contract_amount: 8_200_000_000) }
  let(:presenter) { described_class.new(project) }

  describe "#client_name" do
    it "returns client company name" do
      expect(presenter.client_name).to eq(project.client.company_name)
    end
  end

  describe "#amount_in_billion" do
    it "formats whole billions" do
      project = build(:project, contract_amount: 8_200_000_000)
      expect(described_class.new(project).amount_in_billion).to eq("82억")
    end

    it "formats fractional billions" do
      project = build(:project, contract_amount: 5_120_000_000)
      expect(described_class.new(project).amount_in_billion).to eq("51.2억")
    end

    it "handles small amounts" do
      project = build(:project, contract_amount: 1)
      expect(described_class.new(project).amount_in_billion).to eq("0.0억")
    end
  end

  describe "#formatted_period" do
    it "returns formatted date range" do
      project = build(:project, start_date: Date.new(2024, 3, 1), end_date: Date.new(2025, 4, 30))
      expect(described_class.new(project).formatted_period).to eq("2024.03.01 ~ 2025.04.30")
    end
  end

  describe "#as_list_props" do
    it "returns hash with all list fields" do
      props = presenter.as_list_props
      expect(props).to include(
        :id, :project_code, :project_name, :client_name,
        :contract_amount, :amount_in_billion, :status, :status_label
      )
    end
  end

  describe "#as_form_props" do
    it "includes allowed_transitions" do
      props = presenter.as_form_props
      expect(props[:allowed_transitions]).to eq(["in_progress"])
    end
  end
end
