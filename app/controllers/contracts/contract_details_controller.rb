# frozen_string_literal: true

module Contracts
  class ContractDetailsController < InertiaController
    before_action :set_contract

    def create
      detail = @contract.contract_details.new(detail_params)
      detail.project = @contract.project

      if detail.save
        redirect_to project_contracts_path(@contract.project), notice: "내역이 추가되었습니다"
      else
        redirect_to project_contracts_path(@contract.project), inertia: {errors: detail.errors}
      end
    end

    private

    def set_contract
      @contract = Contract.find(params[:contract_id])
    end

    def detail_params
      params.expect(contract_detail: [
        :work_type_id, :item_name, :unit, :quantity, :unit_price, :amount, :sort_order
      ])
    end
  end
end
