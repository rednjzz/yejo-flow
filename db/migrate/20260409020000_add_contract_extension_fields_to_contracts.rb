# frozen_string_literal: true

class AddContractExtensionFieldsToContracts < ActiveRecord::Migration[8.1]
  def up
    # 1) Add columns with null allowed first
    add_column :contracts, :supply_amount, :bigint
    add_column :contracts, :vat_amount, :bigint

    add_column :contracts, :defect_liability_months, :integer
    add_column :contracts, :defect_warranty_rate, :decimal, precision: 5, scale: 2
    add_column :contracts, :late_penalty_rate, :decimal, precision: 5, scale: 3
    add_column :contracts, :late_penalty_cap_rate, :decimal, precision: 5, scale: 2
    add_column :contracts, :period_note, :text
    add_column :contracts, :special_conditions, :text

    # 2) Backfill existing data (부가세 10% 기준 역산)
    Contract.reset_column_information
    execute <<-SQL.squish
      UPDATE contracts
      SET supply_amount = CAST(contract_amount / 1.1 AS INTEGER),
          vat_amount    = contract_amount - CAST(contract_amount / 1.1 AS INTEGER)
      WHERE supply_amount IS NULL
    SQL

    # 3) Add NOT NULL constraints
    change_column_null :contracts, :supply_amount, false, 0
    change_column_null :contracts, :vat_amount, false, 0
  end

  def down
    remove_column :contracts, :supply_amount
    remove_column :contracts, :vat_amount
    remove_column :contracts, :defect_liability_months
    remove_column :contracts, :defect_warranty_rate
    remove_column :contracts, :late_penalty_rate
    remove_column :contracts, :late_penalty_cap_rate
    remove_column :contracts, :period_note
    remove_column :contracts, :special_conditions
  end
end
