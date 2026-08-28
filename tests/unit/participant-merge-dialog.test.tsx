import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  PARTICIPANT_MERGE_CONFIRMATION,
  ParticipantMergeDialog,
} from '@/components/admin/ParticipantMergeDialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

describe('ParticipantMergeDialog', () => {
  it('requires both identities and the exact destructive confirmation phrase', () => {
    render(
      <ParticipantMergeDialog
        leagueId="league-id"
        registeredParticipants={[
          { id: 'registered-id', displayName: 'Registered Rob', email: 'rob@example.com' },
        ]}
        offlineParticipants={[{ id: 'offline-id', displayName: 'Offline Olivia', email: null }]}
        mergeAction={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Merge accounts' }));

    const submit = screen.getByRole('button', {
      name: 'Permanently merge and delete offline record',
    });
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Registered user receiving the data'), {
      target: { value: 'registered-id' },
    });
    fireEvent.change(screen.getByLabelText('Offline participant that will be deleted'), {
      target: { value: 'offline-id' },
    });
    fireEvent.change(screen.getByLabelText(/Type MERGE PARTICIPANTS to confirm/), {
      target: { value: 'merge participants' },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Type MERGE PARTICIPANTS to confirm/), {
      target: { value: PARTICIPANT_MERGE_CONFIRMATION },
    });
    expect(submit).toBeEnabled();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent === 'Offline Olivia will cease to exist as a separate participant.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/All migrated data will belong to/)).toHaveTextContent(
      'Registered Rob'
    );
  });
});
