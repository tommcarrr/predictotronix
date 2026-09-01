-- Super-admin cleanup for auth accounts that have never become attached to the app.

create or replace function public.list_unattached_auth_users(p_actor_user_id uuid)
returns table (
  user_id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.league_roles
    where user_id = p_actor_user_id
      and role = 'super_admin'
      and league_id is null
  ) then
    raise exception 'Only a super admin can view unattached users' using errcode = '42501';
  end if;

  return query
  select
    auth_user.id,
    auth_user.email::text,
    coalesce(
      nullif(trim(profile.display_name), ''),
      nullif(trim(auth_user.raw_user_meta_data->>'display_name'), ''),
      nullif(split_part(auth_user.email, '@', 1), ''),
      'Unknown user'
    )::text,
    auth_user.created_at,
    auth_user.email_confirmed_at,
    auth_user.last_sign_in_at
  from auth.users auth_user
  left join public.profiles profile on profile.id = auth_user.id
  where auth_user.id <> p_actor_user_id
    -- A participant row can own historical data even when it has no current
    -- enrolment, so fail closed and keep every participant-linked account.
    and not exists (
      select 1 from public.participants where user_id = auth_user.id
    )
    and not exists (
      select 1 from public.join_requests where user_id = auth_user.id
    )
    and not exists (
      select 1 from public.league_roles where user_id = auth_user.id
    )
    and not exists (
      select 1 from public.leagues where created_by = auth_user.id
    )
    and not exists (
      select 1
      from public.leagues league
      where league.id::text = auth_user.raw_user_meta_data->>'invite_league_id'
        and league.invite_code = auth_user.raw_user_meta_data->>'invite_code'
    )
  order by auth_user.created_at desc;
end;
$$;

create or replace function public.delete_unattached_auth_user(
  p_user_id uuid,
  p_actor_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user auth.users%rowtype;
begin
  if not exists (
    select 1
    from public.league_roles
    where user_id = p_actor_user_id
      and role = 'super_admin'
      and league_id is null
  ) then
    raise exception 'Only a super admin can delete unattached users' using errcode = '42501';
  end if;

  if p_user_id = p_actor_user_id then
    raise exception 'A super admin cannot delete their own account here' using errcode = '22023';
  end if;

  select * into v_user
  from auth.users
  where id = p_user_id
  for update;

  if v_user.id is null then
    return false;
  end if;

  if exists (select 1 from public.participants where user_id = p_user_id)
    or exists (select 1 from public.join_requests where user_id = p_user_id)
    or exists (select 1 from public.league_roles where user_id = p_user_id)
    or exists (select 1 from public.leagues where created_by = p_user_id)
    or exists (
      select 1
      from public.leagues league
      where league.id::text = v_user.raw_user_meta_data->>'invite_league_id'
        and league.invite_code = v_user.raw_user_meta_data->>'invite_code'
    ) then
    raise exception 'This user is now attached to a participant, league, request, role, or invitation'
      using errcode = '55000';
  end if;

  delete from auth.users where id = p_user_id;
  return found;
end;
$$;

revoke all on function public.list_unattached_auth_users(uuid) from public;
revoke all on function public.list_unattached_auth_users(uuid) from anon, authenticated;
grant execute on function public.list_unattached_auth_users(uuid) to service_role;

revoke all on function public.delete_unattached_auth_user(uuid, uuid) from public;
revoke all on function public.delete_unattached_auth_user(uuid, uuid) from anon, authenticated;
grant execute on function public.delete_unattached_auth_user(uuid, uuid) to service_role;
