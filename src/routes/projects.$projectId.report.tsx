import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Inbox } from "lucide-react";
import {
  fetchProjectWithTasks,
  type DbProject,
} from "@/lib/handoff-data";
import type { ExtractResult } from "@/lib/claude";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId/report")({
  component: ReportPage,
});

function ReportPage() {
  const { projectId } = Route.useParams();
  const [loading, setLoading] = React.useState(true);
  const [project, setProject] = React.useState<DbProject | null>(null);
  const [result, setResult] = React.useState<ExtractResult | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchProjectWithTasks(projectId)
      .then((res) => {
        if (cancelled) return;
        if (res) {
          setProject(res.project);
          setResult(res.result);
        }
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to load report.";
        toast.error(msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const tasks = result?.tasks ?? [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.state === "done").length;
  const blocked = tasks.filter((t) => t.state === "blocked").length;
  const inProgress = tasks.filter((t) => t.state === "in_progress").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const byOwner = React.useMemo(() => {
    const m = new Map<string, { name: string; total: number; done: number }>();
    for (const t of tasks) {
      const key = t.owner_email || t.owner_name;
      const cur = m.get(key) ?? { name: t.owner_name, total: 0, done: 0 };
      cur.total += 1;
      if (t.state === "done") cur.done += 1;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
      <header className="mb-8">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <BarChart3 className="size-3" /> report
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {project ? project.name : "No active project"}
        </h1>
      </header>

      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          loading…
        </div>
      ) : !project || total === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
          <Inbox className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            nothing to report yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground/80">
            Activate the agent from{" "}
            <Link
              to="/projects/$projectId/extract"
              params={{ projectId }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Extract
            </Link>{" "}
            to start tracking completion.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border">
            <Stat label="Completion" value={`${pct}%`} />
            <Stat label="Done" value={String(done)} />
            <Stat label="In progress" value={String(inProgress)} />
            <Stat label="Blocked" value={String(blocked)} accent={blocked > 0} />
          </div>

          <div>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-foreground">
              By owner
            </h2>
            <div className="space-y-2">
              {byOwner.map((o) => {
                const ownerPct = o.total ? Math.round((o.done / o.total) * 100) : 0;
                return (
                  <div
                    key={o.name}
                    className="rounded-md border border-border bg-card p-4"
                  >
                    <div className="flex items-baseline justify-between font-mono text-xs">
                      <span className="text-foreground">{o.name}</span>
                      <span className="text-muted-foreground">
                        {o.done} / {o.total} · {ownerPct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${ownerPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${
          accent ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
