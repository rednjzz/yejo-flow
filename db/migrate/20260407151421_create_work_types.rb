# frozen_string_literal: true

class CreateWorkTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :work_types do |t|
      t.string :work_type_code, null: false
      t.string :work_type_name, null: false
      t.references :parent, foreign_key: {to_table: :work_types}, null: true
      t.integer :level, null: false, default: 1
      t.integer :sort_order, null: false, default: 0
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :work_types, :work_type_code, unique: true
    add_index :work_types, [:is_active, :sort_order]
  end
end
