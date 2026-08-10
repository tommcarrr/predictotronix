import { ExportPanel } from '@/components/admin/ExportPanel';
import { getAdminContext } from '@/lib/admin/context';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Exports | Admin' };

export const dynamic = 'force-dynamic';

export default async function ExportsAdminPage() {
  const { selectedLeague, selectedSeason, superAdmin } = await getAdminContext();
  if (!superAdmin) redirect('/admin/participants');

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Exports & Clipboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedLeague?.name ?? 'No league'} · {selectedSeason?.name ?? 'No season selected'}
        </p>
      </div>

      {selectedSeason ? (
        <ExportPanel key={selectedSeason.id} seasonId={selectedSeason.id} />
      ) : (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Select or create a season before generating exports.
        </p>
      )}
    </main>
  );
}
