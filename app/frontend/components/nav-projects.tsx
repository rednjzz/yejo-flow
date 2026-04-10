import { Link, usePage } from "@inertiajs/react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible"
import { Building2, ChevronRight } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { projectPath, projectsPath } from "@/routes"
import type { SidebarProject } from "@/types"

export function NavProjects({ projects }: { projects: SidebarProject[] }) {
  const page = usePage()
  const isActive = page.url.startsWith("/projects")

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>현장 관리</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible defaultOpen={isActive}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={{ children: "프로젝트" }}
              >
                <Building2 />
                <span>프로젝트</span>
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={
                      page.url === projectsPath() || page.url === "/projects"
                    }
                  >
                    <Link href={projectsPath()} prefetch>
                      전체 현장 목록
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                {projects.map((project) => (
                  <SidebarMenuSubItem key={project.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={page.url.startsWith(projectPath(project.id))}
                    >
                      <Link href={projectPath(project.id)} prefetch>
                        {project.project_name}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
