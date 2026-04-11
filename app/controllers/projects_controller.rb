# frozen_string_literal: true

class ProjectsController < InertiaController
  before_action :set_project, only: [:show, :update]

  def index
    projects = Project.includes(:client, :contracts)
    projects = projects.where(status: params[:status]) if params[:status].present?
    projects = projects.where("project_name LIKE ?", "%#{params[:q]}%") if params[:q].present?
    projects = projects.order(created_at: :desc)

    render inertia: {
      projects: projects.map { |p| ProjectPresenter.new(p).as_list_props },
      new_project_code: Project.generate_project_code,
      clients: Company.clients.active.select(:id, :company_name).map { |c| {id: c.id, company_name: c.company_name} },
      managers: User.managers.select(:id, :name).map { |u| {id: u.id, name: u.name} }
    }
  end

  def show
    presenter = ProjectPresenter.new(@project)
    render inertia: {
      project: presenter.as_detail_props,
      form_data: presenter.as_form_props,
      clients: Company.clients.active.select(:id, :company_name).map { |c| {id: c.id, company_name: c.company_name} },
      managers: User.managers.select(:id, :name).map { |u| {id: u.id, name: u.name} },
      statuses: Project::STATUSES.map { |s| {value: s, label: Project::STATUS_LABELS[s]} }
    }
  end

  # create는 index 페이지의 Sheet에서 폼 제출
  def create
    result = Projects::CreateService.call(project_params)

    if result.success?
      redirect_to project_path(result.record), notice: "현장이 등록되었습니다"
    else
      redirect_to projects_path, inertia: {errors: result.errors}
    end
  end

  def update
    result = Projects::UpdateService.call(@project, project_params)

    if result.success?
      redirect_to project_path(@project), notice: "현장 정보가 수정되었습니다"
    else
      redirect_to project_path(@project), inertia: {errors: result.errors}
    end
  rescue ActiveRecord::RecordInvalid
    redirect_to project_path(@project), inertia: {errors: @project.errors}
  end

  private

  def set_project
    @project = Project.includes(:client, :manager).find(params[:id])
  end

  def project_params
    params.expect(project: [
      :project_name, :client_id, :site_address,
      :start_date, :end_date, :status, :manager_id,
      :notes
    ])
  end
end
