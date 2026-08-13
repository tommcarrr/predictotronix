import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminContext } from '@/lib/admin/context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await getAdminContext();

  return (
    <AdminShell
      email={context.user.email}
      leagues={context.leagues}
      seasons={context.seasons}
      selectedLeagueId={context.selectedLeague?.id ?? null}
      selectedSeasonId={context.selectedSeason?.id ?? null}
      superAdmin={context.superAdmin}
      viewingAsLeagueAdmin={context.viewingAsLeagueAdmin}
    >
      {children}
    </AdminShell>
  );
}
