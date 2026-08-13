-- Repair registered participants created without a public profile row.
-- Auth metadata is the source used by signup; email is always available for
-- normal email/password accounts. Safe to run repeatedly.
update public.participants as participant
set
  display_name = case
    when participant.display_name in ('Unknown', 'Unknown user') then
      coalesce(
        nullif(trim(auth_user.raw_user_meta_data->>'display_name'), ''),
        nullif(split_part(auth_user.email, '@', 1), ''),
        participant.display_name
      )
    else participant.display_name
  end,
  email = coalesce(participant.email, auth_user.email),
  updated_at = now()
from auth.users as auth_user
where participant.user_id = auth_user.id
  and (
    participant.display_name in ('Unknown', 'Unknown user')
    or participant.email is null
  );
