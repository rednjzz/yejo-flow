import { Head, Link, router } from "@inertiajs/react"
import { Plus, Search } from "lucide-react"
import { useState } from "react"

import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppLayout from "@/layouts/app-layout"
import { newProjectPath, projectPath, projectsPath } from "@/routes"
import type { BreadcrumbItem, ProjectListItem } from "@/types"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "프로젝트", href: projectsPath() },
]

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "preparing", label: "준비중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "준공" },
  { value: "defect_period", label: "하자보수" },
  { value: "closed", label: "종료" },
]

interface Props {
  projects: ProjectListItem[]
}

export default function ProjectsIndex({ projects }: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  function handleFilter(newStatus?: string, newSearch?: string) {
    const s = newStatus ?? status
    const q = newSearch ?? search
    router.get(
      projectsPath(),
      { ...(s !== "all" && { status: s }), ...(q && { q }) },
      { preserveState: true, preserveScroll: true },
    )
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    handleFilter(value)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    handleFilter(undefined, search)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="프로젝트" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder="현장명 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[240px] pl-8"
                />
              </div>
            </form>
          </div>

          <Button asChild>
            <Link href={newProjectPath()}>
              <Plus className="size-4" />
              신규 현장
            </Link>
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
                  현장코드
                </th>
                <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
                  현장명
                </th>
                <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
                  발주처
                </th>
                <th className="h-10 px-3 text-right text-xs font-medium text-muted-foreground">
                  도급금액
                </th>
                <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
                  공사기간
                </th>
                <th className="h-10 px-3 text-center text-xs font-medium text-muted-foreground">
                  상태
                </th>
                <th className="h-10 px-3 text-right text-xs font-medium text-muted-foreground">
                  기성률
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    등록된 현장이 없습니다.
                  </td>
                </tr>
              )}
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.visit(projectPath(project.id))}
                >
                  <td className="px-3 py-2.5 text-sm font-medium">
                    {project.project_code}
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    {project.project_name}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">
                    {project.client_name}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    {project.amount_in_billion}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">
                    {project.formatted_period}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="px-3 py-2.5 text-sm text-right tabular-nums">
                    {project.billing_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
