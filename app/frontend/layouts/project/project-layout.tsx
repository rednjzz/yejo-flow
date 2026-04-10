import { Link } from "@inertiajs/react"
import { ArrowLeft, Pencil } from "lucide-react"
import type { PropsWithChildren } from "react"

import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Button } from "@/components/ui/button"
import {
  editProjectPath,
  projectContractsPath,
  projectPath,
  projectsPath,
} from "@/routes"
import type { ProjectDetail } from "@/types"

const TABS = [
  { key: "overview", label: "종합현황", enabled: true },
  { key: "contracts", label: "도급계약", enabled: true },
  { key: "cost", label: "원가관리", enabled: false },
  { key: "billing", label: "기성관리", enabled: false },
  { key: "subcontract", label: "하도급", enabled: false },
  { key: "labor", label: "노무", enabled: false },
  { key: "equipment", label: "장비", enabled: false },
  { key: "material", label: "자재", enabled: false },
]

function getTabHref(projectId: number, tabKey: string): string {
  switch (tabKey) {
    case "overview":
      return projectPath(projectId)
    case "contracts":
      return projectContractsPath(projectId)
    default:
      return "#"
  }
}

interface ProjectLayoutProps extends PropsWithChildren {
  project: ProjectDetail
  activeTab: string
}

export default function ProjectLayout({
  project,
  activeTab,
  children,
}: ProjectLayoutProps) {
  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={projectsPath()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{project.project_name}</h1>
            <p className="text-muted-foreground text-sm">
              {project.project_code} | {project.client_name} |{" "}
              {project.formatted_period}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={editProjectPath(project.id)}>
            <Pencil className="size-4" />
            수정
          </Link>
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="bg-muted flex gap-1 rounded-lg p-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          const isEnabled = tab.enabled

          if (!isEnabled) {
            return (
              <span
                key={tab.key}
                className="text-muted-foreground/50 cursor-not-allowed rounded-md px-4 py-2 text-sm font-medium"
              >
                {tab.label}
              </span>
            )
          }

          return (
            <Link
              key={tab.key}
              href={getTabHref(project.id, tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              preserveState
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
