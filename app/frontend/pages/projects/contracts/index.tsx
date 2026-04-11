import { Head } from "@inertiajs/react"
import {
  ChevronDown,
  Download,
  FileText,
  ImageIcon,
  Pencil,
  Plus,
} from "lucide-react"
import { useState } from "react"

import { ContractForm } from "@/components/contracts/contract-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import AppLayout from "@/layouts/app-layout"
import ProjectLayout from "@/layouts/project/project-layout"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  contractPath,
  projectContractsPath,
  projectPath,
  projectsPath,
} from "@/routes"
import type {
  BreadcrumbItem,
  Company,
  ContractFileProps,
  ContractProps,
  ProjectDetail,
  ProjectFormData,
  StatusOption,
} from "@/types"

interface Props {
  project: ProjectDetail
  form_data: ProjectFormData
  clients: Company[]
  managers: { id: number; name: string }[]
  statuses: StatusOption[]
  contracts: ContractProps[]
}

// --- 유틸 ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function FileIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className="size-4" />
  }
  return <FileText className="size-4" />
}

// --- 섹션 헤더 ---

function SectionHeader({
  title,
  collapsible = false,
  open,
}: {
  title: string
  collapsible?: boolean
  open?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {collapsible && (
        <ChevronDown
          className={`text-muted-foreground size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      )}
    </div>
  )
}

// --- 페이지 ---

export default function ContractsIndex({
  project,
  form_data,
  clients,
  managers,
  statuses,
  contracts,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "프로젝트", href: projectsPath() },
    { title: project.project_name, href: projectPath(project.id) },
    { title: "도급계약", href: projectContractsPath(project.id) },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${project.project_name} - 도급계약`} />

      <ProjectLayout
        project={project}
        activeTab="contracts"
        formData={form_data}
        clients={clients}
        managers={managers}
        statuses={statuses}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">도급계약</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" />
                  계약 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>계약 등록</DialogTitle>
                </DialogHeader>
                <ContractForm
                  action={projectContractsPath(project.id)}
                  method="post"
                />
              </DialogContent>
            </Dialog>
          </div>

          {contracts.length === 0 && (
            <div className="text-muted-foreground rounded-lg border p-8 text-center text-sm">
              등록된 계약이 없습니다.
            </div>
          )}

          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      </ProjectLayout>
    </AppLayout>
  )
}

// --- 계약 카드 ---

function ContractCard({ contract }: { contract: ContractProps }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {contract.type_label} — {contract.contract_code}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>계약일: {formatDate(contract.contract_date)}</span>
              <span>|</span>
              <span className="text-foreground font-medium">
                {formatCurrency(contract.contract_amount)}원
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              수정
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ① 계약금액 */}
        <AmountSection contract={contract} />

        {/* ② 결제조건 */}
        <CollapsibleSection title="결제조건" defaultOpen>
          {contract.contract_payment_terms.length > 0 ? (
            <PaymentTermsTable contract={contract} />
          ) : (
            <p className="text-muted-foreground text-sm">
              등록된 결제조건이 없습니다.
            </p>
          )}
        </CollapsibleSection>

        {/* ③ 계약조건 */}
        <ConditionsSection contract={contract} />

        {/* ④ 비고/특기사항 */}
        <NotesSection contract={contract} />

        {/* ⑤ 첨부파일 */}
        {contract.contract_files.length > 0 && (
          <FilesSection files={contract.contract_files} />
        )}

        {/* ⑥ 내역항목 */}
        <CollapsibleSection
          title="내역항목"
          defaultOpen={contract.contract_items.length <= 10}
        >
          <ContractItemsTable contract={contract} />
        </CollapsibleSection>
      </CardContent>

      {/* 수정 Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>계약 수정</SheetTitle>
            <SheetDescription>
              {contract.type_label} — {contract.contract_code}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ContractForm
              action={contractPath(contract.id)}
              method="patch"
              defaultValues={{
                id: contract.id,
                contract_code: contract.contract_code,
                contract_type: contract.contract_type,
                change_seq: contract.change_seq,
                contract_date: contract.contract_date,
                supply_amount: contract.supply_amount,
                vat_amount: contract.vat_amount,
                description: contract.description ?? "",
                defect_liability_months: contract.defect_liability_months ?? "",
                defect_warranty_rate: contract.defect_warranty_rate ?? "",
                late_penalty_rate: contract.late_penalty_rate ?? "",
                late_penalty_cap_rate: contract.late_penalty_cap_rate ?? "",
                period_note: contract.period_note ?? "",
                special_conditions: contract.special_conditions ?? "",
                contract_files: contract.contract_files,
                contract_payment_terms: contract.contract_payment_terms,
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

// --- ① 기본정보 (금액) ---

function AmountSection({ contract }: { contract: ContractProps }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">계약금액</h4>
      <div className="bg-muted/30 rounded-md border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <AmountRow label="공급가액" amount={contract.supply_amount} />
            <AmountRow label="부가가치세" amount={contract.vat_amount} />
            <div className="border-t pt-1">
              <AmountRow
                label="총 계약금액"
                amount={contract.contract_amount}
                bold
              />
            </div>
          </div>
          {contract.change_amount != null && (
            <div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground text-sm">증감액</span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    contract.change_amount > 0
                      ? "text-blue-600 dark:text-blue-400"
                      : contract.change_amount < 0
                        ? "text-red-600 dark:text-red-400"
                        : ""
                  }`}
                >
                  {contract.change_amount > 0 ? "+" : ""}
                  {formatCurrency(contract.change_amount)}원
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AmountRow({
  label,
  amount,
  bold = false,
}: {
  label: string
  amount: number
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={`tabular-nums ${bold ? "text-base font-semibold" : "text-sm"}`}
      >
        {formatCurrency(amount)}원
      </span>
    </div>
  )
}

// --- ② 계약조건 ---

function ConditionsSection({ contract }: { contract: ContractProps }) {
  const hasData =
    contract.defect_liability_months != null ||
    contract.defect_warranty_rate != null ||
    contract.late_penalty_rate != null ||
    contract.late_penalty_cap_rate != null

  if (!hasData) return null

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">계약조건</h4>
      <div className="bg-muted/30 rounded-md border p-4">
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <InfoRow
            label="하자책임기간"
            value={
              contract.defect_liability_months != null
                ? `${contract.defect_liability_months}개월`
                : undefined
            }
          />
          <InfoRow
            label="하자보증보율"
            value={
              contract.defect_warranty_rate != null
                ? `${contract.defect_warranty_rate}%`
                : undefined
            }
          />
          {contract.defect_warranty_amount != null && (
            <InfoRow
              label="하자보증금액"
              value={`${formatCurrency(contract.defect_warranty_amount)}원`}
            />
          )}
          <InfoRow
            label="지체상환율"
            value={
              contract.late_penalty_rate != null
                ? `${contract.late_penalty_rate}%/일`
                : undefined
            }
          />
          <InfoRow
            label="지체상환 상한율"
            value={
              contract.late_penalty_cap_rate != null
                ? `${contract.late_penalty_cap_rate}%`
                : undefined
            }
          />
          {contract.max_late_penalty != null && (
            <InfoRow
              label="최대 지체상환금"
              value={`${formatCurrency(contract.max_late_penalty)}원`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | undefined
}) {
  if (value == null) return null
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm tabular-nums">{value}</span>
    </div>
  )
}

// --- ③ 결제조건 테이블 ---

function PaymentTermsTable({ contract }: { contract: ContractProps }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-muted-foreground h-9 px-3 text-left text-xs font-medium">
              구분
            </th>
            <th className="text-muted-foreground h-9 px-3 text-right text-xs font-medium">
              비율
            </th>
            <th className="text-muted-foreground h-9 px-3 text-right text-xs font-medium">
              금액
            </th>
            <th className="text-muted-foreground h-9 px-3 text-left text-xs font-medium">
              지급조건
            </th>
            <th className="text-muted-foreground h-9 px-3 text-center text-xs font-medium">
              지급예정일
            </th>
            <th className="text-muted-foreground h-9 px-3 text-center text-xs font-medium">
              지급완료일
            </th>
          </tr>
        </thead>
        <tbody>
          {contract.contract_payment_terms.map((term) => (
            <tr key={term.id} className="border-b last:border-b-0">
              <td className="px-3 py-2 text-sm font-medium">
                {term.display_label}
              </td>
              <td className="px-3 py-2 text-right text-sm tabular-nums">
                {term.rate != null ? `${term.rate}%` : "—"}
              </td>
              <td className="px-3 py-2 text-right text-sm tabular-nums">
                {term.amount != null ? `${formatCurrency(term.amount)}원` : "—"}
              </td>
              <td className="text-muted-foreground px-3 py-2 text-sm">
                {term.condition ?? "—"}
              </td>
              <td className="px-3 py-2 text-center text-sm">
                {term.due_date ? formatDate(term.due_date) : "—"}
              </td>
              <td className="px-3 py-2 text-center text-sm">
                {term.paid_date ? (
                  <span className="text-green-600 dark:text-green-400">
                    {formatDate(term.paid_date)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- ④ 내역항목 테이블 ---

function ContractItemsTable({ contract }: { contract: ContractProps }) {
  return (
    <>
      {contract.amount_mismatch && (
        <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          ⚠ 내역 합계 ({formatCurrency(contract.details_total)}원)가 계약금액과
          일치하지 않습니다.
        </div>
      )}

      {contract.contract_items.length > 0 ? (
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
              {contract.contract_items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="px-3 py-2 text-sm">{item.work_type_name}</td>
                  <td className="px-3 py-2 text-sm">{item.item_name}</td>
                  <td className="px-3 py-2 text-center text-sm">{item.unit}</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">
                    {item.unit_price != null
                      ? formatCurrency(item.unit_price)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                    {formatCurrency(item.amount)}
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
        <p className="text-muted-foreground text-sm">등록된 내역이 없습니다.</p>
      )}
    </>
  )
}

// --- ⑤ 첨부파일 ---

function FilesSection({ files }: { files: ContractFileProps[] }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">첨부파일</h4>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <FileIcon contentType={file.content_type} />
              <span className="text-sm">{file.filename}</span>
              <span className="text-muted-foreground text-xs">
                ({formatFileSize(file.byte_size)})
              </span>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="size-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- 비고/특기사항 ---

function NotesSection({ contract }: { contract: ContractProps }) {
  const hasNotes =
    contract.period_note ?? contract.special_conditions ?? contract.description

  if (!hasNotes) return null

  return (
    <div className="space-y-3">
      {contract.period_note && (
        <NoteBlock title="공기 관련 특기사항" text={contract.period_note} />
      )}
      {contract.special_conditions && (
        <NoteBlock title="계약 특이사항" text={contract.special_conditions} />
      )}
      {contract.description && (
        <NoteBlock title="내용/사유" text={contract.description} />
      )}
    </div>
  )
}

function NoteBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="mb-1 text-sm font-medium">{title}</h4>
      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
        {text}
      </p>
    </div>
  )
}

// --- Collapsible 래퍼 ---

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="hover:bg-muted/50 -mx-1 mb-2 flex w-[calc(100%+0.5rem)] cursor-pointer items-center gap-2 rounded-md px-1 py-1"
        >
          <SectionHeader title={title} collapsible open={open} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
