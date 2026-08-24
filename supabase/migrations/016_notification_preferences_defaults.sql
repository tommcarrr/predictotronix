-- Ensure every participant has notification preferences, including participants
-- created before the application began creating the row explicitly.
insert into public.notification_preferences (participant_id, email_enabled)
select id, not is_offline
from public.participants
on conflict (participant_id) do nothing;

create or replace function public.create_participant_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (participant_id, email_enabled)
  values (new.id, not new.is_offline)
  on conflict (participant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists participants_create_notification_preferences on public.participants;
create trigger participants_create_notification_preferences
  after insert on public.participants
  for each row execute function public.create_participant_notification_preferences();
