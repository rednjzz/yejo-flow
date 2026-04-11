import type { LucideIcon } from "lucide-react"

export interface Auth {
  user: User
  session: Pick<Session, "id">
}

export interface BreadcrumbItem {
  title: string
  href: string
}

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon | null
  isActive?: boolean
}

export interface FlashData {
  alert?: string
  notice?: string
}

export interface SharedProps {
  auth: Auth
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  verified: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown // This allows for additional properties...
}

export interface Session {
  id: string
  user_agent: string
  ip_address: string
  created_at: string
}

// Project Management Types
export type ProjectStatus =
  | "preparing"
  | "in_progress"
  | "completed"
  | "defect_period"
  | "closed"

export interface ProjectListItem {
  id: number
  project_code: string
  project_name: string
  client_name: string
  contract_amount: number
  amount_in_billion: string
  start_date: string
  end_date: string
  formatted_period: string
  status: ProjectStatus
  status_label: string
  status_badge_variant: string
  billing_rate: number
  profit_rate: number | null
}

export interface ProjectDetail extends ProjectListItem {
  site_address: string | null
  vat_amount: number
  actual_end_date: string | null
  manager_id: number | null
  manager_name: string | null
  advance_rate: number | null
  advance_amount: number | null
  retention_rate: number | null
  notes: string | null
}

export interface ProjectFormData {
  id?: number
  project_code: string
  project_name: string
  client_id: number | null
  site_address: string
  contract_amount: number | string
  vat_amount: number
  start_date: string
  end_date: string
  status: ProjectStatus
  manager_id: number | null
  advance_rate: number | string
  advance_amount: number | string
  retention_rate: number | string
  notes: string
  allowed_transitions?: string[]
}

export interface Company {
  id: number
  company_name: string
}

export interface WorkType {
  id: number
  work_type_name: string
}

export interface StatusOption {
  value: string
  label: string
}

export interface ContractPaymentTermProps {
  id: number
  term_type: string
  display_label: string
  seq: number
  interim_method: string | null
  rate: number | null
  amount: number | null
  condition: string | null
  due_date: string | null
  paid_date: string | null
  paid_amount: number | null
  sort_order: number
}

export interface ContractFileProps {
  id: number
  filename: string
  byte_size: number
  content_type: string
  url: string
}

export interface ContractProps {
  id: number
  contract_no: string
  contract_type: string
  type_label: string
  change_seq: number | null
  contract_date: string
  contract_amount: number
  supply_amount: number
  vat_amount: number
  change_amount: number | null
  description: string | null
  defect_liability_months: number | null
  defect_warranty_rate: number | null
  defect_warranty_amount: number | null
  late_penalty_rate: number | null
  late_penalty_cap_rate: number | null
  max_late_penalty: number | null
  period_note: string | null
  special_conditions: string | null
  details_total: number
  amount_mismatch: boolean
  contract_payment_terms: ContractPaymentTermProps[]
  contract_files: ContractFileProps[]
  contract_items: ContractItemProps[]
}

export interface ContractItemProps {
  id: number
  work_type_id: number
  work_type_name: string
  item_name: string
  unit: string | null
  quantity: number | null
  unit_price: number | null
  amount: number
  sort_order: number
}

export interface ContractFormData {
  id?: number
  contract_no: string
  contract_type: string
  change_seq: number | null
  contract_date: string
  supply_amount: number | string
  vat_amount: number | string
  change_amount: number | string
  description: string
  defect_liability_months: number | string
  defect_warranty_rate: number | string
  late_penalty_rate: number | string
  late_penalty_cap_rate: number | string
  period_note: string
  special_conditions: string
  contract_files: ContractFileProps[]
}

export interface SidebarProject {
  id: number
  project_name: string
}
