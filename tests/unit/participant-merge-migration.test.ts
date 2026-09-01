import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/020_merge_offline_participants.sql'),
  'utf8'
).replace(/\r\n/g, '\n');

describe('offline participant merge migration', () => {
  it('is atomic, concurrency-safe, and restricted to the service role', () => {
    expect(migration).toContain('create or replace function public.merge_offline_participant');
    expect(migration).toContain('security definer');
    expect(migration).toContain('order by id\n  for update');
    expect(migration).toContain('revoke all on function public.merge_offline_participant');
    expect(migration).toContain('from anon, authenticated');
    expect(migration).toContain('to service_role');
  });

  it('validates source and target identity invariants and every affected league', () => {
    expect(migration).toContain('not v_source.is_offline or v_source.user_id is not null');
    expect(migration).toContain('v_target.is_offline or v_target.user_id is null');
    expect(migration).toContain('v_unauthorized_league_ids');
    expect(migration).toContain('Merge would affect leagues the acting admin does not manage');
  });

  it('moves every known participant-owned table and fails closed for future tables', () => {
    for (const table of [
      'season_participants',
      'predictions',
      'notification_preferences',
      'notification_log',
      'league_breakout_scores',
      'league_breakout_runs',
    ]) {
      expect(migration).toContain(`public.${table}`);
      expect(migration).toContain(`('${table}', 'participant_id')`);
    }
    expect(migration).toContain('Merge blocked: unhandled participant references');
  });

  it('resolves uniqueness conflicts without silently discarding history', () => {
    expect(migration).toContain('set prediction_id = target_prediction.id');
    expect(migration).toContain('predictionConflictsKeptTarget');
    expect(migration).toContain('keptTargetNotificationPreferences');
    expect(migration).toContain('on conflict (league_id, participant_id) do update');
    expect(migration).toContain('breakoutScoreConflictsKeptBest');
    expect(migration).toContain("'predictionConflicts'");
    expect(migration).toContain("'breakoutScoreConflicts'");
    expect(migration).toContain('conflict_snapshot');
  });

  it('records a durable audit snapshot before deleting the offline record', () => {
    const auditPosition = migration.indexOf('insert into public.participant_merges');
    const deletePosition = migration.indexOf(
      'delete from public.participants where id = p_source_participant_id'
    );
    expect(auditPosition).toBeGreaterThan(0);
    expect(deletePosition).toBeGreaterThan(auditPosition);
    expect(migration).toContain('to_jsonb(v_source)');
    expect(migration).toContain('merge_summary');
  });
});
