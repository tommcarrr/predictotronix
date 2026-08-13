'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Gauge,
  Moon,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from 'lucide-react';
import {
  setAdminLeague,
  setAdminSeason,
  stopViewingAsLeagueAdmin,
} from '@/app/(admin)/admin/context-actions';
import { FormSubmitButton, FormPendingStatus } from '@/components/ui/form-submit-button';

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
  viewingAsLeagueAdmin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  superOnly?: boolean;
}

const runNav: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Gauge, superOnly: true },
  { href: '/admin/participants', label: 'People', icon: Users },
  { href: '/admin/predictions', label: 'Predictions', icon: BarChart3, superOnly: true },
  { href: '/admin/fixtures', label: 'Fixtures & results', icon: CalendarDays, superOnly: true },
  { href: '/admin/exports', label: 'Standings', icon: Trophy, superOnly: true },
];

const configureNav: NavItem[] = [
  { href: '/admin/seasons', label: 'Seasons', icon: Sparkles, superOnly: true },
  { href: '/admin/leagues', label: 'Leagues', icon: Settings2, superOnly: true },
];

const systemNav: NavItem[] = [
  { href: '/admin/test-tools?tab=notifications', label: 'Notifications', icon: Bell, superOnly: true },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('predictotronix-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enabled = saved ? saved === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', enabled);
    const frame = requestAnimationFrame(() => setDark(enabled));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('predictotronix-theme', next ? 'dark' : 'light');
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground transition hover:bg-sidebar-accent"
      aria-label={dark ? 'Use light theme' : 'Use dark theme'}
      title={dark ? 'Use light theme' : 'Use dark theme'}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function Navigation({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return items.map((item) => {
    const itemPath = item.href.split('?')[0];
    const active = itemPath === '/admin' ? pathname === itemPath : pathname.startsWith(itemPath);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`}
      >
        <Icon
          className={`size-4 ${active ? '' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'}`}
        />
        <span>{item.label}</span>
      </Link>
    );
  });
}

export function AdminShell({
  children,
  email,
  leagues,
  seasons,
  selectedLeagueId,
  selectedSeasonId,
  superAdmin,
  viewingAsLeagueAdmin,
}: Props) {
  const pathname = usePathname();
  const visibleRun = runNav.filter((item) => superAdmin || !item.superOnly);
  const visibleConfigure = configureNav.filter((item) => superAdmin || !item.superOnly);
  const visibleSystem = systemNav.filter((item) => superAdmin || !item.superOnly);
  const selectedLeague = leagues.find((league) => league.id === selectedLeagueId);
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);

  return (
    <div className="admin-shell min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-bold tracking-tight">Predictotronix</span>
              <span className="block text-xs text-sidebar-foreground/55">Admin workspace</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-4 lg:pb-0"
          aria-label="Run the competition"
        >
          <Navigation items={visibleRun} pathname={pathname} />
        </nav>

        {(visibleConfigure.length > 0 || visibleSystem.length > 0) && (
          <details className="mx-3 mb-3 rounded-xl border border-sidebar-border lg:hidden">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-sidebar-foreground [&::-webkit-details-marker]:hidden">
              Manage workspace
            </summary>
            <div className="space-y-4 border-t border-sidebar-border px-2 py-2">
              {visibleConfigure.length > 0 && (
                <nav className="space-y-1" aria-label="Configure workspace">
                  <Navigation items={visibleConfigure} pathname={pathname} />
                </nav>
              )}
              {visibleSystem.length > 0 && (
                <nav className="space-y-1" aria-label="System tools">
                  <Navigation items={visibleSystem} pathname={pathname} />
                </nav>
              )}
            </div>
          </details>
        )}

        {visibleConfigure.length > 0 && (
          <div className="hidden lg:mt-6 lg:block lg:px-4">
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
              Configure
            </p>
            <nav className="space-y-1" aria-label="Configure workspace">
              <Navigation items={visibleConfigure} pathname={pathname} />
            </nav>
          </div>
        )}

        {visibleSystem.length > 0 && (
          <div className="hidden lg:mt-auto lg:block lg:px-4 lg:pb-3">
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
              System
            </p>
            <nav className="space-y-1" aria-label="System tools">
              <Navigation items={visibleSystem} pathname={pathname} />
            </nav>
          </div>
        )}

        <div className="hidden border-t border-sidebar-border p-4 lg:block">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/65 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-4" />
            Player dashboard
          </Link>
          <p className="mt-2 truncate px-3 text-xs text-sidebar-foreground/40">{email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          {viewingAsLeagueAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100 sm:px-6 lg:px-8 xl:px-10">
              <p className="text-sm font-medium">
                Viewing as league admin for {selectedLeague?.name ?? 'this league'}
              </p>
              <form action={stopViewingAsLeagueAdmin}>
                <FormSubmitButton
                  pendingLabel="Returning…"
                  className="rounded-lg border border-amber-400/70 bg-background/80 px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-background"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to superadmin
                </FormSubmitButton>
              </form>
            </div>
          )}
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Current workspace
              </p>
              <p className="truncate text-sm font-medium">
                {selectedLeague?.name ?? 'No league selected'}
                <span className="mx-1.5 text-muted-foreground">/</span>
                <span className="text-muted-foreground">
                  {selectedSeason?.name ?? 'No season selected'}
                </span>
              </p>
            </div>

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-xs transition hover:bg-accent [&::-webkit-details-marker]:hidden">
                <Settings2 className="size-4 text-primary" />
                <span className="hidden sm:inline">Change workspace</span>
                <ChevronDown className="size-3.5 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl">
                <p className="mb-3 text-sm font-semibold">Workspace context</p>
                <div className="space-y-3">
                  <form action={setAdminLeague} className="space-y-1.5">
                    <label
                      htmlFor="admin-league"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      League
                    </label>
                    <select
                      id="admin-league"
                      name="league_id"
                      value={selectedLeagueId ?? ''}
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                      disabled={!leagues.length}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-xs disabled:opacity-60"
                    >
                      {!leagues.length && <option value="">No leagues available</option>}
                      {leagues.map((league) => (
                        <option key={league.id} value={league.id}>
                          {league.name}
                        </option>
                      ))}
                    </select>
                    <FormPendingStatus label="Switching league…" />
                  </form>
                  <form action={setAdminSeason} className="space-y-1.5">
                    <label
                      htmlFor="admin-season"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Season
                    </label>
                    <select
                      id="admin-season"
                      name="season_id"
                      value={selectedSeasonId ?? ''}
                      onChange={(event) => event.currentTarget.form?.requestSubmit()}
                      disabled={!seasons.length}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-xs disabled:opacity-60"
                    >
                      {!seasons.length && <option value="">No seasons in this league</option>}
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name} · {season.status}
                        </option>
                      ))}
                    </select>
                    <FormPendingStatus label="Switching season…" />
                  </form>
                </div>
              </div>
            </details>

            <Link
              href="/dashboard"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs transition hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Player dashboard"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </div>

          {visibleSystem.length > 0 && (
            <nav
              className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 lg:hidden"
              aria-label="System administration"
            >
              <Navigation items={visibleSystem} pathname={pathname} />
            </nav>
          )}
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
