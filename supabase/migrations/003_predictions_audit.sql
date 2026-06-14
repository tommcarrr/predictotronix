-- Migration: 003_predictions_audit
-- Predictions and prediction audit trail

-- ============================================================
-- predictions
-- One prediction per (fixture, participant) — upsert-safe
-- ============================================================
create table public.predictions (
  id               uuid primary key default gen_random_uuid(),
  fixture_id       uuid not null references public.fixtures(id) on delete cascade,
  participant_id   uuid not null references public.participants(id) on delete cascade,
  season_id        uuid not null references public.seasons(id) on delete cascade,
  home_score       integer not null check (home_score >= 0),
  away_score       integer not null check (away_score >= 0),
  entered_by       uuid references auth.users(id) on delete set null,
  is_admin_entered boolean not null default false,
  points_awarded   integer,                                   -- NULL until scored
  points_reason    text check (points_reason in ('exact', 'correct_result', 'incorrect')),
  scored_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint predictions_unique unique (fixture_id, participant_id)
);

alter table public.predictions enable row level security;

create index predictions_fixture_id_idx on public.predictions(fixture_id);
create index predictions_participant_id_idx on public.predictions(participant_id);
create index predictions_season_id_idx on public.predictions(season_id);
create index predictions_scored_at_idx on public.predictions(scored_at);

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute function public.set_updated_at();

-- ============================================================
-- prediction_audit
-- Full history of all prediction creates and edits
-- ============================================================
create table public.prediction_audit (
  id                   uuid primary key default gen_random_uuid(),
  prediction_id        uuid not null references public.predictions(id) on delete cascade,
  actor_id             uuid references auth.users(id) on delete set null,
  action               text not null
                         check (action in ('created', 'edited', 'admin_created', 'admin_edited')),
  previous_home_score  integer,
  previous_away_score  integer,
  new_home_score       integer not null,
  new_away_score       integer not null,
  is_admin_action      boolean not null default false,
  created_at           timestamptz not null default now()
);

alter table public.prediction_audit enable row level security;

create index prediction_audit_prediction_id_idx on public.prediction_audit(prediction_id);
create index prediction_audit_actor_id_idx on public.prediction_audit(actor_id);
