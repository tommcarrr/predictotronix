import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const originalMigration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/015_league_breakout_scores.sql'),
  'utf8'
);
const verifiedMigration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/017_verified_breakout_runs.sql'),
  'utf8'
);
const relaxedLimitsMigration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/018_relax_breakout_run_limits.sql'),
  'utf8'
);

describe('league Breakout score migration', () => {
  it('stores one constrained personal best per participant and league', () => {
    expect(originalMigration).toContain('primary key (league_id, participant_id)');
    expect(verifiedMigration).toContain('score >= 0 and score <= 379750');
    expect(verifiedMigration).toContain('where excluded.score > league_breakout_scores.score');
    expect(verifiedMigration).toContain('duration_ms asc nulls last');
  });

  it('enforces member-scoped reads and authenticated RPC access', () => {
    expect(originalMigration).toContain('rank_position bigint');
    expect(originalMigration).not.toMatch(/\n\s*position bigint/);
    expect(originalMigration).toContain('league_breakout_scores_select_members');
    expect(originalMigration).toContain('public.is_league_breakout_member(league_id)');
    expect(verifiedMigration).toContain('grant execute on function public.submit_breakout_run');
    expect(verifiedMigration).toContain('to authenticated');
  });

  it('uses expiring one-use tickets and recalculates scores in the database', () => {
    expect(verifiedMigration).toContain("interval '45 minutes'");
    expect(verifiedMigration).toContain('and submitted_at is null');
    expect(verifiedMigration).toContain('and expires_at > now()');
    expect(verifiedMigration).toContain('for update');
    expect(verifiedMigration).toContain('v_score := v_score + (v_hits * 50 * v_level)');
    expect(verifiedMigration).toContain('p_duration_ms < v_total_hits * 120');
    expect(verifiedMigration).toContain('drop function public.submit_breakout_score');
    expect(verifiedMigration).toContain('revoke insert, update, delete');
  });

  it('allows long legitimate games while preserving one-use and impossible-speed checks', () => {
    expect(relaxedLimitsMigration).toContain("interval '6 hours'");
    expect(relaxedLimitsMigration).toContain('p_duration_ms > 21600000');
    expect(relaxedLimitsMigration).toContain('p_duration_ms < v_total_hits * 25');
    expect(relaxedLimitsMigration).toContain('and submitted_at is null');
    expect(relaxedLimitsMigration).toContain('and expires_at > now()');
  });
});
