# frozen_string_literal: true

class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.string :project_code, null: false
      t.string :project_name, null: false
      t.references :client, null: false, foreign_key: {to_table: :companies}
      t.string :site_address
      t.integer :contract_amount, null: false
      t.integer :vat_amount
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.date :actual_end_date
      t.string :status, null: false, default: "preparing"
      t.references :manager, foreign_key: {to_table: :users}, null: true
      t.decimal :advance_rate, precision: 5, scale: 2
      t.integer :advance_amount
      t.decimal :retention_rate, precision: 5, scale: 2
      t.text :notes

      t.timestamps
    end

    add_index :projects, :project_code, unique: true
    add_index :projects, :status
  end
end
