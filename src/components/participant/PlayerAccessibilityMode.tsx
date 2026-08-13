'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Accessibility } from 'lucide-react';

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

export function PlayerAccessibilityToggle() {
  const accessibility = useContext(AccessibilityContext);
  if (!accessibility) return null;

  const { enabled, toggle } = accessibility;

  return (
    <button
      type="button"
      className="player-accessibility__toggle"
      aria-pressed={enabled}
      aria-label={`Accessible mode: ${enabled ? 'On' : 'Off'}`}
      title={`Accessible mode: ${enabled ? 'On' : 'Off'}`}
      onClick={toggle}
    >
      <Accessibility className="player-accessibility__icon" aria-hidden="true" />
    </button>
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
