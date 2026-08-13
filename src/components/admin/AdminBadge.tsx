import { cn } from '@/lib/utils';

type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
};

export function AdminBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): BadgeTone {
  if (status === 'active' || status === 'registered') return 'green';
  if (status === 'setup') return 'blue';
  if (status === 'completed') return 'purple';
  if (status === 'pending') return 'amber';
  if (status === 'inactive' || status === 'offline') return 'neutral';
  return 'neutral';
}
