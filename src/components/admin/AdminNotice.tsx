import { cn } from '@/lib/utils';

export function AdminNotice({
  children,
  tone = 'info',
  role,
}: {
  children: React.ReactNode;
  tone?: 'info' | 'success' | 'danger';
  role?: 'alert' | 'status';
}) {
  return (
    <div
      role={role}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        tone === 'info' && 'border-border bg-muted/40 text-muted-foreground',
        tone === 'success' && 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400',
        tone === 'danger' && 'border-destructive/40 bg-destructive/10 text-destructive',
      )}
    >
      {children}
    </div>
  );
}
