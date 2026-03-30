-- ============================================================
-- Thyroid Tracker - Supabase Schema v3
-- Run in Supabase Dashboard -> SQL Editor -> New Query
-- Also enable Storage and create a bucket called 'medical-records' with public access.
-- ============================================================

create table if not exists app_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz default now()
);

create table if not exists meals (
  id            uuid default gen_random_uuid() primary key,
  date          date not null default current_date,
  meal_type     text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name     text not null,
  portion_size  text,
  logged_at     timestamptz,
  triggers      text[] default '{}',
  flags         jsonb default '{}',
  notes         text,
  food_status   text check (food_status in ('safe', 'caution', 'avoid')),
  created_at    timestamptz default now()
);

create table if not exists supplement_logs (
  id          uuid default gen_random_uuid() primary key,
  date        date not null default current_date,
  name        text not null,
  taken       boolean not null default false,
  dosage_mg   numeric,
  time_taken  timestamptz,
  created_at  timestamptz default now(),
  unique (date, name)
);

create table if not exists symptoms (
  id                uuid default gen_random_uuid() primary key,
  date              date not null default current_date,
  neck_pressure     smallint check (neck_pressure between 0 and 10),
  swallowing_pain   smallint check (swallowing_pain between 0 and 10),
  singing_pain      smallint check (singing_pain between 0 and 10),
  reflux            smallint check (reflux between 0 and 10),
  throat_tightness  smallint check (throat_tightness between 0 and 10),
  fatigue           smallint check (fatigue between 0 and 10),
  pulse_awareness   smallint check (pulse_awareness between 0 and 10),
  bloating          smallint check (bloating between 0 and 10),
  sleep_quality     smallint check (sleep_quality between 0 and 10),
  notes             text,
  created_at        timestamptz default now()
);

create table if not exists exercise_logs (
  id                uuid default gen_random_uuid() primary key,
  date              date not null default current_date,
  exercise_type     text not null,
  duration_minutes  smallint,
  step_count        integer,
  intensity         text check (intensity in ('low', 'medium', 'high')),
  before_feeling    text,
  after_feeling     text,
  logged_at         timestamptz,
  notes             text,
  created_at        timestamptz default now()
);

create table if not exists water_logs (
  id         uuid default gen_random_uuid() primary key,
  date       date not null default current_date,
  glasses    smallint not null default 0,
  ml_total   smallint,
  created_at timestamptz default now(),
  unique (date)
);

create table if not exists journal_entries (
  id          uuid default gen_random_uuid() primary key,
  date        date not null default current_date,
  content     text not null,
  mood        smallint check (mood between 1 and 5),
  created_at  timestamptz default now()
);

create table if not exists weekly_reviews (
  id                uuid default gen_random_uuid() primary key,
  week_number       smallint not null,
  week_start_date   date not null,
  overall_rating    smallint check (overall_rating between 1 and 5),
  wins              text,
  challenges        text,
  goals_next_week   text,
  trigger_foods     text,
  notes             text,
  created_at        timestamptz default now(),
  unique (week_number)
);

create table if not exists trigger_foods (
  id          uuid default gen_random_uuid() primary key,
  food_name   text not null unique,
  notes       text,
  added_date  date not null default current_date,
  created_at  timestamptz default now()
);

create table if not exists medical_records (
  id           uuid default gen_random_uuid() primary key,
  file_name    text not null,
  file_path    text not null,
  file_type    text,
  file_size    integer,
  record_type  text,
  record_date  date,
  notes        text,
  created_at   timestamptz default now()
);

alter table app_settings enable row level security;
alter table meals enable row level security;
alter table supplement_logs enable row level security;
alter table symptoms enable row level security;
alter table exercise_logs enable row level security;
alter table water_logs enable row level security;
alter table journal_entries enable row level security;
alter table weekly_reviews enable row level security;
alter table trigger_foods enable row level security;
alter table medical_records enable row level security;

create policy "allow all" on app_settings for all using (true) with check (true);
create policy "allow all" on meals for all using (true) with check (true);
create policy "allow all" on supplement_logs for all using (true) with check (true);
create policy "allow all" on symptoms for all using (true) with check (true);
create policy "allow all" on exercise_logs for all using (true) with check (true);
create policy "allow all" on water_logs for all using (true) with check (true);
create policy "allow all" on journal_entries for all using (true) with check (true);
create policy "allow all" on weekly_reviews for all using (true) with check (true);
create policy "allow all" on trigger_foods for all using (true) with check (true);
create policy "allow all" on medical_records for all using (true) with check (true);

insert into app_settings (key, value) values ('week_start_date', null)
  on conflict (key) do nothing;

alter table exercise_logs
  add column if not exists step_count integer;
