-- Optional rich-text notes from participants to league admins, one per gameweek.
-- Read cursors are per admin so opening the Messages tab clears only that admin's badge.

create table public.gameweek_messages (
  id             uuid primary key default gen_random_uuid(),
  gameweek_id    uuid not null references public.gameweeks(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  content        jsonb not null,
  plain_text     text not null check (char_length(plain_text) between 1 and 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint gameweek_messages_participant_unique unique (gameweek_id, participant_id),
  constraint gameweek_messages_content_object check (jsonb_typeof(content) = 'object')
);

create index gameweek_messages_gameweek_updated_idx
  on public.gameweek_messages(gameweek_id, updated_at desc);

create trigger gameweek_messages_updated_at
  before update on public.gameweek_messages
  for each row execute function public.set_updated_at();

alter table public.gameweek_messages enable row level security;

create policy "gameweek_messages_select_own"
  on public.gameweek_messages for select
  using (participant_id = public.get_participant_id());

create policy "gameweek_messages_insert_own_enrolled"
  on public.gameweek_messages for insert
  with check (
    participant_id = public.get_participant_id()
    and exists (
      select 1
      from public.gameweeks gw
      join public.season_participants sp on sp.season_id = gw.season_id
      where gw.id = gameweek_id
        and sp.participant_id = public.get_participant_id()
    )
  );

create policy "gameweek_messages_update_own_enrolled"
  on public.gameweek_messages for update
  using (participant_id = public.get_participant_id())
  with check (
    participant_id = public.get_participant_id()
    and exists (
      select 1
      from public.gameweeks gw
      join public.season_participants sp on sp.season_id = gw.season_id
      where gw.id = gameweek_id
        and sp.participant_id = public.get_participant_id()
    )
  );

create policy "gameweek_messages_delete_own"
  on public.gameweek_messages for delete
  using (participant_id = public.get_participant_id());

create table public.admin_gameweek_message_reads (
  gameweek_id uuid not null references public.gameweeks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (gameweek_id, user_id)
);

alter table public.admin_gameweek_message_reads enable row level security;

-- Admin message reads use the service-role client after an explicit league-scoped
-- authorization check. No authenticated-client policies are intentionally exposed.
