import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { submitJoinRequest } from './actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const user = await getUser();
  if (!user) redirect(`/register?from=/join/${code}`);

  const supabase = await createClient();

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, invite_active')
    .eq('invite_code', code)
    .single();

  if (!league || !league.invite_active) {
    return (
      <div className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-xl font-bold text-destructive">Invalid invite link</h1>
        <p className="text-sm text-muted-foreground">
          This invite link is no longer valid. Please ask your league admin for a new one.
        </p>
      </div>
    );
  }

  // Check if already a member or has pending request
  const { data: existingRequest } = await supabase
    .from('join_requests')
    .select('status')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRequest?.status === 'approved') {
    redirect('/dashboard');
  }

  return (
    <div className="w-full max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Join {league.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your request will be reviewed by a league admin before you gain access.
        </p>
      </div>

      {existingRequest?.status === 'pending' ? (
        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Your join request is pending admin approval.
          </p>
        </div>
      ) : existingRequest?.status === 'rejected' ? (
        <div className="rounded-md border border-destructive p-4">
          <p className="text-sm text-destructive">
            Your previous request was rejected. Contact the league admin.
          </p>
        </div>
      ) : (
        <form action={submitJoinRequest.bind(null, league.id, code)}>
          <FormSubmitButton
            pendingLabel="Sending request…"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Request to join
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
}
