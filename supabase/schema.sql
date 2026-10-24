create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  school text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  role text not null default 'student' check (role in ('student', 'admin')),
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

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null default '' check (char_length(email) <= 254),
  type text not null check (type in ('suggestion', 'bug', 'problem', 'content', 'other')),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_app_data enable row level security;
alter table public.contact_submissions enable row level security;

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
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_scribio
  after insert on auth.users
  for each row execute function public.create_scribio_profile();

create policy "Users read their own profile and admins read all profiles"
  on public.user_profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_scribio_admin()));

create policy "Admins update access request status"
  on public.user_profiles
  for update
  to authenticated
  using ((select public.is_scribio_admin()))
  with check ((select public.is_scribio_admin()));

create policy "Users read their own app data"
  on public.user_app_data
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users create their own app data"
  on public.user_app_data
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own app data"
  on public.user_app_data
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Approved users submit contact feedback"
  on public.contact_submissions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.user_profiles
      where id = (select auth.uid())
        and status = 'approved'
    )
  );

create policy "Admins read contact feedback"
  on public.contact_submissions
  for select
  to authenticated
  using ((select public.is_scribio_admin()));

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_app_data_user_id_idx on public.user_app_data (user_id);
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_user_id_idx
  on public.contact_submissions (user_id);

grant select on public.user_profiles to authenticated;
grant update (status) on public.user_profiles to authenticated;
grant select, insert, update on public.user_app_data to authenticated;
grant select, insert on public.contact_submissions to authenticated;
grant execute on function public.is_scribio_admin() to authenticated;

create or replace function public.update_scribio_account_profile(
  profile_name text,
  profile_school text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;
  if nullif(btrim(profile_name), '') is null or char_length(btrim(profile_name)) > 120 then
    raise exception 'Name must contain between 1 and 120 characters.';
  end if;
  if profile_school is null then
    raise exception 'School cannot be null.';
  end if;

  update public.user_profiles
  set name = btrim(profile_name), school = btrim(profile_school)
  where id = auth.uid();

  if not found then
    raise exception 'No account profile was updated.';
  end if;
end;
$$;

revoke all on function public.update_scribio_account_profile(text, text) from public;
grant execute on function public.update_scribio_account_profile(text, text) to authenticated;
