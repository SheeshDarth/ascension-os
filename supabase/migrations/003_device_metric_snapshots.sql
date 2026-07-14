-- Phone telemetry imported from Android Health Connect and Usage Access.
-- Apply this migration to existing private AscensionOS databases.

create table if not exists device_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  source text not null,
  metric_date date not null,
  metrics_json jsonb not null default '{}'::jsonb,
  permission_snapshot jsonb not null default '{}'::jsonb,
  captured_at timestamp with time zone not null default now(),
  created_at timestamp with time zone default now()
);

create unique index if not exists device_metric_snapshots_user_device_source_date_idx
  on device_metric_snapshots(user_id, device_id, source, metric_date);

create index if not exists device_metric_snapshots_user_date_idx
  on device_metric_snapshots(user_id, metric_date desc);

alter table device_metric_snapshots enable row level security;

drop policy if exists "device_metric_snapshots_select_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_insert_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_update_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_delete_own" on device_metric_snapshots;
create policy "device_metric_snapshots_select_own" on device_metric_snapshots for select using (auth.uid() = user_id);
create policy "device_metric_snapshots_insert_own" on device_metric_snapshots for insert with check (auth.uid() = user_id);
create policy "device_metric_snapshots_update_own" on device_metric_snapshots for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "device_metric_snapshots_delete_own" on device_metric_snapshots for delete using (auth.uid() = user_id);
