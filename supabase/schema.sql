create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  school text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  request_date text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.user_profiles enable row level security;
alter table public.user_app_data enable row level security;

create policy "authenticated users can view all profiles"
  on public.user_profiles
  for select
  using (auth.uid() is not null);

create policy "users can create their own profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "authenticated users can update any profile"
  on public.user_profiles
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "users can view their own app data"
  on public.user_app_data
  for select
  using (auth.uid() = user_id);

create policy "users can create their own app data"
  on public.user_app_data
  for insert
  with check (auth.uid() = user_id);

create policy "users can update their own app data"
  on public.user_app_data
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_app_data_user_id_idx on public.user_app_data (user_id);
