import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieStore, cookies, createServiceClient, isSuperAdmin, redirect } = vi.hoisted(() => ({
  cookieStore: {
    set: vi.fn(),
    delete: vi.fn(),
  },
  cookies: vi.fn(),
  createServiceClient: vi.fn(),
  isSuperAdmin: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next/headers', () => ({ cookies }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ isSuperAdmin, getUser: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));

import {
  stopViewingAsLeagueAdmin,
  viewAsLeagueAdmin,
} from '@/app/(admin)/admin/context-actions';
import {
  ADMIN_LEAGUE_COOKIE,
  ADMIN_SEASON_COOKIE,
  ADMIN_VIEW_AS_LEAGUE_COOKIE,
} from '@/lib/admin/context';

function leagueQuery(league: { id: string } | null) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn().mockResolvedValue({ data: league });
  return query;
}

function seasonsQuery(seasons: Array<{ id: string; status: string }>) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn().mockResolvedValue({ data: seasons });
  return query;
}

describe('superadmin league-admin view actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookies.mockResolvedValue(cookieStore);
    isSuperAdmin.mockResolvedValue(true);
  });

  it('locks view mode to a real league and selects its active season', async () => {
    const league = leagueQuery({ id: 'league-1' });
    const seasons = seasonsQuery([
      { id: 'season-old', status: 'completed' },
      { id: 'season-active', status: 'active' },
    ]);
    createServiceClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'leagues') return league;
        if (table === 'seasons') return seasons;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('league_id', 'league-1');

    await expect(viewAsLeagueAdmin(formData)).rejects.toThrow(
      'REDIRECT:/admin/participants',
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      ADMIN_VIEW_AS_LEAGUE_COOKIE,
      'league-1',
      expect.objectContaining({ httpOnly: true, path: '/admin', sameSite: 'lax' }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      ADMIN_LEAGUE_COOKIE,
      'league-1',
      expect.any(Object),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      ADMIN_SEASON_COOKIE,
      'season-active',
      expect.any(Object),
    );
  });

  it('does not enable view mode for a league that does not exist', async () => {
    createServiceClient.mockResolvedValue({
      from: vi.fn(() => leagueQuery(null)),
    });
    const formData = new FormData();
    formData.set('league_id', 'missing');

    await viewAsLeagueAdmin(formData);

    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('allows only real superadmins to enter view mode', async () => {
    isSuperAdmin.mockResolvedValue(false);
    const formData = new FormData();
    formData.set('league_id', 'league-1');

    await expect(viewAsLeagueAdmin(formData)).rejects.toThrow('REDIRECT:/dashboard');
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('clears view mode and returns to the superadmin league list', async () => {
    await expect(stopViewingAsLeagueAdmin()).rejects.toThrow(
      'REDIRECT:/admin/leagues',
    );

    expect(cookieStore.set).toHaveBeenCalledWith(
      ADMIN_VIEW_AS_LEAGUE_COOKIE,
      '',
      expect.objectContaining({ path: '/admin', maxAge: 0 }),
    );
  });
});
