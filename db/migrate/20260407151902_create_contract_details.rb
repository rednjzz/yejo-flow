# frozen_string_literal: true

class CreateContractDetails < ActiveRecord::Migration[8.1]
  def change
    create_table :contract_details do |t|
      t.references :contract, null: false, foreign_key: true
      t.references :project, null: false, foreign_key: true
      t.references :work_type, null: false, foreign_key: true
      t.string :item_name, null: false
      t.string :unit
      t.decimal :quantity, precision: 12, scale: 3
      t.integer :unit_price
      t.integer :amount, null: false, default: 0
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    add_index :contract_details, [:contract_id, :sort_order]
  end
end
