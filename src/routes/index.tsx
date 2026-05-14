import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: TeamPage,
});

type Member = {
  id: string;
  workspace_id: string | null;
  name: string;
  email: string;
  role: string | null;
  reports_to: string | null;
};

const NONE = "__none__";

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  role: z.string().trim().max(100).optional(),
  reports_to: z.string().uuid().nullable(),
});

async function getOrCreateWorkspaceId(): Promise<string> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data?.id) return data.id;
  const { data: created, error: cErr } = await supabase
    .from("workspaces")
    .insert({ name: "Default Workspace", org_context: "" })
    .select("id")
    .single();
  if (cErr || !created) throw cErr ?? new Error("Failed to create workspace");
  return created.id;
}

function TeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("");
  const [reportsTo, setReportsTo] = React.useState<string>(NONE);
  const [submitting, setSubmitting] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const load = React.useCallback(async (wsId: string) => {
    const { data, error } = await supabase
      .from("members")
      .select("id,workspace_id,name,email,role,reports_to")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setMembers((data ?? []) as Member[]);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const wsId = await getOrCreateWorkspaceId();
        if (cancelled) return;
        setWorkspaceId(wsId);
        await load(wsId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load team");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const memberNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const x of members) m.set(x.id, x.name);
    return m;
  }, [members]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    if (!workspaceId) return;

    const parsed = memberSchema.safeParse({
      name,
      email,
      role: role || undefined,
      reports_to: reportsTo === NONE ? null : reportsTo,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const exists = members.some(
      (m) => m.email.toLowerCase() === normalizedEmail,
    );
    if (exists) {
      setEmailError("A member with this email already exists.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("members").insert({
        workspace_id: workspaceId,
        name: parsed.data.name,
        email: normalizedEmail,
        role: parsed.data.role ?? null,
        reports_to: parsed.data.reports_to,
      });
      if (error) {
        if (/duplicate|unique/i.test(error.message)) {
          setEmailError("A member with this email already exists.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      setName("");
      setEmail("");
      setRole("");
      setReportsTo(NONE);
      await load(workspaceId);
      toast.success("Member added");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== id));
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      setMembers(prev);
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
      <header className="mb-8">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Users className="size-3" /> team
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Workspace members
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Add the people in your team so the agent knows who owns what and who
          to escalate to.
        </p>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Add member</h2>
        <form
          onSubmit={onSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Name</Label>
            <Input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sam de Vries"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-email">Email</Label>
            <Input
              id="m-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="sam@company.nl"
              required
              maxLength={255}
              aria-invalid={!!emailError}
            />
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-role">Role</Label>
            <Input
              id="m-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Designer"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-reports">Reports to</Label>
            <Select value={reportsTo} onValueChange={setReportsTo}>
              <SelectTrigger id="m-reports">
                <SelectValue placeholder="No manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No manager</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={submitting || !workspaceId}>
              {submitting ? "Adding…" : "Add member"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Members{" "}
            <span className="ml-1 text-muted-foreground">
              ({members.length})
            </span>
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">Loading…</div>
        ) : members.length === 0 ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">
            No members yet. Add your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-12 items-center gap-4 px-6 py-3 text-sm"
              >
                <div className="col-span-3 truncate font-medium text-foreground">
                  {m.name}
                </div>
                <div className="col-span-3 truncate text-muted-foreground">
                  {m.email}
                </div>
                <div className="col-span-2 truncate text-muted-foreground">
                  {m.role || "—"}
                </div>
                <div className="col-span-3 truncate text-muted-foreground">
                  {m.reports_to
                    ? memberNameById.get(m.reports_to) ?? "—"
                    : "—"}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(m.id)}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
