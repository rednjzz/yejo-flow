import { Form, Head, router } from "@inertiajs/react"
import { Plus, Search } from "lucide-react"
import { useState } from "react"

import { ProjectStatusBadge } from "@/components/project-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import AppLayout from "@/layouts/app-layout"
import { projectPath, projectsPath } from "@/routes"
import type { BreadcrumbItem, Company, ProjectListItem } from "@/types"

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
  new_project_code: string
  clients: Company[]
  managers: { id: number; name: string }[]
}

export default function ProjectsIndex({
  projects,
  new_project_code,
  clients,
  managers,
}: Props) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)

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

          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" />
            신규 현장
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-muted-foreground h-10 px-3 text-left text-xs font-medium">
                  현장코드
                </th>
                <th className="text-muted-foreground h-10 px-3 text-left text-xs font-medium">
                  현장명
                </th>
                <th className="text-muted-foreground h-10 px-3 text-left text-xs font-medium">
                  발주처
                </th>
                <th className="text-muted-foreground h-10 px-3 text-right text-xs font-medium">
                  도급금액
                </th>
                <th className="text-muted-foreground h-10 px-3 text-left text-xs font-medium">
                  공사기간
                </th>
                <th className="text-muted-foreground h-10 px-3 text-center text-xs font-medium">
                  상태
                </th>
                <th className="text-muted-foreground h-10 px-3 text-right text-xs font-medium">
                  기성률
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-3 py-8 text-center text-sm"
                  >
                    등록된 현장이 없습니다.
                  </td>
                </tr>
              )}
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-muted/50 cursor-pointer border-b transition-colors"
                  onClick={() => router.visit(projectPath(project.id))}
                >
                  <td className="px-3 py-2.5 text-sm font-medium">
                    {project.project_code}
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    {project.project_name}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-sm">
                    {project.client_name}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm tabular-nums">
                    {project.amount_in_billion}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-sm">
                    {project.formatted_period}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm tabular-nums">
                    {project.billing_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 신규 현장 등록 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>신규 현장 등록</SheetTitle>
            <SheetDescription>
              새 현장의 기본 정보를 입력합니다.
            </SheetDescription>
          </SheetHeader>
          <Form
            method="post"
            action={projectsPath()}
            className="space-y-4 px-4 pb-4"
          >
            {({ processing }) => (
              <>
                <div className="space-y-2">
                  <Label htmlFor="project_code">현장코드</Label>
                  <Input
                    id="project_code"
                    value={new_project_code}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_name">
                    현장명 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="project_name"
                    name="project[project_name]"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">
                    발주처 <span className="text-destructive">*</span>
                  </Label>
                  <Select name="project[client_id]">
                    <SelectTrigger>
                      <SelectValue placeholder="발주처 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_address">현장 소재지</Label>
                  <Input id="site_address" name="project[site_address]" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">
                      착공일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="start_date"
                      name="project[start_date]"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">
                      준공예정일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="end_date"
                      name="project[end_date]"
                      type="date"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager_id">현장소장</Label>
                  <Select name="project[manager_id]">
                    <SelectTrigger>
                      <SelectValue placeholder="현장소장 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">비고</Label>
                  <textarea
                    id="notes"
                    name="project[notes]"
                    rows={3}
                    className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={processing}>
                    {processing ? "저장 중..." : "등록"}
                  </Button>
                </div>
              </>
            )}
          </Form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
