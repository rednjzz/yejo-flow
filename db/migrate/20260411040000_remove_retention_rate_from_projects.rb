# frozen_string_literal: true

class RemoveRetentionRateFromProjects < ActiveRecord::Migration[8.1]
  def change
    remove_column :projects, :retention_rate, :decimal, precision: 5, scale: 2
  end
end
