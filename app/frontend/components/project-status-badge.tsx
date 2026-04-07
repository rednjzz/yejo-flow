import { Badge } from "@/components/ui/badge"
import type { ProjectStatus } from "@/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const STATUS_VARIANT_MAP: Record<ProjectStatus, BadgeVariant> = {
  preparing: "outline",
  in_progress: "default",
  completed: "secondary",
  defect_period: "destructive",
  closed: "outline",
}

const STATUS_LABEL_MAP: Record<ProjectStatus, string> = {
  preparing: "준비중",
  in_progress: "진행중",
  completed: "준공",
  defect_period: "하자보수",
  closed: "종료",
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant={STATUS_VARIANT_MAP[status]}>
      {STATUS_LABEL_MAP[status]}
    </Badge>
  )
}
