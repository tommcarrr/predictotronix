-- Allow manual test sends to be distinguished from user-facing notifications.
alter table public.notification_log
  drop constraint if exists notification_log_notification_type_check;

alter table public.notification_log
  add constraint notification_log_notification_type_check
  check (notification_type in ('reminder', 'results', 'welcome', 'test'));
