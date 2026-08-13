import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface AdminTabItem {
  href: string;
  label: string;
  count?: number;
}

export function AdminTabs({ items, activeHref, label }: { items: AdminTabItem[]; activeHref: string; label: string }) {
  return (
    <nav aria-label={label} className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.68rem] font-bold text-primary">
                  {item.count}
                </span>
              )}
              {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
