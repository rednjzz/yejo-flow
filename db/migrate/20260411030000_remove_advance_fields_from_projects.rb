# frozen_string_literal: true

class RemoveAdvanceFieldsFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :advance_amount, :bigint
    remove_column :projects, :advance_rate, :decimal, precision: 5, scale: 2
  end
end
