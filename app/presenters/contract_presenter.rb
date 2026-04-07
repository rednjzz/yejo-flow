# frozen_string_literal: true

class ContractPresenter < SimpleDelegator
  def as_props
    {
      id: id,
      contract_no: contract_no,
      contract_type: contract_type,
      type_label: type_label,
      change_seq: change_seq,
      contract_date: contract_date.iso8601,
      contract_amount: contract_amount,
      change_amount: change_amount,
      description: description,
      details_total: details_total,
      amount_mismatch: amount_mismatch?,
      contract_details: contract_details.includes(:work_type).order(:sort_order).map { |d|
        {
          id: d.id,
          work_type_id: d.work_type_id,
          work_type_name: d.work_type.work_type_name,
          item_name: d.item_name,
          unit: d.unit,
          quantity: d.quantity&.to_f,
          unit_price: d.unit_price,
          amount: d.amount,
          sort_order: d.sort_order
        }
      }
    }
  end
end
