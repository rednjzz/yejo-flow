import { Head } from "@inertiajs/react"

import { KpiCard } from "@/components/kpi-card"
import AppLayout from "@/layouts/app-layout"
import ProjectLayout from "@/layouts/project/project-layout"
import { formatCurrency } from "@/lib/format"
import { projectPath, projectsPath } from "@/routes"
import type { BreadcrumbItem, ProjectDetail } from "@/types"

interface Props {
  project: ProjectDetail
}

export default function ProjectShow({ project }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "프로젝트", href: projectsPath() },
    { title: project.project_name, href: projectPath(project.id) },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={project.project_name} />

      <ProjectLayout project={project} activeTab="overview">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="도급금액"
            value={`${formatCurrency(project.contract_amount)}원`}
            description={`부가세 ${formatCurrency(project.vat_amount)}원`}
          />
          <KpiCard
            title="기성 누계"
            value="-"
            description="기성 데이터 준비 중"
          />
          <KpiCard
            title="투입원가"
            value="-"
            description="원가 데이터 준비 중"
          />
          <KpiCard
            title="현장 손익"
            value="-"
            description="손익 데이터 준비 중"
          />
        </div>

        {/* Cost Breakdown - Placeholder */}
        <div className="mt-6 rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-medium">원가 비목별 현황</h3>
          <p className="text-muted-foreground text-sm">
            원가 데이터가 등록되면 비목별 현황이 표시됩니다.
          </p>
        </div>

        {/* Subcontract Summary - Placeholder */}
        <div className="mt-4 rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-medium">하도급 현황</h3>
          <p className="text-muted-foreground text-sm">
            하도급 데이터가 등록되면 현황이 표시됩니다.
          </p>
        </div>
      </ProjectLayout>
    </AppLayout>
  )
}
