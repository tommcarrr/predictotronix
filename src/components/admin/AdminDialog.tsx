'use client';

import { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminDialog({
  trigger,
  title,
  description,
  children,
  triggerClassName,
  tone = 'primary',
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  triggerClassName?: string;
  tone?: 'primary' | 'secondary' | 'danger';
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const tones = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'border border-border bg-card text-foreground hover:bg-accent',
    danger: 'border border-destructive/40 text-destructive hover:bg-destructive/10',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
          tones[tone],
          triggerClassName,
        )}
      >
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/55"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        onSubmitCapture={() => dialogRef.current?.close()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={`Close ${title}`}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </dialog>
    </>
  );
}
