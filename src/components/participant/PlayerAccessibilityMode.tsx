'use client';

import { useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'predictotronix-player-accessibility';

function readSavedPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function PlayerAccessibilityMode({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readSavedPreference());

    function syncPreference(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setEnabled(event.newValue === 'on');
    }

    window.addEventListener('storage', syncPreference);
    return () => window.removeEventListener('storage', syncPreference);
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
    <div
      className="player-accessibility"
      data-accessibility-mode={enabled ? 'enabled' : 'standard'}
    >
      <div className="player-accessibility__toolbar">
        <button
          type="button"
          className="player-accessibility__toggle"
          aria-pressed={enabled}
          aria-label={`Accessible mode: ${enabled ? 'On' : 'Off'}`}
          onClick={toggleAccessibilityMode}
        >
          <span className="player-accessibility__icon" aria-hidden="true">
            Aa
          </span>
          <span>Accessible mode</span>
          <span className="player-accessibility__state">{enabled ? 'On' : 'Off'}</span>
        </button>
      </div>
      <div className="player-accessibility__content">{children}</div>
    </div>
  );
}
