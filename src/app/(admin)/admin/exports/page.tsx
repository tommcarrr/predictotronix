import { redirect } from 'next/navigation';
import { isSuperAdmin, getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { ExportPanel } from '@/components/admin/ExportPanel';

export const dynamic = 'force-dynamic';

export default async function ExportsAdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!(await isSuperAdmin())) redirect('/dashboard');

  const supabase = await createServiceClient();

  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name, status, league_id, leagues(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <a href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← Admin
        </a>
        <h1 className="text-2xl font-bold mt-1">Exports & Clipboard</h1>
      </div>

      <ExportPanel seasons={seasons ?? []} />
    </div>
  );
}
