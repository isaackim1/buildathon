import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reply/$token")({
  component: ReplyPage,
});

type Task = {
  id: string;
  task_text: string;
  deadline: string | null;
  priority: string;
  state: string;
};

type Loaded = {
  tokenId: string;
  ownerName: string;
  ownerEmail: string;
  projectId: string;
  tasks: Task[];
};

type Selection = "done" | "in_progress" | "blocked";

const COLORS = {
  bg: "#ffffff",
  accent: "#00704a",
  hover: "#1e3932",
  text: "#1a1a1a",
  border: "#e5e7eb",
  muted: "#6b7280",
  card: "#fafafa",
};

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    HIGH: "#c2410c",
    MEDIUM: "#a16207",
    LOW: "#475569",
  };
  return (
    <span
      style={{
        background: map[p] ?? "#475569",
        color: "#fff",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {p}
    </span>
  );
}

function ReplyPage() {
  const { token } = Route.useParams();
  const [status, setStatus] = React.useState<"loading" | "expired" | "ready" | "saved">("loading");
  const [data, setData] = React.useState<Loaded | null>(null);
  const [picks, setPicks] = React.useState<Record<string, Selection>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: tokenRow, error: tErr } = await supabase
          .from("reply_tokens")
          .select("id,task_id,owner_email,expires_at,used")
          .filter("token", "eq", token)
          .maybeSingle();
        if (tErr) throw tErr;
        if (!tokenRow || !tokenRow.owner_email || !tokenRow.task_id) {
          if (!cancelled) setStatus("expired");
          return;
        }
        if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
          if (!cancelled) setStatus("expired");
          return;
        }

        // Find project via the task this token points to
        const { data: anchorTask } = await supabase
          .from("tasks")
          .select("project_id, owner_name")
          .eq("id", tokenRow.task_id)
          .maybeSingle();
        if (!anchorTask) {
          if (!cancelled) setStatus("expired");
          return;
        }

        const { data: tasks, error: tasksErr } = await supabase
          .from("tasks")
          .select("id,task_text,deadline,priority,state")
          .eq("project_id", anchorTask.project_id)
          .eq("owner_email", tokenRow.owner_email);
        if (tasksErr) throw tasksErr;

        if (cancelled) return;
        setData({
          tokenId: tokenRow.id,
          ownerName: anchorTask.owner_name ?? tokenRow.owner_email,
          ownerEmail: tokenRow.owner_email,
          projectId: anchorTask.project_id,
          tasks: (tasks ?? []) as Task[],
        });
        setStatus("ready");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("expired");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit() {
    if (!data || submitting) return;
    setSubmitting(true);
    try {
      await Promise.all(
        Object.entries(picks).map(([taskId, state]) =>
          supabase.from("tasks").update({ state }).eq("id", taskId),
        ),
      );
      await supabase.from("reply_tokens").update({ used: true }).eq("id", data.tokenId);
      setStatus("saved");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const baseStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.text,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  };

  if (status === "loading") {
    return (
      <div style={{ ...baseStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ color: COLORS.muted }}>Loading…</div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div style={{ ...baseStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            Handoff
          </div>
          <p style={{ fontSize: 16 }}>This link has expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const firstName = data ? data.ownerName.split(" ")[0] : "";

  if (status === "saved") {
    return (
      <div style={{ ...baseStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 28, marginBottom: 12 }}>
            Handoff
          </div>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>
            Thanks {firstName}, your updates have been saved.
          </p>
        </div>
      </div>
    );
  }

  const allPicked = data ? data.tasks.every((t) => picks[t.id]) : false;

  return (
    <div style={{ ...baseStyle, paddingBottom: 120 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
          Handoff
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 24px" }}>
          Hey {firstName}, here are your tasks
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data?.tasks.map((t) => (
            <div
              key={t.id}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 18,
                background: COLORS.card,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t.task_text}</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 13,
                  color: COLORS.muted,
                  marginBottom: 14,
                }}
              >
                <span>Deadline: {t.deadline || "not set"}</span>
                <span>•</span>
                {priorityBadge(t.priority)}
              </div>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {(["done", "in_progress", "blocked"] as Selection[]).map((opt) => {
                  const checked = picks[t.id] === opt;
                  const label =
                    opt === "done" ? "Done" : opt === "in_progress" ? "In Progress" : "Blocked";
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        fontSize: 14,
                        color: checked ? COLORS.accent : COLORS.text,
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      <input
                        type="radio"
                        name={`task-${t.id}`}
                        checked={checked}
                        onChange={() => setPicks((p) => ({ ...p, [t.id]: opt }))}
                        style={{ accentColor: COLORS.accent }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={!allPicked || submitting}
          style={{
            marginTop: 28,
            background: COLORS.accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: !allPicked || submitting ? "not-allowed" : "pointer",
            opacity: !allPicked || submitting ? 0.5 : 1,
            width: "100%",
          }}
          onMouseOver={(e) => {
            if (allPicked && !submitting) e.currentTarget.style.background = COLORS.hover;
          }}
          onMouseOut={(e) => (e.currentTarget.style.background = COLORS.accent)}
        >
          {submitting ? "Saving…" : "Submit updates"}
        </button>
      </div>
    </div>
  );
}
