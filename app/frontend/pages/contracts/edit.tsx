import { Head, Link } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"

import { ContractForm } from "@/components/contracts/contract-form"
import AppLayout from "@/layouts/app-layout"
import {
  contractPath,
  projectContractsPath,
  projectPath,
  projectsPath,
} from "@/routes"
import type { BreadcrumbItem, ContractFormData, ProjectDetail } from "@/types"

interface Props {
  contract: ContractFormData
  project: ProjectDetail
}

export default function ContractEdit({ contract, project }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "프로젝트", href: projectsPath() },
    { title: project.project_name, href: projectPath(project.id) },
    { title: "도급계약", href: projectContractsPath(project.id) },
    { title: "수정", href: "#" },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${contract.contract_no} 수정`} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Link
            href={projectContractsPath(project.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-semibold">계약 수정</h1>
        </div>

        <div className="rounded-lg border p-6">
          <ContractForm
            action={contractPath(contract.id!)}
            method="patch"
            defaultValues={contract}
          />
        </div>
      </div>
    </AppLayout>
  )
}
