# frozen_string_literal: true

require "rails_helper"

RSpec.describe WorkType do
  subject { build(:work_type) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:work_type_code) }
    it { is_expected.to validate_uniqueness_of(:work_type_code) }
    it { is_expected.to validate_presence_of(:work_type_name) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:parent).class_name("WorkType").optional }
    it { is_expected.to have_many(:children).class_name("WorkType").with_foreign_key(:parent_id).dependent(:destroy) }
    it { is_expected.to have_many(:contract_details).dependent(:restrict_with_error) }
  end

  describe "scopes" do
    let!(:root_type) { create(:work_type, sort_order: 2) }
    let!(:child_type) { create(:work_type, :with_parent, sort_order: 1) }
    let!(:inactive_type) { create(:work_type, :inactive) }

    describe ".active" do
      it "returns only active work types" do
        expect(described_class.active).to contain_exactly(root_type, child_type, child_type.parent)
      end
    end

    describe ".roots" do
      it "returns only root-level work types" do
        expect(described_class.roots).to contain_exactly(root_type, child_type.parent, inactive_type)
      end
    end

    describe ".ordered" do
      it "returns work types ordered by sort_order then name" do
        result = described_class.ordered
        expect(result.first.sort_order).to be <= result.last.sort_order
      end
    end
  end
end
