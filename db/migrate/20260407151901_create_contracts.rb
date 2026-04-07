# frozen_string_literal: true

class CreateContracts < ActiveRecord::Migration[8.1]
  def change
    create_table :contracts do |t|
      t.references :project, null: false, foreign_key: true
      t.string :contract_no, null: false
      t.string :contract_type, null: false
      t.integer :change_seq
      t.date :contract_date, null: false
      t.integer :contract_amount, null: false
      t.integer :change_amount
      t.text :description

      t.timestamps
    end

    add_index :contracts, [:project_id, :contract_type]
  end
end
