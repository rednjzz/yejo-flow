# frozen_string_literal: true

class ChangeAmountColumnsToBigint < ActiveRecord::Migration[8.1]
  def change
    change_column :contracts, :contract_amount, :bigint, null: false
    change_column :contracts, :change_amount, :bigint

    change_column :contract_details, :amount, :bigint, default: 0, null: false
    change_column :contract_details, :unit_price, :bigint

    change_column :projects, :contract_amount, :bigint, null: false
    change_column :projects, :vat_amount, :bigint
    change_column :projects, :advance_amount, :bigint
  end
end
