import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles, Play, RotateCcw, FileUp, Send, Users, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AttendeeInput, type Attendee } from "@/components/attendee-input";
import { ProjectAttendeePicker } from "@/components/project-attendee-picker";
import { ExtractionProgress } from "@/components/extraction-progress";
import { TaskCard } from "@/components/task-card";
import { extractTasks, type ExtractedTask, type ExtractResult } from "@/lib/claude";
import { DEMO_ATTENDEES, DEMO_TRANSCRIPT } from "@/lib/demo";
import {
  activateAgent,
  deriveProjectName,
  fetchProjectWithTasks,
  updateTaskRow,
} from "@/lib/handoff-data";

export const Route = createFileRoute("/projects/$projectId/extract")({
  component: ExtractPage,
});

function ExtractPage() {
  const { projectId } = Route.useParams();
  const isNew = projectId === "new";
  const navigate = useNavigate();
  const [attendees, setAttendees] = React.useState<Attendee[]>([]);
  const [transcript, setTranscript] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activating, setActivating] = React.useState(false);
  const [result, setResult] = React.useState<ExtractResult | null>(null);
  const [persisted, setPersisted] = React.useState(false);

  React.useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    fetchProjectWithTasks(projectId)
      .then((res) => {
        if (cancelled || !res) return;
        setResult(res.result);
        setPersisted(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId, isNew]);

  const onExtract = async () => {
    if (!transcript.trim()) {
      toast.error("Paste a transcript first.");
      return;
    }
    if (attendees.length === 0) {
      toast.error("Add at least one attendee — Claude needs names + emails to assign owners.");
      return;
    }
    setLoading(true);
    setResult(null);
    setPersisted(false);
    try {
      const r = await extractTasks({ data: { transcript, attendees } });
      setResult(r);
      toast.success(`Extracted ${r.tasks.length} task${r.tasks.length === 1 ? "" : "s"}.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onLoadDemo = () => {
    setAttendees(DEMO_ATTENDEES);
    setTranscript(DEMO_TRANSCRIPT);
    setResult(null);
    setPersisted(false);
    toast.success("Demo loaded — click Extract tasks to run Claude.");
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      toast.error("Upload a .txt file. (.docx parsing comes later.)");
      return;
    }
    const text = await file.text();
    setTranscript(text);
    toast.success(`Loaded ${file.name}.`);
  };

  const reset = () => {
    setResult(null);
    setTranscript("");
    setAttendees([]);
  };

  const updateTask = (id: string, next: ExtractedTask) => {
    setResult((r) =>
      r ? { ...r, tasks: r.tasks.map((t) => (t.id === id ? next : t)) } : r,
    );
    if (persisted) {
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
    }
  };

  const onActivate = async () => {
    if (!result || result.tasks.length === 0) return;
    if (persisted && !isNew) {
      navigate({ to: "/projects/$projectId/agent", params: { projectId } });
      return;
    }
    setActivating(true);
    try {
      const created = await activateAgent({
        projectName: deriveProjectName(result.summary, result.tasks),
        summary: result.summary,
        tasks: result.tasks,
      });
      setPersisted(true);
      const owners = new Set(result.tasks.map((t) => t.owner_email)).size;
      toast.success(`Agent activated — ${result.tasks.length} tasks saved, ${owners} owners.`);
      navigate({
        to: "/projects/$projectId/agent",
        params: { projectId: created.id },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to activate agent.";
      toast.error(msg);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          extract / {isNew ? "new meeting" : "project"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          End the meeting.{" "}
          <span className="text-primary">Hand off the work.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Paste a transcript, confirm who was in the room, and Handoff turns talk
          into a tracked, owned task list — then chases each one to done.
        </p>
      </header>

      <section className="space-y-6">
        <Field label="01 / Attendees" hint="Select who attended — Claude assigns tasks to these people.">
          <ProjectAttendeePicker projectId={projectId} value={attendees} onChange={setAttendees} />
        </Field>

        <Field
          label="02 / Transcript"
          hint="Otter, Teams, Zoom, raw notes — anything readable."
          right={
            <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
              <FileUp className="size-3" />
              upload .txt
              <input
                type="file"
                accept=".txt,.md"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          }
        >
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste transcript here — Otter, Teams, manual notes."
            className="min-h-[220px] resize-y border-border bg-background/40 font-mono text-sm leading-relaxed"
          />
          <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{transcript.length.toLocaleString()} chars</span>
            <span>~{Math.max(1, Math.round(transcript.split(/\s+/).filter(Boolean).length))} words</span>
          </div>
        </Field>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            onClick={onExtract}
            disabled={loading}
            className="bg-primary font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-3.5" />
            {loading ? "Extracting" : "Extract tasks"}
          </Button>
          <Button
            variant="ghost"
            onClick={onLoadDemo}
            disabled={loading}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Play className="size-3.5" />
            Load demo
          </Button>
          {(result || transcript) && !loading && (
            <Button
              variant="ghost"
              onClick={reset}
              className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </section>

      {loading && (
        <section className="mt-10">
          <ExtractionProgress />
        </section>
      )}

      {result && !loading && (
        <ResultSection
          result={result}
          attendees={attendees}
          persisted={persisted}
          activating={activating}
          onUpdateTask={updateTask}
          onActivate={onActivate}
          onNew={reset}
        />
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  right,
  children,
}: {
  label: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </label>
        {right}
      </div>
      {children}
      {hint && <p className="sr-only">{hint}</p>}
    </div>
  );
}

function ResultSection({
  result,
  attendees,
  persisted,
  activating,
  onUpdateTask,
  onActivate,
  onNew,
}: {
  result: ExtractResult;
  attendees: Attendee[];
  persisted: boolean;
  activating: boolean;
  onUpdateTask: (id: string, next: ExtractedTask) => void;
  onActivate: () => void;
  onNew: () => void;
}) {
  const totalTasks = result.tasks.length;
  const owners = new Set(result.tasks.map((t) => t.owner_email)).size;
  const high = result.tasks.filter((t) => t.priority === "HIGH").length;

  const clusters = React.useMemo(() => {
    const map = new Map<string, ExtractedTask[]>();
    for (const t of result.tasks) {
      const k = t.cluster || "Other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return Array.from(map.entries());
  }, [result.tasks]);

  const effectiveAttendees = attendees.length ? attendees : DEMO_ATTENDEES;

  return (
    <section className="mt-10 space-y-6">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
        <Stat label="Tasks" value={totalTasks} />
        <Stat label="Owners" value={owners} icon={<Users className="size-3" />} />
        <Stat
          label="High priority"
          value={high}
          icon={<AlertTriangle className="size-3" />}
          accent={high > 0}
        />
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{result.summary}</p>
      </div>

      <div className="space-y-8">
        {clusters.map(([cluster, tasks]) => (
          <div key={cluster}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                {cluster}
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {tasks.length} task{tasks.length === 1 ? "" : "s"}
              </span>
              <div className="ml-2 h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  attendees={effectiveAttendees}
                  onChange={(next) => onUpdateTask(t.id, next)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/95 p-3 backdrop-blur">
        <Button
          onClick={onActivate}
          disabled={activating}
          className="bg-primary font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
          <Send className="size-3.5" />
          {persisted ? "Open agent" : activating ? "Activating" : "Activate agent"}
        </Button>
        <Button
          variant="ghost"
          onClick={onNew}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          New meeting
        </Button>
        <p className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
          {totalTasks} tasks → {owners} owners → kickoff emails on activate
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
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
