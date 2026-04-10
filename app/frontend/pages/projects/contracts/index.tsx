import { Form, Head } from "@inertiajs/react"
import { Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppLayout from "@/layouts/app-layout"
import ProjectLayout from "@/layouts/project/project-layout"
import { formatCurrency } from "@/lib/format"
import { projectContractsPath, projectPath, projectsPath } from "@/routes"
import type { BreadcrumbItem, ContractProps, ProjectDetail } from "@/types"

interface Props {
  project: ProjectDetail
  contracts: ContractProps[]
}

export default function ContractsIndex({ project, contracts }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "프로젝트", href: projectsPath() },
    { title: project.project_name, href: projectPath(project.id) },
    {
      title: "도급계약",
      href: projectContractsPath(project.id),
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${project.project_name} - 도급계약`} />

      <ProjectLayout project={project} activeTab="contracts">
        <div className="space-y-4">
          {/* Contract List Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">도급계약</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" />
                  계약 등록
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>계약 등록</DialogTitle>
                </DialogHeader>
                <Form
                  method="post"
                  action={projectContractsPath(project.id)}
                  className="space-y-4"
                >
                  {({ processing }) => (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contract_no">계약번호</Label>
                        <Input
                          id="contract_no"
                          name="contract[contract_no]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract_type">유형</Label>
                        <Select
                          name="contract[contract_type]"
                          defaultValue="original"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">원도급</SelectItem>
                            <SelectItem value="change">변경</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract_date">계약일</Label>
                        <Input
                          id="contract_date"
                          name="contract[contract_date]"
                          type="date"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contract_amount">계약금액</Label>
                        <Input
                          id="contract_amount"
                          name="contract[contract_amount]"
                          type="number"
                          required
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">내용/사유</Label>
                        <textarea
                          id="description"
                          name="contract[description]"
                          rows={2}
                          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                          {processing ? "저장 중..." : "등록"}
                        </Button>
                      </div>
                    </>
                  )}
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Contract Cards */}
          {contracts.length === 0 && (
            <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
              등록된 계약이 없습니다.
            </div>
          )}

          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {contract.type_label} - {contract.contract_no}
                  </CardTitle>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>계약일: {contract.contract_date}</span>
                    <span>|</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(contract.contract_amount)}원
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contract.amount_mismatch && (
                  <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    ⚠ 내역 합계 ({formatCurrency(contract.details_total)}원)가
                    계약금액과 일치하지 않습니다.
                  </div>
                )}

                {/* Contract Details Table */}
                {contract.contract_details.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-muted-foreground h-9 px-3 text-left text-xs font-medium">
                            공종
                          </th>
                          <th className="text-muted-foreground h-9 px-3 text-left text-xs font-medium">
                            내역명
                          </th>
                          <th className="text-muted-foreground h-9 px-3 text-center text-xs font-medium">
                            단위
                          </th>
                          <th className="text-muted-foreground h-9 px-3 text-right text-xs font-medium">
                            수량
                          </th>
                          <th className="text-muted-foreground h-9 px-3 text-right text-xs font-medium">
                            단가
                          </th>
                          <th className="text-muted-foreground h-9 px-3 text-right text-xs font-medium">
                            금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {contract.contract_details.map((detail) => (
                          <tr key={detail.id} className="border-b">
                            <td className="px-3 py-2 text-sm">
                              {detail.work_type_name}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {detail.item_name}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {detail.unit}
                            </td>
                            <td className="px-3 py-2 text-right text-sm tabular-nums">
                              {detail.quantity}
                            </td>
                            <td className="px-3 py-2 text-right text-sm tabular-nums">
                              {detail.unit_price != null
                                ? formatCurrency(detail.unit_price)
                                : "-"}
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                              {formatCurrency(detail.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50">
                          <td
                            colSpan={5}
                            className="px-3 py-2 text-right text-sm font-medium"
                          >
                            합계
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold tabular-nums">
                            {formatCurrency(contract.details_total)}원
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    등록된 내역이 없습니다.
                  </p>
                )}

                {contract.description && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {contract.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ProjectLayout>
    </AppLayout>
  )
}
