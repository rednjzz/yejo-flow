# frozen_string_literal: true

class ContractDetailsController < InertiaController
  before_action :set_detail

  def update
    if @detail.update(detail_params)
      redirect_to project_contracts_path(@detail.project), notice: "내역이 수정되었습니다"
    else
      redirect_to project_contracts_path(@detail.project), inertia: {errors: @detail.errors}
    end
  end

  def destroy
    project = @detail.project
    @detail.destroy!
    redirect_to project_contracts_path(project), notice: "내역이 삭제되었습니다"
  end

  private

  def set_detail
    @detail = ContractDetail.find(params[:id])
  end

  def detail_params
    params.expect(contract_detail: [
      :work_type_id, :item_name, :unit, :quantity, :unit_price, :amount, :sort_order
    ])
  end
end
