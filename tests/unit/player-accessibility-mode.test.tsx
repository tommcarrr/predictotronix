import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SECRET_GAME_COOKIE } from '@/components/admin/secret-game-cookie';
import { SECRET_GAME_INVITE_DELAY_MS } from '@/components/admin/secret-game-gate';
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
    vi.useRealTimers();
    window.localStorage.clear();
    document.cookie = `${SECRET_GAME_COOKIE}=; Path=/; Max-Age=0`;
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

  it('makes the invitation more ridiculous every 30 seconds', () => {
    vi.useFakeTimers();
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
    for (let level = 1; level <= 4; level += 1) {
      act(() => vi.advanceTimersByTime(SECRET_GAME_INVITE_DELAY_MS));
      expect(toggle).toHaveAttribute('data-secret-game-hint', String(level));
    }

    act(() => vi.advanceTimersByTime(SECRET_GAME_INVITE_DELAY_MS));
    expect(toggle).toHaveAttribute('data-secret-game-hint', '4');
  });

  it('also intensifies after each press and launches on the fourth', () => {
    vi.useFakeTimers();
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
    expect(toggle).not.toHaveAttribute('data-secret-game-hint');

    act(() => vi.advanceTimersByTime(SECRET_GAME_INVITE_DELAY_MS));
    expect(toggle).toHaveAttribute('data-secret-game-hint', '1');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('data-secret-game-hint', '2');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('data-secret-game-hint', '3');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('data-secret-game-hint', '4');
    fireEvent.click(toggle);

    expect(screen.getByRole('dialog', { name: 'Football Breakout' })).toBeVisible();
    expect(document.cookie).toContain(`${SECRET_GAME_COOKIE}=1`);
    expect(toggle).not.toHaveAttribute('data-secret-game-hint');
  });

  it('uses the cookie only to suppress prompts, not four-click game entry', () => {
    vi.useFakeTimers();
    document.cookie = `${SECRET_GAME_COOKIE}=1; Path=/; Max-Age=7776000`;

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
    act(() => vi.advanceTimersByTime(SECRET_GAME_INVITE_DELAY_MS));
    expect(toggle).not.toHaveAttribute('data-secret-game-hint');

    for (let press = 0; press < 4; press += 1) fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: 'Football Breakout' })).toBeVisible();
  });
});
