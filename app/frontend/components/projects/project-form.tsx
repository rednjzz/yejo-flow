import { router } from "@inertiajs/react"
import { Check, Loader2 } from "lucide-react"
import { useCallback, useRef, useState } from "react"

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

type SaveStatus = "idle" | "saving" | "saved" | "error"

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
  const isEdit = method === "patch"
  const currentStatus = defaultValues?.status ?? "preparing"

  const [formData, setFormData] = useState({
    project_name: defaultValues?.project_name ?? "",
    client_id: defaultValues?.client_id?.toString() ?? "",
    site_address: defaultValues?.site_address ?? "",
    start_date: defaultValues?.start_date ?? "",
    end_date: defaultValues?.end_date ?? "",
    manager_id: defaultValues?.manager_id?.toString() ?? "",
    status: currentStatus,
    notes: defaultValues?.notes ?? "",
  })

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const formDataRef = useRef(formData)
  formDataRef.current = formData

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // blur 시 자동 저장 (edit 모드에서만)
  const saveForm = useCallback(
    (data?: typeof formData) => {
      if (!isEdit) return
      const current = data ?? formDataRef.current

      clearTimeout(savedTimerRef.current)
      setSaveStatus("saving")
      router.patch(
        action,
        {
          project: {
            project_name: current.project_name,
            client_id: current.client_id,
            site_address: current.site_address,
            start_date: current.start_date,
            end_date: current.end_date,
            manager_id: current.manager_id || null,
            status: current.status,
            notes: current.notes,
          },
        },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setSaveStatus("saved")
            setErrors({})
            savedTimerRef.current = setTimeout(
              () => setSaveStatus("idle"),
              2000,
            )
          },
          onError: (errs) => {
            setSaveStatus("error")
            setErrors(errs as Record<string, string[]>)
          },
        },
      )
    },
    [isEdit, action],
  )

  // Select 변경 시 즉시 저장 (blur 이벤트가 없으므로)
  const updateAndSave = useCallback(
    (field: string, value: string) => {
      const updated = { ...formDataRef.current, [field]: value }
      setFormData(updated)
      saveForm(updated)
    },
    [saveForm],
  )

  // 신규 등록 제출 (create 모드)
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      router.post(action, {
        project: {
          project_name: formData.project_name,
          client_id: formData.client_id,
          site_address: formData.site_address,
          start_date: formData.start_date,
          end_date: formData.end_date,
          manager_id: formData.manager_id || null,
          notes: formData.notes,
        },
      })
    },
    [action, formData],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 자동 저장 상태 표시 (edit 모드) */}
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
            value={formData.project_name}
            onChange={(e) => updateField("project_name", e.target.value)}
            onBlur={() => saveForm()}
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
            value={formData.client_id}
            onValueChange={(v) => updateAndSave("client_id", v)}
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
            value={formData.site_address}
            onChange={(e) => updateField("site_address", e.target.value)}
            onBlur={() => saveForm()}
          />
        </div>

        {/* 착공일 */}
        <div className="space-y-2">
          <Label htmlFor="start_date">
            착공일 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => updateField("start_date", e.target.value)}
            onBlur={() => saveForm()}
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
            type="date"
            value={formData.end_date}
            onChange={(e) => updateField("end_date", e.target.value)}
            onBlur={() => saveForm()}
            required
          />
          <InputError messages={errors?.end_date} />
        </div>

        {/* 현장소장 */}
        <div className="space-y-2">
          <Label htmlFor="manager_id">현장소장</Label>
          <Select
            value={formData.manager_id}
            onValueChange={(v) => updateAndSave("manager_id", v)}
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
            <Select
              value={formData.status}
              onValueChange={(v) => updateAndSave("status", v)}
            >
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
      </div>

      {/* 비고 */}
      <div className="space-y-2">
        <Label htmlFor="notes">비고</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          onBlur={() => saveForm()}
          rows={3}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
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
