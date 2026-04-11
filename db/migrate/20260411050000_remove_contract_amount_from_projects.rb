# frozen_string_literal: true

class RemoveContractAmountFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :contract_amount, :bigint, null: false
    remove_column :projects, :vat_amount, :bigint
  end
end
