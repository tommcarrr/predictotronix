-- Migration: 004_notifications
-- Notification preferences and delivery log

-- ============================================================
-- notification_preferences
-- Per-participant notification settings
-- ============================================================
create table public.notification_preferences (
  id                   uuid primary key default gen_random_uuid(),
  participant_id       uuid not null references public.participants(id) on delete cascade,
  email_enabled        boolean not null default true,
  sms_enabled          boolean not null default false,
  remind_when_complete boolean not null default false,   -- send reminder even if all preds submitted
  opted_out            boolean not null default false,   -- opt out of all notifications
  updated_at           timestamptz not null default now(),
  constraint notification_preferences_participant_unique unique (participant_id)
);

alter table public.notification_preferences enable row level security;

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ============================================================
-- notification_log
-- Record of every notification sent, suppressed, or failed
-- ============================================================
create table public.notification_log (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid not null references public.participants(id) on delete cascade,
  season_id         uuid references public.seasons(id) on delete set null,
  gameweek_id       uuid references public.gameweeks(id) on delete set null,
  channel           text not null check (channel in ('email', 'sms')),
  notification_type text not null check (notification_type in ('reminder', 'results', 'welcome')),
  status            text not null check (status in ('sent', 'failed', 'suppressed', 'dry_run')),
  sent_at           timestamptz not null default now(),
  error_message     text,
  metadata          jsonb
);

alter table public.notification_log enable row level security;

create index notification_log_participant_id_idx on public.notification_log(participant_id);
create index notification_log_gameweek_id_idx on public.notification_log(gameweek_id);
create index notification_log_sent_at_idx on public.notification_log(sent_at);
create index notification_log_status_idx on public.notification_log(status);
