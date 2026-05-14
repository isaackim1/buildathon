import * as React from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { fetchProjectById, type DbProject } from "@/lib/handoff-data";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const [project, setProject] = React.useState<DbProject | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isNew = projectId === "new";

  React.useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    fetchProjectById(projectId)
      .then((p) => !cancelled && setProject(p))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load project"),
      );
    return () => {
      cancelled = true;
    };
  }, [projectId, isNew]);

  const onParent = path === `/projects/${projectId}`;

  if (onParent) {
    return (
      <Navigate
        to="/projects/$projectId/extract"
        params={{ projectId }}
        replace
      />
    );
  }

  return (
    <div>
      <div className="border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center gap-2 text-xs">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Projects
          </Link>
          <ChevronRight className="size-3 text-muted-foreground" />
          <span className="truncate font-medium text-foreground">
            {isNew ? "New project" : project?.name ?? "…"}
          </span>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
