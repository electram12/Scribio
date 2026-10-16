create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null default '' check (char_length(email) <= 254),
  type text not null check (type in ('suggestion', 'bug', 'problem', 'content', 'other')),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

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

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_user_id_idx
  on public.contact_submissions (user_id);

grant select, insert on public.contact_submissions to authenticated;
