'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { setAdminLeague, setAdminSeason } from '@/app/(admin)/admin/context-actions';

interface Option {
  id: string;
  name: string;
}

interface SeasonOption extends Option {
  status: string;
}

interface Props {
  children: React.ReactNode;
  email: string | undefined;
  leagues: Option[];
  seasons: SeasonOption[];
  selectedLeagueId: string | null;
  selectedSeasonId: string | null;
  superAdmin: boolean;
}

const navItems = [
  { href: '/admin', label: 'Overview', superOnly: true },
  { href: '/admin/leagues', label: 'Leagues', superOnly: true },
  { href: '/admin/seasons', label: 'Seasons', superOnly: true },
  { href: '/admin/participants', label: 'Participants' },
  { href: '/admin/predictions', label: 'Predictions', superOnly: true },
  { href: '/admin/fixtures', label: 'Fixtures & results', superOnly: true },
  { href: '/admin/exports', label: 'Standings', superOnly: true },
  { href: '/admin/test-tools', label: 'Test tools', superOnly: true },
];

export function AdminShell({
  children,
  email,
  leagues,
  seasons,
  selectedLeagueId,
  selectedSeasonId,
  superAdmin,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/admin" className="text-lg font-bold tracking-tight">
                Predictotronix Admin
              </Link>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Player dashboard
            </Link>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Admin navigation">
            {navItems.filter((item) => superAdmin || !item.superOnly).map((item) => {
              const active =
                item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-3 sm:grid-cols-2 sm:px-6">
            <form action={setAdminLeague} className="space-y-1">
              <label htmlFor="admin-league" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Working league
              </label>
              <select
                id="admin-league"
                name="league_id"
                value={selectedLeagueId ?? ''}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                disabled={!leagues.length}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                {!leagues.length && <option value="">No leagues available</option>}
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>
            </form>

            <form action={setAdminSeason} className="space-y-1">
              <label htmlFor="admin-season" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Working season
              </label>
              <select
                id="admin-season"
                name="season_id"
                value={selectedSeasonId ?? ''}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                disabled={!seasons.length}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                {!seasons.length && <option value="">No seasons in this league</option>}
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} · {season.status}
                  </option>
                ))}
              </select>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
