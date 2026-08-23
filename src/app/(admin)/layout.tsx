import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminContext } from '@/lib/admin/context';
import { getParticipant } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [context, participant] = await Promise.all([getAdminContext(), getParticipant()]);

  return (
    <AdminShell
      email={context.user.email}
      playerName={participant?.display_name ?? context.user.email ?? 'Player 1'}
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
