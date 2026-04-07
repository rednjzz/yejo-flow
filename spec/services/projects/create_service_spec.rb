# frozen_string_literal: true

require "rails_helper"

RSpec.describe Projects::CreateService do
  let(:client) { create(:company, :client) }
  let(:valid_params) do
    {
      project_name: "테스트 현장",
      client_id: client.id,
      contract_amount: 1_000_000_000,
      start_date: Date.current,
      end_date: 1.year.from_now.to_date
    }
  end

  describe ".call" do
    context "with valid params" do
      it "creates a project and returns success" do
        result = described_class.call(valid_params)
        expect(result).to be_success
        expect(result.record).to be_persisted
        expect(result.record.project_code).to match(/\A\d{4}-\d{3}\z/)
        expect(result.record.vat_amount).to eq(100_000_000)
      end
    end

    context "with invalid params" do
      it "returns failure with errors" do
        result = described_class.call(valid_params.merge(project_name: ""))
        expect(result).not_to be_success
        expect(result.errors[:project_name]).to be_present
      end
    end
  end
end
