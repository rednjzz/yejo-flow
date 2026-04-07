import type { ProjectStatus } from "@/types"

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  preparing: "준비중",
  in_progress: "진행중",
  completed: "준공",
  defect_period: "하자보수",
  closed: "종료",
}

export const STATUS_BADGE_VARIANTS: Record<ProjectStatus, string> = {
  preparing: "outline",
  in_progress: "default",
  completed: "secondary",
  defect_period: "destructive",
  closed: "outline",
}

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status]
}

export function statusBadgeVariant(status: ProjectStatus): string {
  return STATUS_BADGE_VARIANTS[status]
}
