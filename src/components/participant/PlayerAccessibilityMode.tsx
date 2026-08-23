'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ALargeSmall } from 'lucide-react';
import { CeefaxBreakout } from '@/components/admin/CeefaxBreakout';
import {
  registerSecretGamePress,
  type SecretGameGateState,
} from '@/components/admin/secret-game-gate';

const STORAGE_KEY = 'predictotronix-player-accessibility';

interface AccessibilityContextValue {
  enabled: boolean;
  toggle: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function readSavedPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

interface BreakoutContext {
  leagueId: string;
  leagueName: string;
  playerName: string;
}

export function PlayerAccessibilityToggle({ breakout }: { breakout?: BreakoutContext }) {
  const accessibility = useContext(AccessibilityContext);
  const [gameOpen, setGameOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const secretGate = useRef<SecretGameGateState>({ count: 0, lastPressedAt: 0 });

  useEffect(() => {
    function resetSequenceOnOtherPress(event: PointerEvent) {
      if (!buttonRef.current?.contains(event.target as Node)) {
        secretGate.current = { count: 0, lastPressedAt: 0 };
      }
    }
    document.addEventListener('pointerdown', resetSequenceOnOtherPress, true);
    return () => document.removeEventListener('pointerdown', resetSequenceOnOtherPress, true);
  }, []);

  if (!accessibility) return null;

  const { enabled, toggle } = accessibility;

  function handleToggle() {
    toggle();
    const result = registerSecretGamePress(secretGate.current, performance.now());
    secretGate.current = result.state;
    if (result.unlocked && breakout) setGameOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="player-accessibility__toggle"
        aria-pressed={enabled}
        aria-label={`Accessible mode: ${enabled ? 'On' : 'Off'}`}
        title={`Accessible mode: ${enabled ? 'On' : 'Off'}`}
        onClick={handleToggle}
      >
        <ALargeSmall className="player-accessibility__icon" aria-hidden="true" />
      </button>
      {gameOpen && breakout && (
        <CeefaxBreakout
          playerName={breakout.playerName}
          leagueId={breakout.leagueId}
          leagueName={breakout.leagueName}
          onClose={() => setGameOpen(false)}
        />
      )}
    </>
  );
}

export function PlayerAccessibilityMode({
  children,
  showToolbarToggle = true,
}: {
  children: ReactNode;
  showToolbarToggle?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      setEnabled(readSavedPreference());
    }, 0);

    function syncPreference(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setEnabled(event.newValue === 'on');
    }

    window.addEventListener('storage', syncPreference);
    return () => {
      window.clearTimeout(preferenceTimer);
      window.removeEventListener('storage', syncPreference);
    };
  }, []);

  function toggleAccessibilityMode() {
    const next = !enabled;

    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // The preference still works for this page when storage is unavailable.
    }

    setEnabled(next);
  }

  return (
    <AccessibilityContext value={{ enabled, toggle: toggleAccessibilityMode }}>
      <div
        className="player-accessibility"
        data-accessibility-mode={enabled ? 'enabled' : 'standard'}
        data-has-accessibility-toolbar={showToolbarToggle ? 'true' : 'false'}
      >
        {showToolbarToggle && (
          <div className="player-accessibility__toolbar">
            <PlayerAccessibilityToggle />
          </div>
        )}
        <div className="player-accessibility__content">{children}</div>
      </div>
    </AccessibilityContext>
  );
}
