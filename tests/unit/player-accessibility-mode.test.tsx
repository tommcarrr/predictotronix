import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PlayerAccessibilityMode,
  PlayerAccessibilityToggle,
} from '@/components/participant/PlayerAccessibilityMode';

vi.mock('@/components/admin/CeefaxBreakout', () => ({
  CeefaxBreakout: () => <div role="dialog" aria-label="Football Breakout" />,
}));

const STORAGE_KEY = 'predictotronix-player-accessibility';

describe('PlayerAccessibilityMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exposes a labelled pressed-state toggle', () => {
    render(
      <PlayerAccessibilityMode>
        <p>Player screen</p>
      </PlayerAccessibilityMode>
    );

    const toggle = screen.getByRole('button', { name: 'Accessible mode: Off' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle.closest('.player-accessibility')).toHaveAttribute(
      'data-accessibility-mode',
      'standard'
    );
  });

  it('persists the enabled mode and restores it on a later screen', async () => {
    const firstScreen = render(
      <PlayerAccessibilityMode>
        <p>Login</p>
      </PlayerAccessibilityMode>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accessible mode: Off' }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('on');
    expect(screen.getByRole('button', { name: 'Accessible mode: On' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    firstScreen.unmount();
    render(
      <PlayerAccessibilityMode>
        <p>Dashboard</p>
      </PlayerAccessibilityMode>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accessible mode: On' })).toBeInTheDocument();
    });
  });

  it('can render the toggle inside page content without a toolbar above it', () => {
    render(
      <PlayerAccessibilityMode showToolbarToggle={false}>
        <header>
          <PlayerAccessibilityToggle />
        </header>
      </PlayerAccessibilityMode>
    );

    expect(screen.getByRole('button', { name: 'Accessible mode: Off' })).toBeInTheDocument();
    expect(document.querySelector('.player-accessibility__toolbar')).not.toBeInTheDocument();
  });

  it('opens the league game after six consecutive mode changes', () => {
    render(
      <PlayerAccessibilityMode showToolbarToggle={false}>
        <PlayerAccessibilityToggle breakout={{
          leagueId: 'league-1',
          leagueName: 'North League',
          playerName: 'Player One',
        }} />
      </PlayerAccessibilityMode>
    );

    const toggle = screen.getByRole('button', { name: 'Accessible mode: Off' });
    for (let press = 0; press < 6; press += 1) fireEvent.click(toggle);

    expect(screen.getByRole('dialog', { name: 'Football Breakout' })).toBeVisible();
  });
});
