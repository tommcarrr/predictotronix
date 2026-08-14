-- Claim each logical notification occurrence before calling an external provider.
-- Existing log rows remain valid with a null delivery_key; PostgreSQL permits
-- multiple nulls in a unique index.
alter table public.notification_log
  add column delivery_key text;

alter table public.notification_log
  drop constraint if exists notification_log_status_check;

alter table public.notification_log
  add constraint notification_log_status_check
  check (status in ('processing', 'sent', 'failed', 'suppressed', 'dry_run'));

create unique index notification_log_delivery_key_unique_idx
  on public.notification_log(delivery_key);

comment on column public.notification_log.delivery_key is
  'Stable idempotency key claimed before provider delivery; null for legacy and non-delivery audit rows.';
