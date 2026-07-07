-- Private production hardening migration for an existing AscensionOS prototype database.
--
-- Before running this migration on a database with existing anonymous rows:
-- 1. Create/sign in as your Supabase Auth user.
-- 2. Copy that user's auth.users.id.
-- 3. Replace YOUR_AUTH_USER_ID below and uncomment the three backfill statements.
--
-- update daily_logs set user_id = 'YOUR_AUTH_USER_ID' where user_id is null;
-- update goals set user_id = 'YOUR_AUTH_USER_ID' where user_id is null;
-- update weekly_reviews set user_id = 'YOUR_AUTH_USER_ID' where user_id is null;

alter table daily_logs add column if not exists score_formula_version integer not null default 1;
alter table daily_logs drop constraint if exists daily_logs_date_key;
alter table daily_logs alter column user_id set not null;

alter table goals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table goals alter column user_id set not null;

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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table weekly_reviews add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table weekly_reviews alter column user_id set not null;
alter table weekly_reviews alter column markdown_export set not null;

create unique index if not exists daily_logs_user_date_idx on daily_logs(user_id, date);
create index if not exists goals_user_id_idx on goals(user_id);
create unique index if not exists settings_user_id_idx on settings(user_id);
create unique index if not exists weekly_reviews_user_week_idx on weekly_reviews(user_id, week_start);

alter table daily_logs enable row level security;
alter table goals enable row level security;
alter table settings enable row level security;
alter table weekly_reviews enable row level security;

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
