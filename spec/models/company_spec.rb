# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company do
  subject { build(:company) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:company_code) }
    it { is_expected.to validate_uniqueness_of(:company_code) }
    it { is_expected.to validate_presence_of(:company_name) }
    it { is_expected.to validate_presence_of(:company_type) }
    it { is_expected.to validate_inclusion_of(:company_type).in_array(Company::TYPES) }
  end

  describe "associations" do
    it { is_expected.to have_many(:projects).with_foreign_key(:client_id).dependent(:restrict_with_error) }
  end

  describe "scopes" do
    let!(:active_client) { create(:company, :client) }
    let!(:active_contractor) { create(:company, :contractor) }
    let!(:inactive_client) { create(:company, :client, :inactive) }

    describe ".active" do
      it "returns only active companies" do
        expect(described_class.active).to contain_exactly(active_client, active_contractor)
      end
    end

    describe ".clients" do
      it "returns only client companies" do
        expect(described_class.clients).to contain_exactly(active_client, inactive_client)
      end
    end

    describe ".contractors" do
      it "returns only contractor companies" do
        expect(described_class.contractors).to contain_exactly(active_contractor)
      end
    end
  end
end
