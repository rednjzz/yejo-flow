import { Head, Link } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"

import { ProjectForm } from "@/components/projects/project-form"
import AppLayout from "@/layouts/app-layout"
import { projectsPath } from "@/routes"
import type { BreadcrumbItem, Company, StatusOption } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "프로젝트", href: projectsPath() },
  { title: "신규 현장", href: "#" },
]

interface Props {
  project_code: string
  clients: Company[]
  managers: { id: number; name: string }[]
  statuses: StatusOption[]
}

export default function ProjectNew({
  project_code,
  clients,
  managers,
  statuses,
}: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="신규 현장 등록" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Link
            href={projectsPath()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-semibold">신규 현장 등록</h1>
        </div>

        <div className="rounded-lg border p-6">
          <ProjectForm
            action={projectsPath()}
            method="post"
            projectCode={project_code}
            clients={clients}
            managers={managers}
            statuses={statuses}
          />
        </div>
      </div>
    </AppLayout>
  )
}
