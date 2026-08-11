'use client';

import { useActionState } from 'react';
import {
  initialSyncActionState,
  triggerFixtureSync,
  triggerResultSync,
  type SyncActionState,
} from '@/app/(admin)/admin/fixtures/actions';

function ConsoleOutput({ state }: { state: SyncActionState }) {
  const statusColour = {
    idle: 'text-muted-foreground',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  }[state.status];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-slate-200">
      <div className={`mb-3 ${statusColour}`} aria-live="polite">{state.message}</div>
      <div className="max-h-80 space-y-1 overflow-y-auto" role="log" aria-label="Backend sync log">
        {state.logs.length === 0 ? (
          <p className="text-slate-500">Waiting for a sync operation…</p>
        ) : state.logs.map((entry, index) => (
          <div key={`${entry.timestamp}-${index}`} className="break-words">
            <span className="text-slate-500">{new Date(entry.timestamp).toLocaleTimeString('en-GB')}</span>{' '}
            <span className={entry.level === 'error' ? 'text-red-400' : entry.level === 'warning' ? 'text-amber-400' : entry.level === 'success' ? 'text-green-400' : 'text-sky-400'}>
              [{entry.level.toUpperCase()}]
            </span>{' '}
            {entry.message}
            {entry.details && <span className="text-slate-400"> {JSON.stringify(entry.details)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FixtureSyncConsole({ seasonId, canSync }: { seasonId: string; canSync: boolean }) {
  const [fixtureState, fixtureAction, fixturePending] = useActionState(
    triggerFixtureSync.bind(null, seasonId),
    initialSyncActionState
  );
  const [resultState, resultAction, resultPending] = useActionState(
    triggerResultSync.bind(null, seasonId),
    initialSyncActionState
  );
  const state = resultState.status !== 'idle' ? resultState : fixtureState;
  const pending = fixturePending || resultPending;

  return (
    <section className="space-y-3" aria-labelledby="sync-console-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="sync-console-heading" className="text-lg font-semibold">Sync debugging console</h2>
          <p className="text-sm text-muted-foreground">Visible only to superadmins. Output is also written to backend logs.</p>
        </div>
        <div className="flex gap-2">
          <form action={fixtureAction}>
            <button type="submit" disabled={!canSync || pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {fixturePending ? 'Syncing fixtures…' : 'Sync Fixtures'}
            </button>
          </form>
          <form action={resultAction}>
            <button type="submit" disabled={!canSync || pending} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
              {resultPending ? 'Syncing results…' : 'Sync Results'}
            </button>
          </form>
        </div>
      </div>
      {!canSync && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Sync requires an active production season with both API-Football league and season values configured.
        </p>
      )}
      <ConsoleOutput state={state} />
    </section>
  );
}
