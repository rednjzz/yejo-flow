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
      supply_amount: supply_amount,
      vat_amount: vat_amount,
      change_amount: change_amount,
      description: description,
      defect_liability_months: defect_liability_months,
      defect_warranty_rate: defect_warranty_rate&.to_f,
      defect_warranty_amount: defect_warranty_amount,
      late_penalty_rate: late_penalty_rate&.to_f,
      late_penalty_cap_rate: late_penalty_cap_rate&.to_f,
      max_late_penalty: max_late_penalty,
      period_note: period_note,
      special_conditions: special_conditions,
      details_total: details_total,
      amount_mismatch: amount_mismatch?,
      contract_payment_terms: payment_term_props,
      contract_files: contract_file_props,
      contract_items: contract_item_props
    }
  end

  def as_form_props
    {
      id: id,
      contract_no: contract_no,
      contract_type: contract_type,
      change_seq: change_seq,
      contract_date: contract_date.iso8601,
      supply_amount: supply_amount,
      vat_amount: vat_amount,
      change_amount: change_amount,
      description: description,
      defect_liability_months: defect_liability_months,
      defect_warranty_rate: defect_warranty_rate&.to_f,
      late_penalty_rate: late_penalty_rate&.to_f,
      late_penalty_cap_rate: late_penalty_cap_rate&.to_f,
      period_note: period_note,
      special_conditions: special_conditions,
      contract_files: contract_file_props
    }
  end

  private

  def payment_term_props
    contract_payment_terms.ordered.map { |t|
      {
        id: t.id,
        term_type: t.term_type,
        display_label: t.display_label,
        seq: t.seq,
        interim_method: t.interim_method,
        rate: t.rate&.to_f,
        amount: t.amount,
        condition: t.condition,
        due_date: t.due_date&.iso8601,
        paid_date: t.paid_date&.iso8601,
        paid_amount: t.paid_amount,
        sort_order: t.sort_order
      }
    }
  end

  def contract_file_props
    contract_files.map { |file|
      {
        id: file.id,
        filename: file.filename.to_s,
        byte_size: file.byte_size,
        content_type: file.content_type,
        url: Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
      }
    }
  end

  def contract_item_props
    contract_items.includes(:work_type).order(:sort_order).map { |d|
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
  end
end
