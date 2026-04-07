# frozen_string_literal: true

module Projects
  class CreateService < ApplicationService
    def initialize(params)
      @params = params
    end

    def call
      project = Project.new(@params)

      if project.save
        Result.new(success: true, record: project, errors: nil)
      else
        Result.new(success: false, record: project, errors: project.errors)
      end
    end
  end
end
