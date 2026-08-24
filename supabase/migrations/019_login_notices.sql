-- Login notices shown to registered league participants.

create table public.login_notices (
  id           uuid primary key default gen_random_uuid(),
  league_id    uuid references public.leagues(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 100),
  body         text not null check (char_length(body) between 1 and 2000),
  tone         text not null check (tone in ('info', 'success', 'warning', 'error')),
  display_mode text not null default 'once'
                 check (display_mode in ('once', 'every_login')),
  expires_at   timestamptz not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint login_notices_expiry_window check (
    expires_at > created_at and expires_at <= created_at + interval '14 days'
  )
);

create index login_notices_active_idx
  on public.login_notices (expires_at desc);
create index login_notices_league_active_idx
  on public.login_notices (league_id, expires_at desc);

alter table public.login_notices enable row level security;

-- A global notice still targets league users, not every authenticated account.
create policy "login_notices_select_members"
  on public.login_notices for select
  using (
    expires_at > now()
    and exists (
      select 1
      from public.participants p
      join public.season_participants sp on sp.participant_id = p.id
      join public.seasons s on s.id = sp.season_id
      where p.user_id = auth.uid()
        and (login_notices.league_id is null or s.league_id = login_notices.league_id)
    )
  );

create table public.login_notice_dismissals (
  id           uuid primary key default gen_random_uuid(),
  notice_id    uuid not null references public.login_notices(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- NULL means permanently dismissed. A value means dismissed for that auth session.
  session_id   uuid,
  dismissed_at timestamptz not null default now()
);

create unique index login_notice_dismissals_once_idx
  on public.login_notice_dismissals (notice_id, user_id)
  where session_id is null;
create unique index login_notice_dismissals_session_idx
  on public.login_notice_dismissals (notice_id, user_id, session_id)
  where session_id is not null;
create index login_notice_dismissals_user_idx
  on public.login_notice_dismissals (user_id, notice_id);

alter table public.login_notice_dismissals enable row level security;

create policy "login_notice_dismissals_select_own"
  on public.login_notice_dismissals for select
  using (user_id = auth.uid());

create policy "login_notice_dismissals_insert_own"
  on public.login_notice_dismissals for insert
  with check (user_id = auth.uid());

