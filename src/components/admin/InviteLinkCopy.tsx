'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  inviteUrl: string;
}

type CopyStatus = 'idle' | 'copied' | 'error';

export function InviteLinkCopy({ inviteUrl }: Props) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setStatus('copied');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted p-1.5 pl-3 shadow-xs focus-within:ring-2 focus-within:ring-ring">
        <input
          aria-label="League invite link"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={inviteUrl}
        />
        <button
          type="button"
          onClick={copyInviteLink}
          aria-label={status === 'copied' ? 'Invite link copied' : 'Copy invite link'}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {status === 'copied' ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{status === 'copied' ? 'Copied!' : 'Copy link'}</span>
        </button>
      </div>
      <p aria-live="polite" className={`mt-2 text-xs ${status === 'error' ? 'text-destructive' : 'sr-only'}`}>
        {status === 'copied'
          ? 'Invite link copied to clipboard.'
          : status === 'error'
            ? 'Could not copy the link. Select it above and copy it manually.'
            : ''}
      </p>
    </div>
  );
}
