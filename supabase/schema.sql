create extension if not exists "pgcrypto";

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  score_formula_version integer not null default 1,
  wake_time text,
  sleep_time text,
  sleep_hours numeric default 0,
  gym_done boolean default false,
  workout_quality integer default 5,
  diet_followed boolean default false,
  protein_grams integer default 0,
  water_litres numeric default 0,
  weight_kg numeric default 0,
  steps integer default 0,
  dsa_minutes integer default 0,
  nirmiq_minutes integer default 0,
  academic_minutes integer default 0,
  deep_work_minutes integer default 0,
  porn_relapse boolean default false,
  masturbation_count integer default 0,
  reels_minutes integer default 0,
  youtube_minutes integer default 0,
  smoking boolean default false,
  money_earned integer default 0,
  money_spent integer default 0,
  grooming_done boolean default false,
  skincare_done boolean default false,
  social_action text,
  hardest_task_done text,
  biggest_distraction text,
  mood integer default 5,
  self_respect integer default 5,
  notes text,
  execution_score integer default 0,
  discipline_score integer default 0,
  career_score integer default 0,
  dopamine_score integer default 0,
  physique_score integer default 0,
  self_respect_score integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists daily_logs_user_date_idx on daily_logs(user_id, date);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  target text not null,
  current_value text,
  deadline date,
  status text default 'Active',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists goals_user_id_idx on goals(user_id);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default 'Siddharth',
  target_weight numeric not null default 74,
  dsa_daily_target integer not null default 45,
  nirmiq_daily_target integer not null default 60,
  academic_daily_target integer not null default 30,
  reels_limit integer not null default 30,
  sleep_target text not null default '7-8.5 hours',
  ai_provider text not null default 'deterministic',
  ai_consent boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists settings_user_id_idx on settings(user_id);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  markdown_export text not null,
  created_at timestamp with time zone default now()
);

create unique index if not exists weekly_reviews_user_week_idx on weekly_reviews(user_id, week_start);

create table if not exists ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  provider text not null,
  model text not null,
  input_summary text not null,
  output_json jsonb not null,
  rating text,
  correction_note text,
  created_at timestamp with time zone default now()
);

create unique index if not exists ai_analyses_user_week_provider_idx on ai_analyses(user_id, week_start, provider);

create table if not exists memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_date date,
  title text not null,
  body text not null,
  tags_json jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists memory_items_user_created_idx on memory_items(user_id, created_at desc);

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

alter table daily_logs enable row level security;
alter table goals enable row level security;
alter table settings enable row level security;
alter table weekly_reviews enable row level security;
alter table ai_analyses enable row level security;
alter table memory_items enable row level security;
alter table device_metric_snapshots enable row level security;

drop policy if exists "daily_logs_select_own" on daily_logs;
drop policy if exists "daily_logs_insert_own" on daily_logs;
drop policy if exists "daily_logs_update_own" on daily_logs;
drop policy if exists "daily_logs_delete_own" on daily_logs;
create policy "daily_logs_select_own" on daily_logs for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_logs_update_own" on daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete_own" on daily_logs for delete using (auth.uid() = user_id);

drop policy if exists "goals_select_own" on goals;
drop policy if exists "goals_insert_own" on goals;
drop policy if exists "goals_update_own" on goals;
drop policy if exists "goals_delete_own" on goals;
create policy "goals_select_own" on goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on goals for delete using (auth.uid() = user_id);

drop policy if exists "settings_select_own" on settings;
drop policy if exists "settings_insert_own" on settings;
drop policy if exists "settings_update_own" on settings;
drop policy if exists "settings_delete_own" on settings;
create policy "settings_select_own" on settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_delete_own" on settings for delete using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_select_own" on weekly_reviews;
drop policy if exists "weekly_reviews_insert_own" on weekly_reviews;
drop policy if exists "weekly_reviews_update_own" on weekly_reviews;
drop policy if exists "weekly_reviews_delete_own" on weekly_reviews;
create policy "weekly_reviews_select_own" on weekly_reviews for select using (auth.uid() = user_id);
create policy "weekly_reviews_insert_own" on weekly_reviews for insert with check (auth.uid() = user_id);
create policy "weekly_reviews_update_own" on weekly_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_reviews_delete_own" on weekly_reviews for delete using (auth.uid() = user_id);

drop policy if exists "ai_analyses_select_own" on ai_analyses;
drop policy if exists "ai_analyses_insert_own" on ai_analyses;
drop policy if exists "ai_analyses_update_own" on ai_analyses;
drop policy if exists "ai_analyses_delete_own" on ai_analyses;
create policy "ai_analyses_select_own" on ai_analyses for select using (auth.uid() = user_id);
create policy "ai_analyses_insert_own" on ai_analyses for insert with check (auth.uid() = user_id);
create policy "ai_analyses_update_own" on ai_analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_analyses_delete_own" on ai_analyses for delete using (auth.uid() = user_id);

drop policy if exists "memory_items_select_own" on memory_items;
drop policy if exists "memory_items_insert_own" on memory_items;
drop policy if exists "memory_items_update_own" on memory_items;
drop policy if exists "memory_items_delete_own" on memory_items;
create policy "memory_items_select_own" on memory_items for select using (auth.uid() = user_id);
create policy "memory_items_insert_own" on memory_items for insert with check (auth.uid() = user_id);
create policy "memory_items_update_own" on memory_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memory_items_delete_own" on memory_items for delete using (auth.uid() = user_id);

drop policy if exists "device_metric_snapshots_select_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_insert_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_update_own" on device_metric_snapshots;
drop policy if exists "device_metric_snapshots_delete_own" on device_metric_snapshots;
create policy "device_metric_snapshots_select_own" on device_metric_snapshots for select using (auth.uid() = user_id);
create policy "device_metric_snapshots_insert_own" on device_metric_snapshots for insert with check (auth.uid() = user_id);
create policy "device_metric_snapshots_update_own" on device_metric_snapshots for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "device_metric_snapshots_delete_own" on device_metric_snapshots for delete using (auth.uid() = user_id);
