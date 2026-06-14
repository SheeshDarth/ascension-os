create extension if not exists "pgcrypto";

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  date date unique not null,
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

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  markdown_export text,
  created_at timestamp with time zone default now()
);

-- MVP policy for a private prototype.
-- Before sharing publicly, enable auth and Row Level Security policies scoped to auth.uid().
alter table daily_logs disable row level security;
alter table goals disable row level security;
alter table weekly_reviews disable row level security;
