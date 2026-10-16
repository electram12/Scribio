alter table public.user_profiles
  add column if not exists role text not null default 'student';

alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('student', 'admin'));

create or replace function public.is_scribio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'approved'
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

drop trigger if exists on_auth_user_created_scribio on auth.users;
create trigger on_auth_user_created_scribio
  after insert on auth.users
  for each row execute function public.create_scribio_profile();

insert into public.user_profiles (id, email, name, school)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'name', ''),
  coalesce(raw_user_meta_data ->> 'school', '')
from auth.users
on conflict (id) do nothing;

alter table public.user_profiles enable row level security;
alter table public.user_app_data enable row level security;

drop policy if exists "authenticated users can view all profiles" on public.user_profiles;
drop policy if exists "authenticated users can update any profile" on public.user_profiles;
drop policy if exists "users can create their own profile" on public.user_profiles;
drop policy if exists "Profiles are visible to their owner and admins" on public.user_profiles;
drop policy if exists "Admins manage access requests" on public.user_profiles;
drop policy if exists "Users read their own profile and admins read all profiles" on public.user_profiles;
drop policy if exists "Admins update access request status" on public.user_profiles;

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

drop policy if exists "users can view their own app data" on public.user_app_data;
drop policy if exists "users can create their own app data" on public.user_app_data;
drop policy if exists "users can update their own app data" on public.user_app_data;
drop policy if exists "Users and admins read app data" on public.user_app_data;
drop policy if exists "Users create their app data" on public.user_app_data;
drop policy if exists "Users update their app data" on public.user_app_data;
drop policy if exists "Users read their own app data" on public.user_app_data;
drop policy if exists "Users create their own app data" on public.user_app_data;
drop policy if exists "Users update their own app data" on public.user_app_data;

create policy "Users read their own app data"
  on public.user_app_data
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users create their own app data"
  on public.user_app_data
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own app data"
  on public.user_app_data
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select on public.user_profiles to authenticated;
grant update (status) on public.user_profiles to authenticated;
grant select, insert, update on public.user_app_data to authenticated;
grant execute on function public.is_scribio_admin() to authenticated;

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_app_data_user_id_idx on public.user_app_data (user_id);
