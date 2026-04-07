# frozen_string_literal: true

class ApplicationService
  Result = Data.define(:success, :record, :errors) do
    def success? = success
  end

  def self.call(...) = new(...).call
end
