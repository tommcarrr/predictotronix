import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { submitJoinRequest } from './actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { getInviteLeague, inviteAuthPath, normalizeInviteCode } from '@/lib/invitations';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ requested?: string; rejected?: string; error?: string }>;
}

export default async function JoinPage({ params, searchParams }: Props) {
  const [{ code: rawCode }, { requested, error }] = await Promise.all([params, searchParams]);
  const code = normalizeInviteCode(rawCode);
  const league = code ? await getInviteLeague(code) : null;

  if (!code || !league) {
    return (
      <div className="login-ceefax w-full max-w-md space-y-4 p-8">
        <p className="login-ceefax__eyebrow text-xs">Predictotronix invitation</p>
        <h1 className="text-xl font-bold text-destructive">Invalid invite link</h1>
        <p className="text-sm text-muted-foreground">
          This invite link is no longer valid. Please ask your league admin for a new one.
        </p>
      </div>
    );
  }

  const user = await getUser();
  if (!user) {
    return (
      <div className="login-ceefax w-full max-w-md space-y-6 p-8">
        <div>
          <p className="login-ceefax__eyebrow text-xs">Predictotronix league invitation</p>
          <h1 className="text-2xl font-bold">You&apos;re invited to {league.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account or sign in, then we&apos;ll send your request to the league admin.
          </p>
        </div>

        <ol className="space-y-2 border-y border-border py-4 text-sm text-muted-foreground">
          <li><span className="text-primary">1.</span> Create your player account</li>
          <li><span className="text-primary">2.</span> The league admin approves your request</li>
          <li><span className="text-primary">3.</span> Start making predictions</li>
        </ol>

        <div className="space-y-3">
          <Link
            href={inviteAuthPath('/register', code)}
            className="login-ceefax__submit inline-flex w-full justify-center px-4 py-2 text-sm font-medium"
          >
            Create account and request to join
          </Link>
          <Link
            href={inviteAuthPath('/login', code)}
            className="inline-flex w-full justify-center border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Sign in to join
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Check if already a member or has pending request
  const { data: existingRequest } = await supabase
    .from('join_requests')
    .select('status')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRequest?.status === 'approved') {
    redirect('/dashboard?joined=1');
  }

  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">Predictotronix league invitation</p>
        <h1 className="text-2xl font-bold">Join {league.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your request will be reviewed by a league admin before you gain access.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {existingRequest?.status === 'pending' ? (
        <div role="status" className="space-y-2 rounded-md border border-primary p-4">
          <p className="font-medium text-primary">
            {requested === 'true' ? 'Request sent' : 'Request pending'}
          </p>
          <p className="text-sm text-muted-foreground">
            Your request to join {league.name} is waiting for admin approval.
          </p>
          <Link href="/dashboard" className="inline-block text-sm underline">Go to your dashboard</Link>
        </div>
      ) : existingRequest?.status === 'rejected' ? (
        <div className="rounded-md border border-destructive p-4">
          <p className="text-sm text-destructive">
            Your request to join {league.name} was not approved. Contact the league admin if you think this is a mistake.
          </p>
        </div>
      ) : (
        <form action={submitJoinRequest.bind(null, code)}>
          <FormSubmitButton
            pendingLabel="Sending request…"
            className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Request to join
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
}
