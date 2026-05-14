import { supabase } from "@/integrations/supabase/client";
import type { ExtractedTask, ExtractResult } from "./claude";

export const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export type DbProject = {
  id: string;
  name: string;
  summary: string;
  status: string;
  created_at: string;
};

type DbTaskRow = {
  id: string;
  project_id: string;
  owner_name: string;
  owner_email: string;
  task_text: string;
  deadline: string | null;
  priority: string;
  state: string;
  cluster: string | null;
  source_quote: string | null;
};

function rowToTask(r: DbTaskRow): ExtractedTask {
  return {
    id: r.id,
    task_text: r.task_text,
    owner_name: r.owner_name,
    owner_email: r.owner_email,
    deadline: r.deadline ?? "",
    priority: (r.priority as ExtractedTask["priority"]) ?? "MEDIUM",
    state: (r.state as ExtractedTask["state"]) ?? "pending",
    cluster: r.cluster ?? "",
    source_quote: r.source_quote ?? "",
  };
}

export async function fetchProjects(): Promise<DbProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,summary,status,created_at")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbProject[];
}

export async function fetchProjectById(id: string): Promise<DbProject | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,summary,status,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbProject | null) ?? null;
}

export async function fetchProjectWithTasks(
  id: string,
): Promise<{ project: DbProject; result: ExtractResult } | null> {
  const project = await fetchProjectById(id);
  if (!project) return null;
  const tasks = await fetchProjectTasks(project.id);
  return { project, result: { summary: project.summary ?? "", tasks } };
}

export async function fetchLatestProject(): Promise<DbProject | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,summary,status,created_at")
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DbProject | null) ?? null;
}

export async function fetchProjectTasks(projectId: string): Promise<ExtractedTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,project_id,owner_name,owner_email,task_text,deadline,priority,state,cluster,source_quote")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbTaskRow[]).map(rowToTask);
}

export async function fetchLatestProjectWithTasks(): Promise<{
  project: DbProject;
  result: ExtractResult;
} | null> {
  const project = await fetchLatestProject();
  if (!project) return null;
  const tasks = await fetchProjectTasks(project.id);
  return {
    project,
    result: { summary: project.summary ?? "", tasks },
  };
}

export async function activateAgent(opts: {
  projectName: string;
  summary: string;
  tasks: ExtractedTask[];
}): Promise<DbProject> {
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      workspace_id: DEFAULT_WORKSPACE_ID,
      name: opts.projectName,
      summary: opts.summary,
      status: "active",
    })
    .select("id,name,summary,status,created_at")
    .single();
  if (pErr || !project) throw pErr ?? new Error("Failed to create project");

  if (opts.tasks.length > 0) {
    const rows = opts.tasks.map((t) => ({
      project_id: project.id,
      owner_name: t.owner_name,
      owner_email: t.owner_email,
      task_text: t.task_text,
      deadline: t.deadline || null,
      priority: t.priority,
      state: t.state,
      cluster: t.cluster,
      source_quote: t.source_quote,
    }));
    const { error: tErr } = await supabase.from("tasks").insert(rows);
    if (tErr) throw tErr;
  }
  return project as DbProject;
}

export async function updateTaskRow(
  id: string,
  patch: Partial<Pick<ExtractedTask, "task_text" | "owner_name" | "owner_email" | "deadline" | "priority" | "state">>,
) {
  const { error } = await supabase
    .from("tasks")
    .update({
      ...patch,
      deadline: patch.deadline === "" ? null : patch.deadline,
    })
    .eq("id", id);
  if (error) throw error;
}

export function deriveProjectName(summary: string, tasks: ExtractedTask[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const firstCluster = tasks.find((t) => t.cluster)?.cluster;
  if (firstCluster) return `${firstCluster} — ${today}`;
  const firstWords = (summary || "").split(/\s+/).slice(0, 5).join(" ").trim();
  return firstWords ? `${firstWords} — ${today}` : `Meeting — ${today}`;
}
