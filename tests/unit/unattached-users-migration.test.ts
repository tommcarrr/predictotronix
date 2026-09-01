import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/021_unattached_auth_users.sql'),
  'utf8'
).replace(/\r\n/g, '\n');

describe('unattached auth users migration', () => {
  it('restricts listing and deletion to service-role super-admin operations', () => {
    expect(migration).toContain('create or replace function public.list_unattached_auth_users');
    expect(migration).toContain('create or replace function public.delete_unattached_auth_user');
    expect(migration).toContain("role = 'super_admin'");
    expect(migration).toContain('from anon, authenticated');
    expect(migration).toContain('to service_role');
  });

  it('excludes every account connected to participant data, requests, roles, or invitations', () => {
    expect(migration).toContain('public.participants where user_id = auth_user.id');
    expect(migration).toContain('public.join_requests where user_id = auth_user.id');
    expect(migration).toContain('public.league_roles where user_id = auth_user.id');
    expect(migration).toContain('public.leagues where created_by = auth_user.id');
    expect(migration).toContain("raw_user_meta_data->>'invite_league_id'");
    expect(migration).toContain("raw_user_meta_data->>'invite_code'");
  });

  it('locks and rechecks the auth user before hard deletion', () => {
    expect(migration).toContain('from auth.users\n  where id = p_user_id\n  for update');
    expect(migration).toContain('This user is now attached');
    expect(migration).toContain('delete from auth.users where id = p_user_id');
  });
});
