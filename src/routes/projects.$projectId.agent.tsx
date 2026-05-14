import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Inbox, Send, Loader2, CheckCircle2 } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import {
  fetchProjectWithTasks,
  updateTaskRow,
  type DbProject,
} from "@/lib/handoff-data";
import { DEMO_ATTENDEES } from "@/lib/demo";
import type { ExtractedTask, ExtractResult } from "@/lib/claude";
import { supabase } from "@/integrations/supabase/client";
import { draftKickoffEmail, type KickoffDraft } from "@/lib/kickoff.functions";
import { sendKickoffEmail } from "@/lib/send-kickoff.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId/agent")({
  component: AgentPage,
});

function AgentPage() {
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
        const msg = e instanceof Error ? e.message : "Failed to load tasks.";
        toast.error(msg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const onChange = (id: string, next: ExtractedTask) => {
    setResult((r) =>
      r ? { ...r, tasks: r.tasks.map((t) => (t.id === id ? next : t)) } : r,
    );
    updateTaskRow(id, {
      task_text: next.task_text,
      owner_name: next.owner_name,
      owner_email: next.owner_email,
      deadline: next.deadline,
      priority: next.priority,
      state: next.state,
    }).catch((e) => {
      const msg = e instanceof Error ? e.message : "Failed to save change.";
      toast.error(msg);
    });
  };

  const [activating, setActivating] = React.useState(false);
  const [activated, setActivated] = React.useState(false);
  const [, setDrafts] = React.useState<Record<string, KickoffDraft>>({});
  const taskCount = result?.tasks.length ?? 0;

  const onActivate = async () => {
    if (!result || !project || taskCount === 0) return;
    setActivating(true);
    try {
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      // Group tasks by owner_email first to generate one token per owner
      const byOwner = new Map<
        string,
        { owner_name: string; owner_email: string; tasks: typeof result.tasks }
      >();
      for (const t of result.tasks) {
        const key = t.owner_email;
        const entry = byOwner.get(key) ?? {
          owner_name: t.owner_name,
          owner_email: t.owner_email,
          tasks: [],
        };
        entry.tasks.push(t);
        byOwner.set(key, entry);
      }

      const tokenRows = Array.from(byOwner.values()).map((entry) => ({
        task_id: entry.tasks[0].id,
        owner_email: entry.owner_email,
        action: "update",
        expires_at: expiresAt,
      }));
      const { data: inserted, error } = await supabase
        .from("reply_tokens")
        .insert(tokenRows)
        .select("owner_email, token");
      if (error) throw error;

      // Map owner_email -> token
      const tokenByOwner = new Map<string, string>();
      for (const row of inserted ?? []) {
        if (!row.owner_email || !row.token) continue;
        tokenByOwner.set(row.owner_email, row.token);
      }

      // Fetch project description
      const { data: projRow } = await supabase
        .from("projects")
        .select("description")
        .eq("id", project.id)
        .maybeSingle();
      const projectDescription = projRow?.description ?? "";

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const newDrafts: Record<string, KickoffDraft> = {};
      await Promise.all(
        Array.from(byOwner.values()).map(async (entry) => {
          const kickoffTasks = entry.tasks.map((t) => ({
            task_text: t.task_text,
            deadline: t.deadline,
            priority: t.priority,
          }));
          const token = tokenByOwner.get(entry.owner_email) ?? "";
          const updateUrl = `${origin}/reply/${token}`;
          try {
            const draft = await draftKickoffEmail({
              data: {
                owner_name: entry.owner_name,
                owner_email: entry.owner_email,
                project_name: project.name,
                project_description: projectDescription,
                update_url: updateUrl,
                tasks: kickoffTasks,
              },
            });
            newDrafts[entry.owner_email] = draft;
            console.log(
              `[kickoff draft] to: ${entry.owner_name} <${entry.owner_email}>\nSubject: ${draft.subject}\n\n${draft.body}`,
            );
          } catch (e) {
            console.error(`[kickoff draft failed] ${entry.owner_email}`, e);
            toast.error(
              `Draft failed for ${entry.owner_name}: ${e instanceof Error ? e.message : "unknown error"}`,
            );
          }
        }),
      );

      setDrafts(newDrafts);

      // Send each drafted email via Resend, then log + flip task state.
      let peopleSent = 0;
      let tasksCovered = 0;
      for (const entry of byOwner.values()) {
        const draft = newDrafts[entry.owner_email];
        if (!draft) continue;
        try {
          await sendKickoffEmail({
            data: {
              to: entry.owner_email,
              subject: draft.subject,
              body: draft.body,
            },
          });

          const firstTaskId = entry.tasks[0]?.id;
          if (firstTaskId) {
            await supabase.from("agent_log").insert({
              task_id: firstTaskId,
              direction: "outbound",
              message_type: "kickoff",
              content: draft.body,
              sent_at: new Date().toISOString(),
            });
          }

          const taskIds = entry.tasks.map((t) => t.id);
          await supabase
            .from("tasks")
            .update({ state: "in_progress" })
            .in("id", taskIds)
            .eq("project_id", project.id);

          // Reflect new state locally
          setResult((r) =>
            r
              ? {
                  ...r,
                  tasks: r.tasks.map((t) =>
                    taskIds.includes(t.id) ? { ...t, state: "in_progress" } : t,
                  ),
                }
              : r,
          );

          peopleSent += 1;
          tasksCovered += entry.tasks.length;
        } catch (e) {
          console.error(`[kickoff send failed] ${entry.owner_email}`, e);
          toast.error(
            `Send failed for ${entry.owner_name}: ${e instanceof Error ? e.message : "unknown error"}`,
          );
        }
      }

      setActivated(true);
      toast.success(
        `Kickoff emails sent to ${peopleSent} ${peopleSent === 1 ? "person" : "people"} covering ${tasksCovered} task${tasksCovered === 1 ? "" : "s"}.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate agent.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="relative">
    <div className="mx-auto w-full max-w-5xl px-6 py-10 pb-32 md:py-14 md:pb-32">
      <header className="mb-8">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Activity className="size-3" /> agent
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {project ? project.name : "No active project"}
        </h1>
        {project ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {taskCount} task{taskCount === 1 ? "" : "s"} under
            agent supervision. Edits here update the database immediately.
          </p>
        ) : (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Activate the agent on an extraction to see live task state here.
          </p>
        )}
      </header>

      {loading ? (
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          loading…
        </div>
      ) : !project || !result ? (
        <EmptyState projectId={projectId} />
      ) : (
        <div className="space-y-3">
          {result.tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              attendees={DEMO_ATTENDEES}
              onChange={(next) => onChange(t.id, next)}
            />
          ))}
        </div>
      )}
    </div>
    {project && result && taskCount > 0 && (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {activated
              ? `${taskCount} task${taskCount === 1 ? "" : "s"} activated — emails sending.`
              : `${taskCount} task${taskCount === 1 ? "" : "s"} ready for kickoff`}
          </p>
          <Button onClick={onActivate} disabled={activating || activated} size="lg">
            {activating ? (
              <><Loader2 className="size-4 animate-spin" /> Activating…</>
            ) : activated ? (
              <><CheckCircle2 className="size-4" /> Agent activated</>
            ) : (
              <><Send className="size-4" /> Activate agent — send kickoff emails</>
            )}
          </Button>
        </div>
      </div>
    )}
    </div>
  );
}

function EmptyState({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
      <Inbox className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        no tasks yet
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/80">
        Head to{" "}
        <Link
          to="/projects/$projectId/extract"
          params={{ projectId }}
          className="text-primary underline-offset-4 hover:underline"
        >
          Extract
        </Link>{" "}
        to pull tasks out of a transcript and activate the agent.
      </p>
    </div>
  );
}
