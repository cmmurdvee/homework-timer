create table if not exists public.timer_app_state (
  id text primary key,
  active_timer jsonb,
  completed_tasks jsonb not null default '[]'::jsonb,
  revision bigint not null default 0,
  constraint timer_app_state_active_timer_object
    check (active_timer is null or jsonb_typeof(active_timer) = 'object'),
  constraint timer_app_state_completed_tasks_array
    check (jsonb_typeof(completed_tasks) = 'array'),
  constraint timer_app_state_revision_nonnegative
    check (revision >= 0)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'idle',
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  constraint tasks_title_length check (length(trim(title)) between 1 and 100),
  constraint tasks_description_length check (description is null or length(description) <= 500),
  constraint tasks_valid_status check (status in ('idle', 'running', 'completed'))
);

alter table public.timer_app_state enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.timer_app_state from anon, authenticated;
grant all on table public.timer_app_state to service_role;

grant select, insert, update on table public.timer_app_state to anon, authenticated;

drop policy if exists "timer_state_public_select" on public.timer_app_state;
create policy "timer_state_public_select"
  on public.timer_app_state for select
  to anon, authenticated
  using (id = 'global');

drop policy if exists "timer_state_public_insert" on public.timer_app_state;
create policy "timer_state_public_insert"
  on public.timer_app_state for insert
  to anon, authenticated
  with check (id = 'global');

drop policy if exists "timer_state_public_update" on public.timer_app_state;
create policy "timer_state_public_update"
  on public.timer_app_state for update
  to anon, authenticated
  using (id = 'global')
  with check (id = 'global');

revoke all on table public.tasks from anon, authenticated;
grant select, insert, update, delete on table public.tasks to anon, authenticated;

drop policy if exists "tasks_public_select" on public.tasks;
create policy "tasks_public_select"
  on public.tasks for select
  to anon, authenticated
  using (true);

drop policy if exists "tasks_public_insert" on public.tasks;
create policy "tasks_public_insert"
  on public.tasks for insert
  to anon, authenticated
  with check (true);

drop policy if exists "tasks_public_update" on public.tasks;
create policy "tasks_public_update"
  on public.tasks for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "tasks_public_delete" on public.tasks;
create policy "tasks_public_delete"
  on public.tasks for delete
  to anon, authenticated
  using (true);
