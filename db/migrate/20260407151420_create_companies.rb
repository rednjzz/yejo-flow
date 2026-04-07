# frozen_string_literal: true

class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.string :company_code, null: false
      t.string :company_name, null: false
      t.string :company_type, null: false
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :companies, :company_code, unique: true
    add_index :companies, [:company_type, :is_active]
  end
end
