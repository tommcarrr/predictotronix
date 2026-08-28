import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from '@/components/admin/AdminShell';
import { SECRET_GAME_COOKIE } from '@/components/admin/secret-game-cookie';

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => '/admin/participants'),
}));

vi.mock('next/navigation', () => ({ usePathname }));
vi.mock('@/app/(admin)/admin/context-actions', () => ({
  setAdminLeague: vi.fn(),
  setAdminSeason: vi.fn(),
  stopViewingAsLeagueAdmin: vi.fn(),
}));
vi.mock('@/components/admin/CeefaxBreakout', () => ({
  CeefaxBreakout: () => <div role="dialog" aria-label="Football Breakout" />,
}));

describe('AdminShell league-admin view mode', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  beforeEach(() => {
    vi.useRealTimers();
    usePathname.mockReturnValue('/admin/participants');
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.cookie = `${SECRET_GAME_COOKIE}=; Path=/; Max-Age=0`;
  });

  it('shows the exit control and league-admin navigation', () => {
    render(
      <AdminShell
        email="super@example.com"
        playerName="Super Player"
        leagues={[{ id: 'league-1', name: 'North League' }]}
        seasons={[{ id: 'season-1', name: '2026/27', status: 'active' }]}
        selectedLeagueId="league-1"
        selectedSeasonId="season-1"
        superAdmin={false}
        viewingAsLeagueAdmin
      >
        <div>League content</div>
      </AdminShell>
    );

    expect(screen.getByText('Viewing as league admin for North League')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Back to superadmin' })).toBeVisible();
    for (const link of [
      'Overview',
      'People',
      'Predictions',
      'Fixtures & results',
      'Standings',
      'Seasons',
    ]) {
      expect(screen.getAllByRole('link', { name: link }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('link', { name: 'Leagues' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Cookies' })).toHaveAttribute('href', '/cookies');
  });

  it('opens the hidden game after four theme changes even when the prompt cookie exists', () => {
    document.cookie = `${SECRET_GAME_COOKIE}=1; Path=/; Max-Age=7776000`;
    render(
      <AdminShell
        email="player@example.com"
        playerName="Test Player"
        leagues={[{ id: 'league-1', name: 'North League' }]}
        seasons={[]}
        selectedLeagueId="league-1"
        selectedSeasonId={null}
        superAdmin
        viewingAsLeagueAdmin={false}
      >
        <div>Admin content</div>
      </AdminShell>
    );

    const themeButton = screen.getByRole('button', { name: 'Use dark theme' });
    for (let press = 0; press < 3; press += 1) fireEvent.click(themeButton);
    expect(screen.queryByRole('dialog', { name: 'Football Breakout' })).not.toBeInTheDocument();
    fireEvent.click(themeButton);
    expect(screen.getByRole('dialog', { name: 'Football Breakout' })).toBeVisible();
    expect(document.cookie).toContain(`${SECRET_GAME_COOKIE}=1`);
  });
});
