
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_context text default '',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text default '',
  summary text default '',
  status text not null default 'active',
  archived_at timestamptz,
  delete_after timestamptz,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_name text not null,
  owner_email text not null,
  task_text text not null,
  deadline date,
  priority text not null default 'MEDIUM',
  state text not null default 'pending',
  cluster text default '',
  source_quote text default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create index tasks_project_id_idx on public.tasks(project_id);
create index projects_workspace_id_idx on public.projects(workspace_id);

alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- MVP: no auth yet, allow anon full access. Tighten when auth lands.
create policy "anon all workspaces" on public.workspaces for all using (true) with check (true);
create policy "anon all projects" on public.projects for all using (true) with check (true);
create policy "anon all tasks" on public.tasks for all using (true) with check (true);

-- Seed a single default workspace
insert into public.workspaces (id, name) values ('00000000-0000-0000-0000-000000000001', 'Default');
