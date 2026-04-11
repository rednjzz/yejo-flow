# frozen_string_literal: true

class ProjectPresenter < SimpleDelegator
  STATUS_BADGE_VARIANTS = {
    "preparing" => "outline",
    "in_progress" => "default",
    "completed" => "secondary",
    "defect_period" => "destructive",
    "closed" => "outline"
  }.freeze

  def client_name
    client.company_name
  end

  def manager_name
    manager&.name
  end

  def amount_in_billion
    amount = current_contract_amount || 0
    return "0억" if amount.zero?

    billion = amount / 100_000_000.0
    if billion == billion.to_i
      "#{billion.to_i}억"
    else
      "#{billion.round(1)}억"
    end
  end

  def formatted_period
    "#{start_date.strftime("%Y.%m.%d")} ~ #{end_date.strftime("%Y.%m.%d")}"
  end

  def status_badge_variant
    STATUS_BADGE_VARIANTS[status]
  end

  def as_list_props
    {
      id: id,
      project_code: project_code,
      project_name: project_name,
      client_name: client_name,
      contract_amount: current_contract_amount || 0,
      amount_in_billion: amount_in_billion,
      start_date: start_date.iso8601,
      end_date: end_date.iso8601,
      formatted_period: formatted_period,
      status: status,
      status_label: status_label,
      status_badge_variant: status_badge_variant,
      billing_rate: 0,
      profit_rate: nil
    }
  end

  def as_detail_props
    as_list_props.merge(
      site_address: site_address,
      actual_end_date: actual_end_date&.iso8601,
      manager_id: manager_id,
      manager_name: manager_name,
      notes: notes
    )
  end

  def as_form_props
    {
      id: id,
      project_code: project_code,
      project_name: project_name,
      client_id: client_id,
      site_address: site_address,
      start_date: start_date.iso8601,
      end_date: end_date.iso8601,
      status: status,
      manager_id: manager_id,
      notes: notes,
      allowed_transitions: Project::STATUS_FLOW[status] || []
    }
  end
end
