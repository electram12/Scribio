create extension if not exists pgcrypto;

-- 1. Create user_profiles table if it doesn't exist
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  school text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  role text not null default 'student' check (role in ('student', 'admin')),
  request_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Ensure missing columns exist if table was created previously without them
alter table public.user_profiles 
  add column if not exists role text not null default 'student' check (role in ('student', 'admin')),
  add column if not exists request_date timestamptz not null default now();

-- 2. Create user_app_data table if it doesn't exist
create table if not exists public.user_app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- 3. Admin Check Function
create or replace function public.is_scribio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'approved'
  );
$$;

-- 4. Automatic Profile Creation Trigger Function on Signup
create or replace function public.create_scribio_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, name, school)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'school', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_scribio on auth.users;
create trigger on_auth_user_created_scribio
  after insert on auth.users
  for each row execute function public.create_scribio_profile();

-- 5. Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.user_app_data enable row level security;

-- 6. Row Level Security Policies
drop policy if exists "Profiles are visible to their owner and admins" on public.user_profiles;
create policy "Profiles are visible to their owner and admins"
  on public.user_profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_scribio_admin()));

drop policy if exists "Admins manage access requests" on public.user_profiles;
create policy "Admins manage access requests"
  on public.user_profiles for update to authenticated
  using ((select public.is_scribio_admin()))
  with check ((select public.is_scribio_admin()));

drop policy if exists "Users and admins read app data" on public.user_app_data;
create policy "Users and admins read app data"
  on public.user_app_data for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_scribio_admin()));

drop policy if exists "Users create their app data" on public.user_app_data;
create policy "Users create their app data"
  on public.user_app_data for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users update their app data" on public.user_app_data;
create policy "Users update their app data"
  on public.user_app_data for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 7. Grant Permissions & Create Performance Indexes
grant select on public.user_profiles to authenticated;
grant update (status) on public.user_profiles to authenticated;
grant select, insert, update, delete on public.user_app_data to authenticated;
grant execute on function public.is_scribio_admin() to authenticated;

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_app_data_user_id_idx on public.user_app_data (user_id);