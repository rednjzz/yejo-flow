# frozen_string_literal: true

class RenameContractNoToContractCode < ActiveRecord::Migration[8.1]
  def change
    rename_column :contracts, :contract_no, :contract_code
  end
end
