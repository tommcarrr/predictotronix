'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Combine } from 'lucide-react';
import { AdminDialog } from '@/components/admin/AdminDialog';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export const PARTICIPANT_MERGE_CONFIRMATION = 'MERGE PARTICIPANTS';

type ParticipantOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export function ParticipantMergeDialog({
  leagueId,
  registeredParticipants,
  offlineParticipants,
  mergeAction,
}: {
  leagueId: string;
  registeredParticipants: ParticipantOption[];
  offlineParticipants: ParticipantOption[];
  mergeAction: (leagueId: string, formData: FormData) => Promise<void>;
}) {
  const [targetId, setTargetId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const target = useMemo(
    () => registeredParticipants.find((participant) => participant.id === targetId),
    [registeredParticipants, targetId]
  );
  const source = useMemo(
    () => offlineParticipants.find((participant) => participant.id === sourceId),
    [offlineParticipants, sourceId]
  );
  const canSubmit = Boolean(target && source && confirmation === PARTICIPANT_MERGE_CONFIRMATION);

  return (
    <AdminDialog
      trigger={
        <>
          <Combine className="size-4" />
          Merge accounts
        </>
      }
      title="Permanently merge participant records"
      description="Move an offline participant's entire history into a registered account."
      tone="danger"
    >
      <form action={mergeAction.bind(null, leagueId)} className="space-y-5">
        <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wide">This cannot be undone</p>
              <p className="text-sm font-medium">
                The offline participant record will be deleted. Its enrolments, predictions, audit
                history, notification history, and game data will become the registered user&apos;s
                data.
              </p>
              <p className="text-sm">
                Where both people have a prediction for the same fixture, the registered user&apos;s
                current prediction wins and the offline audit history is retained. The registered
                user&apos;s notification settings win; the better game score wins.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="merge-target-participant" className="text-sm font-semibold">
            Registered user receiving the data
          </label>
          <select
            id="merge-target-participant"
            name="target_participant_id"
            required
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Select a registered user…</option>
            {registeredParticipants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.displayName}
                {participant.email ? ` — ${participant.email}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="merge-source-participant" className="text-sm font-semibold">
            Offline participant that will be deleted
          </label>
          <select
            id="merge-source-participant"
            name="source_participant_id"
            required
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Select an offline participant…</option>
            {offlineParticipants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.displayName}
                {participant.email ? ` — ${participant.email}` : ''}
              </option>
            ))}
          </select>
        </div>

        {target && source && (
          <div className="rounded-xl border border-destructive/40 bg-muted/30 p-4 text-sm">
            <p>
              <strong>{source.displayName}</strong> will cease to exist as a separate participant.
            </p>
            <p className="mt-1">
              All migrated data will belong to <strong>{target.displayName}</strong>
              {target.email ? ` (${target.email})` : ''}.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="merge-confirmation" className="text-sm font-semibold">
            Type{' '}
            <span className="font-mono text-destructive">{PARTICIPANT_MERGE_CONFIRMATION}</span> to
            confirm
          </label>
          <input
            id="merge-confirmation"
            name="confirmation"
            required
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="w-full rounded-lg border border-destructive/60 bg-background px-3 py-2.5 font-mono text-sm"
          />
        </div>

        <div className="flex justify-end">
          <FormSubmitButton
            pendingLabel="Merging permanently…"
            disabled={!canSubmit}
            className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Permanently merge and delete offline record
          </FormSubmitButton>
        </div>
      </form>
    </AdminDialog>
  );
}
