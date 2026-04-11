# frozen_string_literal: true

class RenameContractDetailsToContractItems < ActiveRecord::Migration[8.1]
  def change
    rename_table :contract_details, :contract_items
  end
end
