import { router } from "@inertiajs/react"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
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

type SaveStatus = "idle" | "saving" | "saved" | "error"

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

  // --- 기본 필드 state ---
  const [contractType, setContractType] = useState(
    defaultValues?.contract_type ?? "original",
  )
  const [contractDate, setContractDate] = useState(
    defaultValues?.contract_date ?? "",
  )
  const [changeSeq, setChangeSeq] = useState(
    defaultValues?.change_seq?.toString() ?? "",
  )
  const [supplyAmount, setSupplyAmount] = useState(
    defaultValues?.supply_amount?.toString() ?? "",
  )
  const [vatManual, setVatManual] = useState(!!defaultValues?.vat_amount)
  const [vatValue, setVatValue] = useState(
    defaultValues?.vat_amount?.toString() ?? "",
  )
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  )
  const [periodNote, setPeriodNote] = useState(defaultValues?.period_note ?? "")
  const [specialConditions, setSpecialConditions] = useState(
    defaultValues?.special_conditions ?? "",
  )
  const [defectMonths, setDefectMonths] = useState(
    defaultValues?.defect_liability_months?.toString() ?? "",
  )
  const [defectRate, setDefectRate] = useState(
    defaultValues?.defect_warranty_rate?.toString() ?? "",
  )
  const [penaltyRate, setPenaltyRate] = useState(
    defaultValues?.late_penalty_rate?.toString() ?? "",
  )
  const [penaltyCapRate, setPenaltyCapRate] = useState(
    defaultValues?.late_penalty_cap_rate?.toString() ?? "",
  )

  const parsedSupply = parseInt(supplyAmount, 10) || 0
  const autoVat = Math.floor(parsedSupply * 0.1)
  const currentVat =
    vatManual && vatValue !== "" ? parseInt(vatValue, 10) || 0 : autoVat
  const totalAmount = parsedSupply + currentVat

  const handleSupplyChange = useCallback(
    (raw: string) => {
      setSupplyAmount(raw)
      if (!vatManual) setVatValue("")
    },
    [vatManual],
  )

  const handleVatChange = useCallback((raw: string) => {
    setVatManual(true)
    setVatValue(raw)
  }, [])

  // --- 결제조건 state ---
  const initialTerms = toRows(defaultValues?.contract_payment_terms)
  const [paymentTerms, setPaymentTerms] =
    useState<PaymentTermRow[]>(initialTerms)

  const existingInterim = initialTerms.find((t) => t.term_type === "interim")
  const [interimMethod, setInterimMethod] = useState<
    "milestone" | "monthly_billing"
  >(
    (existingInterim?.interim_method as "milestone" | "monthly_billing") ||
      "milestone",
  )

  // --- 자동 저장 (edit 모드) ---
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const paymentTermsRef = useRef(paymentTerms)
  paymentTermsRef.current = paymentTerms

  const buildPayload = useCallback(() => {
    const terms = paymentTermsRef.current
    const termsAttrs: Record<string, Record<string, unknown>> = {}
    terms.forEach((t, i) => {
      termsAttrs[i.toString()] = {
        ...(t.id != null ? { id: t.id } : {}),
        term_type: t.term_type,
        seq: t.seq,
        interim_method: t.term_type === "interim" ? t.interim_method : "",
        rate: t.rate || null,
        amount: t.amount || null,
        condition: t.condition,
        sort_order: t.sort_order,
        _destroy: t._destroy ? "1" : "0",
      }
    })

    return {
      contract: {
        contract_type: contractType,
        change_seq: changeSeq || null,
        contract_date: contractDate,
        supply_amount: supplyAmount,
        vat_amount:
          vatManual && vatValue !== "" ? vatValue : autoVat.toString(),
        description,
        defect_liability_months: defectMonths || null,
        defect_warranty_rate: defectRate || null,
        late_penalty_rate: penaltyRate || null,
        late_penalty_cap_rate: penaltyCapRate || null,
        period_note: periodNote,
        special_conditions: specialConditions,
        contract_payment_terms_attributes: termsAttrs,
      },
    }
  }, [
    contractType,
    changeSeq,
    contractDate,
    supplyAmount,
    vatManual,
    vatValue,
    autoVat,
    description,
    defectMonths,
    defectRate,
    penaltyRate,
    penaltyCapRate,
    periodNote,
    specialConditions,
  ])

  const saveForm = useCallback(() => {
    if (!isEdit) return
    clearTimeout(savedTimerRef.current)
    setSaveStatus("saving")
    router.patch(action, buildPayload(), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setSaveStatus("saved")
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000)
      },
      onError: () => setSaveStatus("error"),
    })
  }, [isEdit, action, buildPayload])

  const saveFormRef = useRef(saveForm)
  saveFormRef.current = saveForm
  const saveFormNow = useCallback(() => {
    setTimeout(() => saveFormRef.current(), 0)
  }, [])

  const updateAndSave = useCallback(
    (setter: (v: string) => void, value: string) => {
      setter(value)
      if (isEdit) saveFormNow()
    },
    [isEdit, saveFormNow],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      router.post(action, buildPayload())
    },
    [action, buildPayload],
  )

  // --- 결제조건 핸들러 ---
  const handleInterimMethodChange = useCallback(
    (m: string) => {
      const newMethod = m as "milestone" | "monthly_billing"
      setInterimMethod(newMethod)
      setPaymentTerms((prev) =>
        prev.map((t) =>
          t.term_type === "interim" ? { ...t, interim_method: newMethod } : t,
        ),
      )
      if (isEdit) saveFormNow()
    },
    [isEdit, saveFormNow],
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
          interim_method: termType === "interim" ? interimMethod : "",
          rate: "",
          amount: "",
          condition:
            termType === "interim" && interimMethod === "monthly_billing"
              ? "매월 기성 청구 승인 후"
              : "",
          due_date: "",
          sort_order: nextSort,
          _destroy: false,
        },
      ])
    },
    [paymentTerms, interimMethod],
  )

  const removePaymentTerm = useCallback(
    (index: number) => {
      setPaymentTerms((prev) =>
        prev.map((t, i) => (i === index ? { ...t, _destroy: true } : t)),
      )
      if (isEdit) saveFormNow()
    },
    [isEdit, saveFormNow],
  )

  const updatePaymentTerm = useCallback(
    (index: number, field: keyof PaymentTermRow, value: string | number) => {
      setPaymentTerms((prev) =>
        prev.map((t, i) => {
          if (i !== index) return t
          const updated = { ...t, [field]: value }
          if (field === "rate" && totalAmount > 0) {
            const rate = parseFloat(value as string)
            if (!isNaN(rate))
              updated.amount = Math.round((totalAmount * rate) / 100).toString()
          }
          if (field === "amount" && totalAmount > 0) {
            const amount = parseInt(value as string, 10)
            if (!isNaN(amount))
              updated.rate = ((amount / totalAmount) * 100).toFixed(2)
          }
          return updated
        }),
      )
    },
    [totalAmount],
  )

  const hasAdvance = paymentTerms.some(
    (t) => t.term_type === "advance" && !t._destroy,
  )
  const hasInterim = paymentTerms.some(
    (t) => t.term_type === "interim" && !t._destroy,
  )
  const hasFinal = paymentTerms.some(
    (t) => t.term_type === "final" && !t._destroy,
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 자동 저장 상태 */}
      {isEdit && (
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="text-muted-foreground size-3 animate-spin" />
              <span className="text-muted-foreground">저장 중...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="size-3 text-green-600" />
              <span className="text-green-600">저장됨</span>
            </>
          )}
          {saveStatus === "error" && (
            <span className="text-destructive">저장 실패</span>
          )}
        </div>
      )}

      {/* 기본정보 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contract_code">계약코드</Label>
          <Input
            id="contract_code"
            value={defaultValues?.contract_code ?? "자동 생성"}
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract_type">유형</Label>
          <Select
            value={contractType}
            onValueChange={(v) => updateAndSave(setContractType, v)}
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
            type="date"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
            onBlur={() => saveForm()}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="change_seq">변경차수</Label>
          <Input
            id="change_seq"
            type="number"
            min={1}
            value={changeSeq}
            onChange={(e) => setChangeSeq(e.target.value)}
            onBlur={() => saveForm()}
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
          <CurrencyInput
            id="supply_amount"
            name="__supply_amount"
            value={supplyAmount}
            onValueChange={handleSupplyChange}
            onBlur={() => saveForm()}
            required
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vat_amount">부가가치세</Label>
          <CurrencyInput
            id="vat_amount"
            name="__vat_amount"
            value={vatManual && vatValue !== "" ? vatValue : autoVat.toString()}
            onValueChange={handleVatChange}
            onBlur={() => saveForm()}
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

      {/* 결제조건 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">결제조건</h4>

        <div className="bg-muted/30 rounded-md border p-3">
          <Label className="mb-2 block text-xs font-medium">
            중도금 지급방식
          </Label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                interimMethod === "milestone"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => handleInterimMethodChange("milestone")}
            >
              분할 (마일스톤)
            </button>
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                interimMethod === "monthly_billing"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => handleInterimMethodChange("monthly_billing")}
            >
              기성 (월기성)
            </button>
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            {interimMethod === "milestone"
              ? "공정 마일스톤별로 사전 약정된 비율/금액으로 분할 지급"
              : "매월 기성 청구 금액에 따라 지급 (비율/금액 사전 약정 없음)"}
          </p>
        </div>

        <div className="flex gap-2">
          {!hasAdvance && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addPaymentTerm("advance")}
            >
              <Plus className="size-3" />
              착수금 추가
            </Button>
          )}
          {interimMethod === "milestone" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addPaymentTerm("interim")}
            >
              <Plus className="size-3" />
              중도금 추가
            </Button>
          )}
          {interimMethod === "monthly_billing" && !hasInterim && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addPaymentTerm("interim")}
            >
              <Plus className="size-3" />
              중도금 (기성) 추가
            </Button>
          )}
          {!hasFinal && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addPaymentTerm("final")}
            >
              <Plus className="size-3" />
              잔금 추가
            </Button>
          )}
        </div>

        {paymentTerms.filter((t) => !t._destroy).length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-muted-foreground mb-3 text-sm">
              등록된 결제조건이 없습니다.
            </p>
            <p className="text-muted-foreground text-xs">
              위의 착수금, 중도금, 잔금 버튼을 클릭하여 결제조건을 추가하세요.
            </p>
          </div>
        )}

        {paymentTerms.map((term, index) => {
          const isMonthlyInterim =
            term.term_type === "interim" &&
            term.interim_method === "monthly_billing"
          const termLabel =
            term.term_type === "advance"
              ? "착수금"
              : term.term_type === "final"
                ? "잔금"
                : isMonthlyInterim
                  ? "중도금 (월기성)"
                  : `중도금 ${term.seq}차`

          return (
            <div
              key={
                term.id != null
                  ? `term-${term.id}`
                  : `new-${term.term_type}-${term.seq}`
              }
              className={`rounded-md border p-3 ${term._destroy ? "hidden" : ""}`}
            >
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

              {isMonthlyInterim ? (
                <div className="space-y-1">
                  <Label className="text-xs">지급조건</Label>
                  <Input
                    value={term.condition}
                    onChange={(e) =>
                      updatePaymentTerm(index, "condition", e.target.value)
                    }
                    onBlur={() => saveForm()}
                    placeholder="예: 매월 기성 청구 승인 후"
                  />
                  <p className="text-muted-foreground text-xs">
                    기성 방식은 실제 기성 승인 금액에 따라 지급되므로
                    비율/금액을 사전 지정하지 않습니다.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">비율 (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={term.rate}
                      onChange={(e) =>
                        updatePaymentTerm(index, "rate", e.target.value)
                      }
                      onBlur={() => saveForm()}
                      placeholder="예: 30"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">금액</Label>
                    <CurrencyInput
                      name={`__term_amount_${index}`}
                      value={term.amount}
                      onValueChange={(raw) =>
                        updatePaymentTerm(index, "amount", raw)
                      }
                      onBlur={() => saveForm()}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">지급조건</Label>
                    <Input
                      value={term.condition}
                      onChange={(e) =>
                        updatePaymentTerm(index, "condition", e.target.value)
                      }
                      onBlur={() => saveForm()}
                      placeholder="예: 계약후 15일이내"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 계약조건 */}
      <details className="group" open={isEdit && hasConditions(defaultValues)}>
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium">
          계약조건 {isEdit ? "" : "(선택)"}
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defect_liability_months">하자책임기간 (개월)</Label>
            <Input
              id="defect_liability_months"
              type="number"
              min={0}
              value={defectMonths}
              onChange={(e) => setDefectMonths(e.target.value)}
              onBlur={() => saveForm()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defect_warranty_rate">하자보증보율 (%)</Label>
            <Input
              id="defect_warranty_rate"
              type="number"
              step="0.01"
              min={0}
              value={defectRate}
              onChange={(e) => setDefectRate(e.target.value)}
              onBlur={() => saveForm()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="late_penalty_rate">지체상환율 (%/일)</Label>
            <Input
              id="late_penalty_rate"
              type="number"
              step="0.001"
              min={0}
              value={penaltyRate}
              onChange={(e) => setPenaltyRate(e.target.value)}
              onBlur={() => saveForm()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="late_penalty_cap_rate">지체상환 상한율 (%)</Label>
            <Input
              id="late_penalty_cap_rate"
              type="number"
              step="0.01"
              min={0}
              value={penaltyCapRate}
              onChange={(e) => setPenaltyCapRate(e.target.value)}
              onBlur={() => saveForm()}
            />
          </div>
        </div>
      </details>

      {/* 비고/특기사항 */}
      <div className="space-y-2">
        <Label htmlFor="period_note">공기 관련 특기사항</Label>
        <textarea
          id="period_note"
          value={periodNote}
          onChange={(e) => setPeriodNote(e.target.value)}
          onBlur={() => saveForm()}
          rows={2}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="special_conditions">계약 특이사항</Label>
        <textarea
          id="special_conditions"
          value={specialConditions}
          onChange={(e) => setSpecialConditions(e.target.value)}
          onBlur={() => saveForm()}
          rows={2}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">내용/사유</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => saveForm()}
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

      {/* 등록 버튼 (create 모드에서만) */}
      {!isEdit && (
        <div className="flex justify-end gap-2">
          <Button type="submit">등록</Button>
        </div>
      )}
    </form>
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
