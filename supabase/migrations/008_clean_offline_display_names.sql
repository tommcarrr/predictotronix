-- Offline status is administrative metadata, not part of a participant's name.
-- Clean up legacy/seeded values so leaderboards and every export show only names.
update public.participants
set display_name = regexp_replace(display_name, '\s*\(offline\)\s*$', '', 'i')
where is_offline = true
  and display_name ~* '\s*\(offline\)\s*$';
