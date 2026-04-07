import { Head, Link } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"

import { ProjectForm } from "@/components/projects/project-form"
import AppLayout from "@/layouts/app-layout"
import { projectPath, projectsPath } from "@/routes"
import type {
  BreadcrumbItem,
  Company,
  ProjectFormData,
  StatusOption,
} from "@/types"

interface Props {
  project: ProjectFormData
  clients: Company[]
  managers: { id: number; name: string }[]
  statuses: StatusOption[]
}

export default function ProjectEdit({
  project,
  clients,
  managers,
  statuses,
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "프로젝트", href: projectsPath() },
    { title: project.project_name, href: projectPath(project.id!) },
    { title: "수정", href: "#" },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${project.project_name} 수정`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Link
            href={projectPath(project.id!)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-semibold">현장 수정</h1>
        </div>

        <div className="rounded-lg border p-6">
          <ProjectForm
            action={projectPath(project.id!)}
            method="patch"
            projectCode={project.project_code}
            clients={clients}
            managers={managers}
            statuses={statuses}
            defaultValues={project}
            allowedTransitions={project.allowed_transitions}
          />
        </div>
      </div>
    </AppLayout>
  )
}
