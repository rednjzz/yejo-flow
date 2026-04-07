# frozen_string_literal: true

class ContractsController < InertiaController
  before_action :set_contract

  def show
    render inertia: {contract: ContractPresenter.new(@contract).as_props}
  end

  def update
    if @contract.update(contract_params)
      redirect_to project_contracts_path(@contract.project), notice: "계약이 수정되었습니다"
    else
      redirect_to project_contracts_path(@contract.project), inertia: {errors: @contract.errors}
    end
  end

  def destroy
    project = @contract.project
    @contract.destroy!
    redirect_to project_contracts_path(project), notice: "계약이 삭제되었습니다"
  end

  private

  def set_contract
    @contract = Contract.includes(:contract_details, :project).find(params[:id])
  end

  def contract_params
    params.expect(contract: [
      :contract_no, :contract_type, :change_seq,
      :contract_date, :contract_amount, :change_amount, :description
    ])
  end
end
