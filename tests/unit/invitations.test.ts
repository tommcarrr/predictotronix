import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const { sendJoinRequestEmail } = vi.hoisted(() => ({ sendJoinRequestEmail: vi.fn() }));

vi.mock('@/lib/notifications/email', () => ({ sendJoinRequestEmail }));
import {
  ensureJoinRequest,
  inviteAuthPath,
  invitePath,
  normalizeInviteCode,
  withInviteParam,
} from '@/lib/invitations';
import type { Database } from '@/types/database';

function fakeInvitationClient({
  league = { id: 'league-1', name: 'Office League', invite_active: true },
  existingStatus = null,
}: {
  league?: { id: string; name: string; invite_active: boolean } | null;
  existingStatus?: 'pending' | 'approved' | 'rejected' | null;
} = {}) {
  let insertCount = 0;

  const client = {
    from(table: string) {
      if (table === 'leagues') {
        const query = {
          select() { return query; },
          eq() { return query; },
          async maybeSingle() { return { data: league, error: null }; },
        };
        return query;
      }

      if (table === 'league_roles') {
        const query = {
          select() { return query; },
          eq() { return query; },
          then(resolve: (value: unknown) => unknown) {
            return Promise.resolve({ data: [{ user_id: 'admin-1' }], error: null }).then(resolve);
          },
        };
        return query;
      }

      if (table === 'profiles') {
        let selectedId: string | null = null;
        const query = {
          select() { return query; },
          eq(_column: string, value: string) { selectedId = value; return query; },
          async maybeSingle() {
            return { data: { display_name: 'New Player', email: 'player@example.com' }, error: null };
          },
          async in() {
            return {
              data: [{ id: 'admin-1', display_name: 'League Admin', email: 'admin@example.com' }],
              error: null,
            };
          },
        };
        void selectedId;
        return query;
      }

      const requestQuery = {
        select() { return requestQuery; },
        eq() { return requestQuery; },
        async maybeSingle() {
          return { data: existingStatus ? { status: existingStatus } : null, error: null };
        },
        async insert() {
          insertCount += 1;
          return { error: null };
        },
      };
      return requestQuery;
    },
  } as unknown as SupabaseClient<Database>;

  return { client, getInsertCount: () => insertCount };
}

describe('invite continuation helpers', () => {
  it('accepts only bounded URL-safe invite codes', () => {
    expect(normalizeInviteCode(' testinvitecode001 ')).toBe('testinvitecode001');
    expect(normalizeInviteCode('../dashboard')).toBeNull();
    expect(normalizeInviteCode('short')).toBeNull();
    expect(normalizeInviteCode(null)).toBeNull();
  });

  it('builds internal invite and auth destinations', () => {
    expect(invitePath('invite_code-1')).toBe('/join/invite_code-1');
    expect(inviteAuthPath('/register', 'invite_code-1')).toBe('/register?invite=invite_code-1');
    expect(withInviteParam('/login', 'invite_code-1', 'error', 'Try again')).toBe(
      '/login?error=Try+again&invite=invite_code-1',
    );
  });
});

describe('ensureJoinRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendJoinRequestEmail.mockResolvedValue({ success: true, messageId: 'email-1' });
  });

  it('creates one pending request for a valid new invitation', async () => {
    const fake = fakeInvitationClient();
    const result = await ensureJoinRequest('user-1', 'testinvitecode001', fake.client);

    expect(result).toEqual({
      status: 'pending',
      league: { id: 'league-1', name: 'Office League' },
      created: true,
    });
    expect(fake.getInsertCount()).toBe(1);
    expect(sendJoinRequestEmail).toHaveBeenCalledWith({
      to: 'admin@example.com',
      adminDisplayName: 'League Admin',
      applicantDisplayName: 'New Player',
      applicantEmail: 'player@example.com',
      leagueName: 'Office League',
      reviewUrl: new URL(
        '/admin/participants?tab=requests',
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      ).toString(),
      idempotencyKey: 'join-request:league-1:user-1:admin-1',
    });
  });

  it('returns the canonical state without inserting a duplicate request', async () => {
    const fake = fakeInvitationClient({ existingStatus: 'approved' });
    const result = await ensureJoinRequest('user-1', 'testinvitecode001', fake.client);

    expect(result.status).toBe('approved');
    expect(fake.getInsertCount()).toBe(0);
    expect(sendJoinRequestEmail).not.toHaveBeenCalled();
  });

  it('rejects inactive or missing invitations', async () => {
    const fake = fakeInvitationClient({ league: null });
    const result = await ensureJoinRequest('user-1', 'testinvitecode001', fake.client);

    expect(result).toEqual({ status: 'invalid', league: null, created: false });
    expect(fake.getInsertCount()).toBe(0);
  });
});
