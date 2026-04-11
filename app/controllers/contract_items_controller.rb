# frozen_string_literal: true

class ContractItemsController < InertiaController
  before_action :set_item

  def update
    if @item.update(item_params)
      redirect_to project_contracts_path(@item.project), notice: "내역이 수정되었습니다"
    else
      redirect_to project_contracts_path(@item.project), inertia: {errors: @item.errors}
    end
  end

  def destroy
    project = @item.project
    @item.destroy!
    redirect_to project_contracts_path(project), notice: "내역이 삭제되었습니다"
  end

  private

  def set_item
    @item = ContractItem.find(params[:id])
  end

  def item_params
    params.expect(contract_item: [
      :work_type_id, :item_name, :unit, :quantity, :unit_price, :amount, :sort_order
    ])
  end
end
