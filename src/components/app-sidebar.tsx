import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  Activity,
  BarChart3,
  Users,
  FolderOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const topItems = [
  { title: "Team", url: "/" as const, icon: Users },
  { title: "Projects", url: "/projects" as const, icon: FolderOpen },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Match /projects/:projectId/... (but not /projects itself, and not /projects/new creation flow)
  const projectMatch = path.match(/^\/projects\/([^/]+)(?:\/|$)/);
  const rawPid = projectMatch?.[1];
  const inProject = !!projectMatch && rawPid !== "new";
  const pid = inProject ? (rawPid as string) : "";
  const projectItems: Array<{
    title: string;
    key: "extract" | "agent" | "report";
    icon: typeof FileText;
  }> = inProject
    ? [
        { title: "Extract", key: "extract", icon: FileText },
        { title: "Agent", key: "agent", icon: Activity },
        { title: "Report", key: "report", icon: BarChart3 },
      ]
    : [];

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-sm bg-primary" />
          <span className="text-base font-semibold tracking-tight">Handoff</span>
        </Link>
        <p className="text-xs text-muted-foreground">Meeting accountability</p>
      </SidebarHeader>

      <SidebarContent>
        {!inProject ? (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.18em]">
              workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {topItems.map((item) => {
                  const active =
                    item.url === "/"
                      ? path === "/"
                      : path === item.url || path.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="font-mono text-sm"
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          {active && (
                            <span className="ml-auto inline-block size-1.5 rounded-full bg-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="font-mono text-xs text-muted-foreground"
                    >
                      <Link to="/projects" className="flex items-center gap-3">
                        <FolderOpen className="size-4" />
                        <span>← All projects</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.18em]">
                project
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projectItems.map((item) => {
                    const url = `/projects/${pid}/${item.key}`;
                    const active = path === url;
                    const to =
                      item.key === "extract"
                        ? "/projects/$projectId/extract"
                        : item.key === "agent"
                          ? "/projects/$projectId/agent"
                          : "/projects/$projectId/report";
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="font-mono text-sm"
                        >
                          <Link
                            to={to}
                            params={{ projectId: pid }}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                            {active && (
                              <span className="ml-auto inline-block size-1.5 rounded-full bg-primary" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
