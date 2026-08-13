import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InviteLinkCopy } from '@/components/admin/InviteLinkCopy';

const inviteUrl = 'https://predictotronix.example/join/friendly-code';
const writeText = vi.fn();

describe('InviteLinkCopy', () => {
  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('copies the full invite URL and confirms success', async () => {
    writeText.mockResolvedValue(undefined);
    render(<InviteLinkCopy inviteUrl={inviteUrl} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(writeText).toHaveBeenCalledWith(inviteUrl);
    expect(await screen.findByRole('button', { name: 'Invite link copied' })).toHaveTextContent('Copied!');
    expect(screen.getByText('Invite link copied to clipboard.')).toBeInTheDocument();
  });

  it('keeps the link selectable and gives useful feedback when copying fails', async () => {
    writeText.mockRejectedValue(new Error('Clipboard unavailable'));
    render(<InviteLinkCopy inviteUrl={inviteUrl} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(await screen.findByText('Could not copy the link. Select it above and copy it manually.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'League invite link' })).toHaveValue(inviteUrl);
  });
});
