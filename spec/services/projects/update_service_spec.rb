# frozen_string_literal: true

require "rails_helper"

RSpec.describe Projects::UpdateService do
  let(:project) { create(:project, status: "preparing") }

  describe ".call" do
    context "with valid params" do
      it "updates the project" do
        result = described_class.call(project, {project_name: "새 현장명"})
        expect(result).to be_success
        expect(result.record.project_name).to eq("새 현장명")
      end
    end

    context "with valid status transition" do
      it "transitions status" do
        result = described_class.call(project, {status: "in_progress"})
        expect(result).to be_success
        expect(result.record.status).to eq("in_progress")
      end
    end

    context "when transitioning to completed" do
      let(:project) { create(:project, status: "in_progress") }

      it "sets actual_end_date" do
        result = described_class.call(project, {status: "completed"})
        expect(result).to be_success
        expect(result.record.actual_end_date).to eq(Date.current)
      end
    end

    context "with invalid status transition" do
      it "raises error for skipping states" do
        expect {
          described_class.call(project, {status: "completed"})
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context "with invalid params" do
      it "returns failure with errors" do
        result = described_class.call(project, {project_name: ""})
        expect(result).not_to be_success
        expect(result.errors[:project_name]).to be_present
      end
    end
  end
end
