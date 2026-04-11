# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPresenter do
  let(:project) { create(:project) }
  let(:presenter) { described_class.new(project) }

  describe "#client_name" do
    it "returns client company name" do
      expect(presenter.client_name).to eq(project.client.company_name)
    end
  end

  describe "#amount_in_billion" do
    it "returns 0억 when no contracts exist" do
      expect(presenter.amount_in_billion).to eq("0억")
    end

    it "formats whole billions from contract" do
      create(:contract, project: project, supply_amount: 7_454_545_454, vat_amount: 745_454_546)
      expect(described_class.new(project.reload).amount_in_billion).to eq("82억")
    end

    it "formats fractional billions from contract" do
      create(:contract, project: project, supply_amount: 4_654_545_454, vat_amount: 465_454_546)
      expect(described_class.new(project.reload).amount_in_billion).to eq("51.2억")
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
