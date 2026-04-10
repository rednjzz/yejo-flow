import { Form } from "@inertiajs/react"
import { useCallback, useState } from "react"

import InputError from "@/components/input-error"
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
import { formatCurrency } from "@/lib/format"
import type { Company, ProjectFormData, StatusOption } from "@/types"

interface ProjectFormProps {
  action: string
  method: "post" | "patch"
  projectCode: string
  clients: Company[]
  managers: { id: number; name: string }[]
  statuses: StatusOption[]
  defaultValues?: Partial<ProjectFormData>
  allowedTransitions?: string[]
}

export function ProjectForm({
  action,
  method,
  projectCode,
  clients,
  managers,
  statuses,
  defaultValues,
  allowedTransitions,
}: ProjectFormProps) {
  const [contractAmount, setContractAmount] = useState<string>(
    defaultValues?.contract_amount?.toString() ?? "",
  )
  const [vatAmount, setVatAmount] = useState<number>(
    defaultValues?.vat_amount ?? 0,
  )

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, "")
      const num = parseInt(raw, 10)
      setContractAmount(raw)
      if (!isNaN(num)) {
        setVatAmount(Math.floor(num * 0.1))
      } else {
        setVatAmount(0)
      }
    },
    [],
  )

  const isEdit = method === "patch"
  const currentStatus = defaultValues?.status ?? "preparing"

  return (
    <Form method={method} action={action} className="space-y-6">
      {({ processing, errors }) => (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 현장코드 */}
            <div className="space-y-2">
              <Label htmlFor="project_code">현장코드</Label>
              <Input
                id="project_code"
                value={projectCode}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* 현장명 */}
            <div className="space-y-2">
              <Label htmlFor="project_name">
                현장명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                name="project[project_name]"
                defaultValue={defaultValues?.project_name ?? ""}
                required
                maxLength={200}
              />
              <InputError messages={errors?.project_name} />
            </div>

            {/* 발주처 */}
            <div className="space-y-2">
              <Label htmlFor="client_id">
                발주처 <span className="text-destructive">*</span>
              </Label>
              <Select
                name="project[client_id]"
                defaultValue={defaultValues?.client_id?.toString() ?? ""}
              >
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
              <InputError messages={errors?.client_id} />
            </div>

            {/* 현장 소재지 */}
            <div className="space-y-2">
              <Label htmlFor="site_address">현장 소재지</Label>
              <Input
                id="site_address"
                name="project[site_address]"
                defaultValue={defaultValues?.site_address ?? ""}
              />
            </div>

            {/* 도급금액 */}
            <div className="space-y-2">
              <Label htmlFor="contract_amount">
                도급금액 (부가세 별도){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contract_amount"
                name="project[contract_amount]"
                type="number"
                value={contractAmount}
                onChange={handleAmountChange}
                required
                min={1}
              />
              <InputError messages={errors?.contract_amount} />
            </div>

            {/* 부가세 */}
            <div className="space-y-2">
              <Label htmlFor="vat_amount">부가세</Label>
              <Input
                id="vat_amount"
                value={formatCurrency(vatAmount)}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* 착공일 */}
            <div className="space-y-2">
              <Label htmlFor="start_date">
                착공일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                name="project[start_date]"
                type="date"
                defaultValue={defaultValues?.start_date ?? ""}
                required
              />
              <InputError messages={errors?.start_date} />
            </div>

            {/* 준공예정일 */}
            <div className="space-y-2">
              <Label htmlFor="end_date">
                준공예정일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                name="project[end_date]"
                type="date"
                defaultValue={defaultValues?.end_date ?? ""}
                required
              />
              <InputError messages={errors?.end_date} />
            </div>

            {/* 현장소장 */}
            <div className="space-y-2">
              <Label htmlFor="manager_id">현장소장</Label>
              <Select
                name="project[manager_id]"
                defaultValue={defaultValues?.manager_id?.toString() ?? ""}
              >
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

            {/* 상태 */}
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select name="project[status]" defaultValue={currentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={currentStatus}>
                      {statuses.find((s) => s.value === currentStatus)?.label ??
                        currentStatus}
                    </SelectItem>
                    {allowedTransitions?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statuses.find((st) => st.value === s)?.label ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <InputError messages={errors?.status} />
              </div>
            )}

            {/* 선급금비율 */}
            <div className="space-y-2">
              <Label htmlFor="advance_rate">선급금 비율 (%)</Label>
              <Input
                id="advance_rate"
                name="project[advance_rate]"
                type="number"
                step="0.01"
                defaultValue={defaultValues?.advance_rate?.toString() ?? ""}
              />
            </div>

            {/* 하자보증금비율 */}
            <div className="space-y-2">
              <Label htmlFor="retention_rate">하자보증금 비율 (%)</Label>
              <Input
                id="retention_rate"
                name="project[retention_rate]"
                type="number"
                step="0.01"
                defaultValue={defaultValues?.retention_rate?.toString() ?? ""}
              />
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <textarea
              id="notes"
              name="project[notes]"
              defaultValue={defaultValues?.notes ?? ""}
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={processing}>
              {processing ? "저장 중..." : isEdit ? "수정" : "등록"}
            </Button>
          </div>
        </>
      )}
    </Form>
  )
}
