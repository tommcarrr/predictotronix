import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AdminShell } from '@/components/admin/AdminShell';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/participants' }));
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
      </AdminShell>,
    );

    expect(screen.getByText('Viewing as league admin for North League')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Back to superadmin' })).toBeVisible();
    for (const link of ['Overview', 'People', 'Predictions', 'Fixtures & results', 'Standings', 'Seasons']) {
      expect(screen.getAllByRole('link', { name: link }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('link', { name: 'Leagues' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('opens the hidden game only after six consecutive theme changes', () => {
    render(
      <AdminShell
        email="player@example.com"
        playerName="Test Player"
        leagues={[]}
        seasons={[]}
        selectedLeagueId={null}
        selectedSeasonId={null}
        superAdmin
        viewingAsLeagueAdmin={false}
      >
        <div>Admin content</div>
      </AdminShell>,
    );

    const themeButton = screen.getByRole('button', { name: 'Use dark theme' });
    for (let press = 0; press < 5; press += 1) fireEvent.click(themeButton);
    expect(screen.queryByRole('dialog', { name: 'Football Breakout' })).not.toBeInTheDocument();
    fireEvent.click(themeButton);
    expect(screen.getByRole('dialog', { name: 'Football Breakout' })).toBeVisible();
  });
});
