# frozen_string_literal: true

module Projects
  class UpdateService < ApplicationService
    def initialize(project, params)
      @project = project
      @params = params
    end

    def call
      validate_status_transition! if status_changing?
      set_actual_end_date if transitioning_to_completed?

      if @project.update(@params)
        Result.new(success: true, record: @project, errors: nil)
      else
        Result.new(success: false, record: @project, errors: @project.errors)
      end
    end

    private

    def status_changing?
      @params[:status].present? && @params[:status] != @project.status
    end

    def transitioning_to_completed?
      status_changing? && @params[:status] == "completed"
    end

    def validate_status_transition!
      new_status = @params[:status]
      return if @project.can_transition_to?(new_status)

      @project.errors.add(:status, "을(를) #{Project::STATUS_LABELS[new_status]}(으)로 변경할 수 없습니다")
      raise ActiveRecord::RecordInvalid, @project
    end

    def set_actual_end_date
      @params[:actual_end_date] ||= Date.current
    end
  end
end
