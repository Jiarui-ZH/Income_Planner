-- ============================================================
-- Personal Finance Tool — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- One row per user; all app state stored as JSONB
create table if not exists user_data (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only touch their own row
alter table user_data enable row level security;

create policy "select own data"
  on user_data for select
  using (auth.uid() = user_id);

create policy "insert own data"
  on user_data for insert
  with check (auth.uid() = user_id);

create policy "update own data"
  on user_data for update
  using (auth.uid() = user_id);

create policy "delete own data"
  on user_data for delete
  using (auth.uid() = user_id);
