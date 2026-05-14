CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  member_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (project_id, member_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon access" ON public.project_members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public access" ON public.project_members FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_member ON public.project_members(member_id);