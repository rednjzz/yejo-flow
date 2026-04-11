import { Form } from "@inertiajs/react"
import { Plus, Trash2 } from "lucide-react"
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
import type { ContractFormData, ContractPaymentTermProps } from "@/types"

interface ContractFormProps {
  action: string
  method: "post" | "patch"
  defaultValues?: Partial<ContractFormData>
}

interface PaymentTermRow {
  id?: number
  term_type: string
  seq: number
  interim_method: string
  rate: string
  amount: string
  condition: string
  due_date: string
  sort_order: number
  _destroy: boolean
}

function toRows(terms?: ContractPaymentTermProps[]): PaymentTermRow[] {
  if (!terms || terms.length === 0) return []
  return terms.map((t) => ({
    id: t.id,
    term_type: t.term_type,
    seq: t.seq,
    interim_method: t.interim_method ?? "",
    rate: t.rate?.toString() ?? "",
    amount: t.amount?.toString() ?? "",
    condition: t.condition ?? "",
    due_date: t.due_date ?? "",
    sort_order: t.sort_order,
    _destroy: false,
  }))
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

  // 결제조건 관리
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermRow[]>(
    toRows(defaultValues?.contract_payment_terms),
  )

  const addPaymentTerm = useCallback(
    (termType: string) => {
      const activeTerms = paymentTerms.filter(
        (t) => !t._destroy && t.term_type === termType,
      )
      const nextSeq =
        activeTerms.length > 0
          ? Math.max(...activeTerms.map((t) => t.seq)) + 1
          : 1
      const nextSort =
        paymentTerms.length > 0
          ? Math.max(...paymentTerms.map((t) => t.sort_order)) + 1
          : 0

      setPaymentTerms((prev) => [
        ...prev,
        {
          term_type: termType,
          seq: nextSeq,
          interim_method: termType === "interim" ? "milestone" : "",
          rate: "",
          amount: "",
          condition: "",
          due_date: "",
          sort_order: nextSort,
          _destroy: false,
        },
      ])
    },
    [paymentTerms],
  )

  const removePaymentTerm = useCallback((index: number) => {
    setPaymentTerms((prev) =>
      prev.map((t, i) => (i === index ? { ...t, _destroy: true } : t)),
    )
  }, [])

  const updatePaymentTerm = useCallback(
    (index: number, field: keyof PaymentTermRow, value: string | number) => {
      setPaymentTerms((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
      )
    },
    [],
  )

  const hasAdvance = paymentTerms.some(
    (t) => t.term_type === "advance" && !t._destroy,
  )
  const hasFinal = paymentTerms.some(
    (t) => t.term_type === "final" && !t._destroy,
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
                value={
                  vatManual && vatValue !== ""
                    ? vatValue
                    : autoVat.toString()
                }
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

          {/* 결제조건 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">결제조건</h4>
              <div className="flex gap-1">
                {!hasAdvance && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPaymentTerm("advance")}
                  >
                    <Plus className="size-3" />
                    착수금
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPaymentTerm("interim")}
                >
                  <Plus className="size-3" />
                  중도금
                </Button>
                {!hasFinal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPaymentTerm("final")}
                  >
                    <Plus className="size-3" />
                    잔금
                  </Button>
                )}
              </div>
            </div>

            {paymentTerms.length === 0 && (
              <p className="text-muted-foreground text-sm">
                등록된 결제조건이 없습니다.
              </p>
            )}

            {paymentTerms.map((term, index) => {
              const prefix = `contract[contract_payment_terms_attributes][${index}]`
              const termLabel =
                term.term_type === "advance"
                  ? "착수금"
                  : term.term_type === "final"
                    ? "잔금"
                    : `중도금 ${term.seq}차`

              return (
                <div
                  key={`${term.term_type}-${term.seq}-${index}`}
                  className={`rounded-md border p-3 ${term._destroy ? "hidden" : ""}`}
                >
                  {/* Hidden fields */}
                  {term.id && (
                    <input type="hidden" name={`${prefix}[id]`} value={term.id} />
                  )}
                  <input
                    type="hidden"
                    name={`${prefix}[term_type]`}
                    value={term.term_type}
                  />
                  <input
                    type="hidden"
                    name={`${prefix}[seq]`}
                    value={term.seq}
                  />
                  <input
                    type="hidden"
                    name={`${prefix}[sort_order]`}
                    value={term.sort_order}
                  />
                  {term.term_type === "interim" && (
                    <input
                      type="hidden"
                      name={`${prefix}[interim_method]`}
                      value={term.interim_method || "milestone"}
                    />
                  )}
                  {term._destroy && (
                    <input
                      type="hidden"
                      name={`${prefix}[_destroy]`}
                      value="1"
                    />
                  )}

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{termLabel}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePaymentTerm(index)}
                    >
                      <Trash2 className="text-muted-foreground size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">비율 (%)</Label>
                      <Input
                        name={`${prefix}[rate]`}
                        type="number"
                        step="0.01"
                        min={0}
                        max={100}
                        value={term.rate}
                        onChange={(e) =>
                          updatePaymentTerm(index, "rate", e.target.value)
                        }
                        placeholder="예: 30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">금액</Label>
                      <Input
                        name={`${prefix}[amount]`}
                        type="number"
                        min={0}
                        value={term.amount}
                        onChange={(e) =>
                          updatePaymentTerm(index, "amount", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">지급조건</Label>
                      <Input
                        name={`${prefix}[condition]`}
                        value={term.condition}
                        onChange={(e) =>
                          updatePaymentTerm(index, "condition", e.target.value)
                        }
                        placeholder="예: 계약후 15일이내"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 계약조건 */}
          <details
            className="group"
            open={isEdit && hasConditions(defaultValues)}
          >
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

function hasConditions(values?: Partial<ContractFormData>): boolean {
  if (!values) return false
  return !!(
    (values.defect_liability_months != null &&
      values.defect_liability_months !== "") ||
    (values.defect_warranty_rate != null &&
      values.defect_warranty_rate !== "") ||
    (values.late_penalty_rate != null && values.late_penalty_rate !== "") ||
    (values.late_penalty_cap_rate != null &&
      values.late_penalty_cap_rate !== "")
  )
}
