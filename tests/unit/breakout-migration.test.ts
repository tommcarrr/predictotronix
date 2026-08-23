import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/015_league_breakout_scores.sql'),
  'utf8',
);

describe('league Breakout score migration', () => {
  it('stores one constrained personal best per participant and league', () => {
    expect(migration).toContain('primary key (league_id, participant_id)');
    expect(migration).toContain('score >= 0 and score <= 54000');
    expect(migration).toContain('where excluded.score > league_breakout_scores.score');
  });

  it('enforces member-scoped reads and authenticated RPC access', () => {
    expect(migration).toContain('rank_position bigint');
    expect(migration).not.toMatch(/\n\s*position bigint/);
    expect(migration).toContain('league_breakout_scores_select_members');
    expect(migration).toContain('public.is_league_breakout_member(league_id)');
    expect(migration).toContain('grant execute on function public.submit_breakout_score');
    expect(migration).toContain('to authenticated');
  });
});
