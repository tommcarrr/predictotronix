import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/023_gameweek_messages.sql'),
  'utf8'
);

describe('gameweek messages migration', () => {
  it('limits players to one 1,000-character message per gameweek', () => {
    expect(migration).toContain('unique (gameweek_id, participant_id)');
    expect(migration).toContain('char_length(plain_text) between 1 and 1000');
  });

  it('enforces participant ownership and enrolment with RLS', () => {
    expect(migration).toContain('alter table public.gameweek_messages enable row level security');
    expect(migration).toContain('participant_id = public.get_participant_id()');
    expect(migration).toContain('join public.season_participants');
  });

  it('stores a separate read cursor for each admin', () => {
    expect(migration).toContain('primary key (gameweek_id, user_id)');
    expect(migration).toContain(
      'alter table public.admin_gameweek_message_reads enable row level security'
    );
  });
});
