'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, type ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

interface FormSubmitButtonProps extends ComponentProps<'button'> {
  pendingLabel?: string;
}

export function FormSubmitButton({
  children,
  className,
  disabled,
  pendingLabel = 'Working…',
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      buttonRef.current?.closest('dialog')?.close();
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <button
      ref={buttonRef}
      type="submit"
      className={cn('inline-flex items-center justify-center gap-2', className)}
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </>
      ) : children}
    </button>
  );
}

export function FormPendingStatus({ label = 'Updating…' }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <span className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground" role="status" aria-live="polite">
      {pending && <><LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />{label}</>}
    </span>
  );
}
