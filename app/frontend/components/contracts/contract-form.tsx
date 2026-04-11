import { Form } from "@inertiajs/react"
import { useCallback, useState } from "react"

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
import type { ContractFormData } from "@/types"

interface ContractFormProps {
  action: string
  method: "post" | "patch"
  defaultValues?: Partial<ContractFormData>
}

export function ContractForm({
  action,
  method,
  defaultValues,
}: ContractFormProps) {
  const isEdit = method === "patch"

  const [supplyAmount, setSupplyAmount] = useState(
    defaultValues?.supply_amount?.toString() ?? "",
  )
  const [vatManual, setVatManual] = useState(!!defaultValues?.vat_amount)
  const [vatValue, setVatValue] = useState(
    defaultValues?.vat_amount?.toString() ?? "",
  )

  const parsedSupply = parseInt(supplyAmount, 10) || 0
  const autoVat = Math.floor(parsedSupply * 0.1)
  const currentVat =
    vatManual && vatValue !== "" ? parseInt(vatValue, 10) || 0 : autoVat
  const totalAmount = parsedSupply + currentVat

  const handleSupplyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSupplyAmount(e.target.value)
      if (!vatManual) {
        setVatValue("")
      }
    },
    [vatManual],
  )

  const handleVatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVatManual(true)
      setVatValue(e.target.value)
    },
    [],
  )

  return (
    <Form method={method} action={action} className="space-y-6">
      {({ processing }) => (
        <>
          {/* 기본정보 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contract_no">
                계약번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contract_no"
                name="contract[contract_no]"
                defaultValue={defaultValues?.contract_no ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract_type">유형</Label>
              <Select
                name="contract[contract_type]"
                defaultValue={defaultValues?.contract_type ?? "original"}
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contract_date">
                계약일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contract_date"
                name="contract[contract_date]"
                type="date"
                defaultValue={defaultValues?.contract_date ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change_seq">변경차수</Label>
              <Input
                id="change_seq"
                name="contract[change_seq]"
                type="number"
                min={1}
                defaultValue={defaultValues?.change_seq?.toString() ?? ""}
                placeholder="변경계약 시 입력"
              />
            </div>
          </div>

          {/* 금액 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supply_amount">
                공급가액 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supply_amount"
                name="contract[supply_amount]"
                type="number"
                required
                min={0}
                value={supplyAmount}
                onChange={handleSupplyChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_amount">부가가치세</Label>
              <Input
                id="vat_amount"
                name="contract[vat_amount]"
                type="number"
                min={0}
                value={vatManual && vatValue !== "" ? vatValue : autoVat.toString()}
                onChange={handleVatChange}
                placeholder="자동 계산 (10%)"
              />
            </div>
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
            <span className="text-sm font-medium">총 계약금액</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(totalAmount)}원
            </span>
          </div>

          {/* 변경금액 */}
          <div className="space-y-2">
            <Label htmlFor="change_amount">변경금액 (증감액)</Label>
            <Input
              id="change_amount"
              name="contract[change_amount]"
              type="number"
              defaultValue={defaultValues?.change_amount?.toString() ?? ""}
              placeholder="변경계약 시 입력"
            />
          </div>

          {/* 계약조건 */}
          <details className="group" open={isEdit && hasConditions(defaultValues)}>
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
              계약조건 {isEdit ? "" : "(선택)"}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defect_liability_months">
                  하자책임기간 (개월)
                </Label>
                <Input
                  id="defect_liability_months"
                  name="contract[defect_liability_months]"
                  type="number"
                  min={0}
                  defaultValue={
                    defaultValues?.defect_liability_months?.toString() ?? ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defect_warranty_rate">하자보증보율 (%)</Label>
                <Input
                  id="defect_warranty_rate"
                  name="contract[defect_warranty_rate]"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={
                    defaultValues?.defect_warranty_rate?.toString() ?? ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late_penalty_rate">지체상환율 (%/일)</Label>
                <Input
                  id="late_penalty_rate"
                  name="contract[late_penalty_rate]"
                  type="number"
                  step="0.001"
                  min={0}
                  defaultValue={
                    defaultValues?.late_penalty_rate?.toString() ?? ""
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late_penalty_cap_rate">
                  지체상환 상한율 (%)
                </Label>
                <Input
                  id="late_penalty_cap_rate"
                  name="contract[late_penalty_cap_rate]"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={
                    defaultValues?.late_penalty_cap_rate?.toString() ?? ""
                  }
                />
              </div>
            </div>
          </details>

          {/* 비고/특기사항 */}
          <div className="space-y-2">
            <Label htmlFor="period_note">공기 관련 특기사항</Label>
            <textarea
              id="period_note"
              name="contract[period_note]"
              defaultValue={defaultValues?.period_note ?? ""}
              rows={2}
              className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_conditions">계약 특이사항</Label>
            <textarea
              id="special_conditions"
              name="contract[special_conditions]"
              defaultValue={defaultValues?.special_conditions ?? ""}
              rows={2}
              className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">내용/사유</Label>
            <textarea
              id="description"
              name="contract[description]"
              defaultValue={defaultValues?.description ?? ""}
              rows={2}
              className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {/* 파일 첨부 */}
          <div className="space-y-2">
            <Label htmlFor="contract_files">계약서 첨부</Label>
            <Input
              id="contract_files"
              name="contract[contract_files][]"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-muted-foreground text-xs">
              PDF, JPG, PNG (개별 최대 20MB)
            </p>
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

function hasConditions(
  values?: Partial<ContractFormData>,
): boolean {
  if (!values) return false
  return (
    values.defect_liability_months != null &&
    values.defect_liability_months !== "" ||
    values.defect_warranty_rate != null &&
    values.defect_warranty_rate !== "" ||
    values.late_penalty_rate != null &&
    values.late_penalty_rate !== "" ||
    values.late_penalty_cap_rate != null &&
    values.late_penalty_cap_rate !== ""
  )
}
