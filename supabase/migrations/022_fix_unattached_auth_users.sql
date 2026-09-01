-- Fix runtime ambiguity between the list function's user_id output column and
-- user_id columns referenced in its PL/pgSQL queries.

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
    from public.league_roles actor_role
    where actor_role.user_id = p_actor_user_id
      and actor_role.role = 'super_admin'
      and actor_role.league_id is null
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
    and not exists (
      select 1
      from public.participants participant
      where participant.user_id = auth_user.id
    )
    and not exists (
      select 1
      from public.join_requests join_request
      where join_request.user_id = auth_user.id
    )
    and not exists (
      select 1
      from public.league_roles user_role
      where user_role.user_id = auth_user.id
    )
    and not exists (
      select 1
      from public.leagues owned_league
      where owned_league.created_by = auth_user.id
    )
    and not exists (
      select 1
      from public.leagues invited_league
      where invited_league.id::text = auth_user.raw_user_meta_data->>'invite_league_id'
        and invited_league.invite_code = auth_user.raw_user_meta_data->>'invite_code'
    )
  order by auth_user.created_at desc;
end;
$$;

revoke all on function public.list_unattached_auth_users(uuid) from public;
revoke all on function public.list_unattached_auth_users(uuid) from anon, authenticated;
grant execute on function public.list_unattached_auth_users(uuid) to service_role;
