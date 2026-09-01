import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/022_fix_unattached_auth_users.sql'),
  'utf8'
).replace(/\r\n/g, '\n');

describe('unattached auth users runtime fix migration', () => {
  it('replaces the list function without ambiguous output-column references', () => {
    expect(migration).toContain('create or replace function public.list_unattached_auth_users');
    expect(migration).not.toMatch(/\bwhere user_id\s*=/);
    expect(migration).toContain('where actor_role.user_id = p_actor_user_id');
    expect(migration).toContain('where participant.user_id = auth_user.id');
    expect(migration).toContain('where join_request.user_id = auth_user.id');
    expect(migration).toContain('where user_role.user_id = auth_user.id');
    expect(migration).toContain('where owned_league.created_by = auth_user.id');
  });

  it('keeps the function restricted to the service role', () => {
    expect(migration).toContain('security definer');
    expect(migration).toContain('from anon, authenticated');
    expect(migration).toContain('to service_role');
  });
});
