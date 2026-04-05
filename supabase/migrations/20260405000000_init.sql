-- ============================================================
-- Profiles (auto-created on auth.users insert)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Workspaces
-- ============================================================
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')) default 'member',
  invited_email text,
  accepted_at timestamptz,
  primary key (workspace_id, user_id)
);

-- ============================================================
-- Areas
-- ============================================================
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  color text,
  icon text,
  sort_order integer not null default 0
);

-- ============================================================
-- Projects
-- ============================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  name text not null,
  description text,
  color text,
  icon text,
  status text not null check (status in ('active','completed','archived','someday')) default 'active',
  due_date date,
  sort_order integer not null default 0
);

-- ============================================================
-- Task Sections
-- ============================================================
create table if not exists task_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

-- ============================================================
-- Tasks
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  section_id uuid references task_sections(id) on delete set null,
  parent_task_id uuid references tasks(id) on delete cascade,
  assignee_id uuid references profiles(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  blocked_by_task_id uuid references tasks(id) on delete set null,
  title text not null,
  notes text,
  status text not null check (status in ('open','completed','cancelled','someday')) default 'open',
  priority smallint not null check (priority between 1 and 4) default 4,
  due_date date,
  start_date date,
  reminder_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tasks_user_id_status_idx on tasks(user_id, status);
create index if not exists tasks_project_id_idx on tasks(project_id);
create index if not exists tasks_parent_task_id_idx on tasks(parent_task_id);
create index if not exists tasks_assignee_id_idx on tasks(assignee_id);
create index if not exists tasks_blocked_by_task_id_idx on tasks(blocked_by_task_id);

-- auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- ============================================================
-- Tags
-- ============================================================
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  color text
);

create table if not exists task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table areas enable row level security;
alter table projects enable row level security;
alter table task_sections enable row level security;
alter table tasks enable row level security;
alter table tags enable row level security;
alter table task_tags enable row level security;

-- Helper: is user a member of a workspace?
create or replace function is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and accepted_at is not null
  );
$$;

-- profiles: read own
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

-- workspaces: members can read
create policy "workspaces: member read" on workspaces for select using (is_workspace_member(id) or owner_id = auth.uid());
create policy "workspaces: owner insert" on workspaces for insert with check (auth.uid() = owner_id);

-- workspace_members
create policy "wm: read own workspace" on workspace_members for select using (user_id = auth.uid() or is_workspace_member(workspace_id));
create policy "wm: owner insert" on workspace_members for insert with check (
  exists (select 1 from workspaces where id = workspace_id and owner_id = auth.uid())
);
create policy "wm: accept own invite" on workspace_members for update using (user_id = auth.uid());

-- areas
create policy "areas: user or workspace" on areas for select using (user_id = auth.uid() or (workspace_id is not null and is_workspace_member(workspace_id)));
create policy "areas: insert own" on areas for insert with check (auth.uid() = user_id);
create policy "areas: update own" on areas for update using (auth.uid() = user_id);
create policy "areas: delete own" on areas for delete using (auth.uid() = user_id);

-- projects
create policy "projects: user or workspace" on projects for select using (user_id = auth.uid() or (workspace_id is not null and is_workspace_member(workspace_id)));
create policy "projects: insert own" on projects for insert with check (auth.uid() = user_id);
create policy "projects: update own" on projects for update using (auth.uid() = user_id);
create policy "projects: delete own" on projects for delete using (auth.uid() = user_id);

-- task_sections
create policy "sections: via project" on task_sections for select using (
  exists (select 1 from projects p where p.id = project_id and (p.user_id = auth.uid() or (p.workspace_id is not null and is_workspace_member(p.workspace_id))))
);
create policy "sections: insert via project" on task_sections for insert with check (
  exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
);

-- tasks
create policy "tasks: own or workspace or assigned" on tasks for select using (
  user_id = auth.uid()
  or assignee_id = auth.uid()
  or (workspace_id is not null and is_workspace_member(workspace_id))
);
create policy "tasks: insert own" on tasks for insert with check (auth.uid() = created_by and auth.uid() = user_id);
create policy "tasks: update own or assigned" on tasks for update using (user_id = auth.uid() or assignee_id = auth.uid());
create policy "tasks: delete own" on tasks for delete using (auth.uid() = user_id);

-- tags
create policy "tags: user or workspace" on tags for select using (user_id = auth.uid() or (workspace_id is not null and is_workspace_member(workspace_id)));
create policy "tags: insert own" on tags for insert with check (auth.uid() = user_id);

-- task_tags
create policy "task_tags: read" on task_tags for select using (
  exists (select 1 from tasks t where t.id = task_id and (t.user_id = auth.uid() or (t.workspace_id is not null and is_workspace_member(t.workspace_id))))
);
create policy "task_tags: write own" on task_tags for insert with check (
  exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
);
create policy "task_tags: delete own" on task_tags for delete using (
  exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
);
