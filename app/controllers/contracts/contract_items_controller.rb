# frozen_string_literal: true

module Contracts
  class ContractItemsController < InertiaController
    before_action :set_contract

    def create
      item = @contract.contract_items.new(item_params)
      item.project = @contract.project

      if item.save
        redirect_to project_contracts_path(@contract.project), notice: "내역이 추가되었습니다"
      else
        redirect_to project_contracts_path(@contract.project), inertia: {errors: item.errors}
      end
    end

    private

    def set_contract
      @contract = Contract.find(params[:contract_id])
    end

    def item_params
      params.expect(contract_item: [
        :work_type_id, :item_name, :unit, :quantity, :unit_price, :amount, :sort_order
      ])
    end
  end
end
