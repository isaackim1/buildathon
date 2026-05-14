import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Attendee } from "@/components/attendee-input";

type Member = { id: string; name: string; email: string };

export function ProjectAttendeePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: Attendee[];
  onChange: (next: Attendee[]) => void;
}) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const isNew = projectId === "new";

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (isNew) {
          const { data, error } = await supabase
            .from("members")
            .select("id, name, email")
            .order("name");
          if (error) throw error;
          if (!cancelled) setMembers((data ?? []) as Member[]);
          return;
        }

        const { data: pm, error: pmErr } = await supabase
          .from("project_members")
          .select("member_id")
          .eq("project_id", projectId);
        if (pmErr) throw pmErr;
        const ids = (pm ?? []).map((r) => r.member_id);
        if (ids.length === 0) {
          if (!cancelled) setMembers([]);
          return;
        }
        const { data, error } = await supabase
          .from("members")
          .select("id, name, email")
          .in("id", ids)
          .order("name");
        if (error) throw error;
        if (!cancelled) setMembers((data ?? []) as Member[]);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, isNew]);

  const selected = React.useMemo(
    () => new Set(value.map((a) => a.email.toLowerCase())),
    [value],
  );

  const toggle = (m: Member) => {
    const key = m.email.toLowerCase();
    if (selected.has(key)) {
      onChange(value.filter((a) => a.email.toLowerCase() !== key));
    } else {
      onChange([...value, { name: m.name, email: m.email }]);
    }
  };

  if (loading) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        loading members…
      </p>
    );
  }

  if (error) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">
        {error}
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {isNew
          ? "No members in workspace yet. Add some in Team."
          : "No members assigned to this project."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const isOn = selected.has(m.email.toLowerCase());
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-left transition-colors",
              isOn
                ? "border-primary bg-primary/10"
                : "border-border bg-background/40 hover:border-ring",
            )}
          >
            <Checkbox checked={isOn} tabIndex={-1} className="pointer-events-none" />
            <span className="font-mono text-xs">
              <span className="text-foreground">{m.name}</span>
              <span className="ml-1.5 text-muted-foreground">{m.email}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
