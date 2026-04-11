# frozen_string_literal: true

module Projects
  class ContractsController < InertiaController
    before_action :set_project

    def index
      contracts = @project.contracts.includes(:contract_items).order(:contract_type, :change_seq)
      work_types = WorkType.active.ordered.select(:id, :work_type_name)

      render inertia: {
        project: ProjectPresenter.new(@project).as_detail_props,
        contracts: contracts.map { |c| ContractPresenter.new(c).as_props },
        work_types: work_types.map { |wt| {id: wt.id, work_type_name: wt.work_type_name} }
      }
    end

    def create
      contract = @project.contracts.new(contract_params)

      if contract.save
        redirect_to project_contracts_path(@project), notice: "계약이 등록되었습니다"
      else
        redirect_to project_contracts_path(@project), inertia: {errors: contract.errors}
      end
    end

    private

    def set_project
      @project = Project.includes(:client, :manager).find(params[:project_id])
    end

    def contract_params
      params.expect(contract: [
        :contract_no, :contract_type, :change_seq,
        :contract_date, :contract_amount, :change_amount, :description
      ])
    end
  end
end
