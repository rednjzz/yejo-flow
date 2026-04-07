# frozen_string_literal: true

class InertiaController < ApplicationController
  inertia_config default_render: true
  inertia_share auth: {
        user: -> { Current.user.as_json(only: %i[id name email verified created_at updated_at]) },
        session: -> { Current.session.as_json(only: %i[id]) }
      },
      sidebar_projects: -> {
        Project.active.select(:id, :project_name).order(:project_name).limit(20)
          .map { |p| {id: p.id, project_name: p.project_name} }
      }
end
