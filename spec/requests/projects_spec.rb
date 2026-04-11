# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects" do
  let(:user) { create(:user) }

  before { sign_in_as(user) }

  describe "GET /projects" do
    let!(:project) { create(:project, :in_progress) }

    it "returns success" do
      get projects_path
      expect(response).to have_http_status(:ok)
    end

    it "filters by status" do
      create(:project, status: "preparing")
      get projects_path, params: {status: "in_progress"}
      expect(response).to have_http_status(:ok)
    end

    it "searches by name" do
      get projects_path, params: {q: project.project_name}
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /projects" do
    let(:client) { create(:company, :client) }

    context "with valid params" do
      it "creates a project and redirects to show" do
        expect {
          post projects_path, params: {project: {
            project_name: "새 현장",
            client_id: client.id,
            start_date: Date.current,
            end_date: 1.year.from_now.to_date
          }}
        }.to change(Project, :count).by(1)

        expect(response).to have_http_status(:redirect)
      end
    end

    context "with invalid params" do
      it "redirects back with errors" do
        post projects_path, params: {project: {project_name: ""}}
        expect(response).to have_http_status(:redirect)
      end
    end
  end

  describe "GET /projects/:id" do
    let(:project) { create(:project) }

    it "returns success" do
      get project_path(project)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "PATCH /projects/:id" do
    let(:project) { create(:project) }

    context "with valid params" do
      it "updates and redirects to show" do
        patch project_path(project), params: {project: {project_name: "수정된 현장명"}}
        expect(response).to have_http_status(:redirect)
        expect(project.reload.project_name).to eq("수정된 현장명")
      end
    end

    context "with invalid status transition" do
      it "redirects back with errors" do
        patch project_path(project), params: {project: {status: "completed"}}
        expect(response).to have_http_status(:redirect)
      end
    end
  end
end
