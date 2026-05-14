import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { FolderPlus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_WORKSPACE_ID } from "@/lib/handoff-data";

export const Route = createFileRoute("/projects/new")({
  component: NewProjectPage,
});

type Member = { id: string; name: string; email: string; role: string | null };

function NewProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [members, setMembers] = React.useState<Member[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loadingMembers, setLoadingMembers] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    supabase
      .from("members")
      .select("id,name,email,role")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error(error.message);
        } else {
          setMembers((data ?? []) as Member[]);
        }
        setLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setSubmitting(true);
    try {
      // Ensure workspace exists — reuse first row or create default
      const { data: wsRows, error: wsErr } = await supabase
        .from("workspaces")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);
      if (wsErr) throw wsErr;
      let workspaceId = wsRows?.[0]?.id as string | undefined;
      if (!workspaceId) {
        const { data: newWs, error: newWsErr } = await supabase
          .from("workspaces")
          .insert({ id: DEFAULT_WORKSPACE_ID, name: "Default Workspace", org_context: "" })
          .select("id")
          .single();
        if (newWsErr) throw newWsErr;
        workspaceId = newWs.id;
      }

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          description: description.trim(),
          status: "active",
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      const memberIds = Array.from(selected);
      if (memberIds.length > 0) {
        const rows = memberIds.map((member_id) => ({
          project_id: project.id,
          member_id,
        }));
        const { error: pmErr } = await supabase.from("project_members").insert(rows);
        if (pmErr) throw pmErr;
      }

      toast.success("Project created.");
      navigate({
        to: "/projects/$projectId/extract",
        params: { projectId: project.id },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create project.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-3xl items-center gap-2 text-xs">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Projects
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">New project</span>
        </nav>
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl px-6 py-10 md:py-14">
        <header className="mb-8">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <FolderPlus className="size-3" /> new project
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Create a project
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Give it a name, a quick description, and pick the members involved.
          </p>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Project name *
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q3 launch readiness"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="desc" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Description
            </label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about? Goals, constraints, deadline."
              className="min-h-[120px]"
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Members
            </label>
            <div className="rounded-md border border-border bg-card">
              {loadingMembers ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">Loading…</div>
              ) : members.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  No members yet. Add some in the Team view.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((m) => {
                    const checked = selected.has(m.id);
                    return (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(m.id)}
                          />
                          <span className="font-medium text-foreground">{m.name}</span>
                          <span className="text-muted-foreground">{m.email}</span>
                          {m.role && (
                            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {m.role}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {selected.size} selected
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create project"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link to="/projects">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
