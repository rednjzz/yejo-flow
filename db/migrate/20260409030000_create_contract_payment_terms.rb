# frozen_string_literal: true

class CreateContractPaymentTerms < ActiveRecord::Migration[8.1]
  def change
    create_table :contract_payment_terms do |t|
      t.references :contract, null: false, foreign_key: true
      t.string :term_type, null: false
      t.integer :seq, null: false, default: 1
      t.string :interim_method
      t.decimal :rate, precision: 5, scale: 2
      t.bigint :amount
      t.string :condition
      t.date :due_date
      t.date :paid_date
      t.bigint :paid_amount
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    add_index :contract_payment_terms,
              [:contract_id, :term_type, :seq],
              unique: true,
              name: "idx_payment_terms_unique"
  end
end
