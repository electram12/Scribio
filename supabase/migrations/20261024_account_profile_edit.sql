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
