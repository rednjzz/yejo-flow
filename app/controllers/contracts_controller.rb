# frozen_string_literal: true

class ContractsController < InertiaController
  before_action :set_contract

  def show
    render inertia: {contract: ContractPresenter.new(@contract).as_props}
  end

  def edit
    render inertia: {
      contract: ContractPresenter.new(@contract).as_form_props,
      project: ProjectPresenter.new(@contract.project).as_detail_props
    }
  end

  def update
    if @contract.update(contract_params)
      redirect_to project_contracts_path(@contract.project), notice: "계약이 수정되었습니다"
    else
      redirect_to edit_contract_path(@contract), inertia: {errors: @contract.errors}
    end
  end

  def destroy
    project = @contract.project
    @contract.destroy!
    redirect_to project_contracts_path(project), notice: "계약이 삭제되었습니다"
  end

  private

  def set_contract
    @contract = Contract
      .includes(:contract_items, :contract_payment_terms, contract_files_attachments: :blob, project: {})
      .find(params[:id])
  end

  def contract_params
    params.require(:contract).permit(
      :contract_type, :change_seq,
      :contract_date, :supply_amount, :vat_amount,
      :description,
      :defect_liability_months, :defect_warranty_rate,
      :late_penalty_rate, :late_penalty_cap_rate,
      :period_note, :special_conditions,
      contract_files: [],
      contract_payment_terms_attributes: [
        :id, :term_type, :seq, :interim_method,
        :rate, :amount, :condition, :due_date,
        :paid_date, :paid_amount, :sort_order, :_destroy
      ]
    )
  end
end
