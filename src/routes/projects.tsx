import * as React from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchProjects, type DbProject } from "@/lib/handoff-data";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  // If we're on a child route (/projects/<something>), render the child.
  if (path !== "/projects" && path !== "/projects/") {
    return <Outlet />;
  }
  return <ProjectsPage />;
}

function ProjectsPage() {
  const [projects, setProjects] = React.useState<DbProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((p) => !cancelled && setProjects(p))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load projects"),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <FolderOpen className="size-3" /> projects
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Each meeting becomes a project. Open one to extract tasks, supervise
            the agent, and view reports.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="size-4" />
            New project
          </Link>
        </Button>
      </header>

      <section className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No projects yet. Start one from a meeting transcript.
            </p>
            <Button asChild className="mt-4">
              <Link to="/projects/new">
                <Plus className="size-4" />
                New project
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  to="/projects/$projectId/extract"
                  params={{ projectId: p.id }}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="col-span-5 truncate font-medium text-foreground">
                    {p.name}
                  </div>
                  <div className="col-span-5 truncate text-muted-foreground">
                    {p.summary || "—"}
                  </div>
                  <div className="col-span-2 text-right text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
