import { signIn } from '@/lib/auth/actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import Link from 'next/link';
import { getInviteLeague, inviteAuthPath, normalizeInviteCode } from '@/lib/invitations';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to make predictions and view your Predictotronix leagues.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; invite?: string }>;
}) {
  const { message, error, invite: rawInvite } = await searchParams;
  const inviteCode = normalizeInviteCode(rawInvite);
  const league = inviteCode ? await getInviteLeague(inviteCode) : null;

  if (rawInvite && (!inviteCode || !league)) {
    return (
      <div className="login-ceefax w-full max-w-md space-y-5 p-8">
        <p className="login-ceefax__eyebrow text-xs">Predictotronix invitation</p>
        <h1 className="text-2xl font-bold text-destructive">This invite is no longer valid</h1>
        <p className="text-sm text-muted-foreground">
          Ask your league admin for a new link. You can still sign in to your existing leagues.
        </p>
        <Link href="/login" className="login-ceefax__submit inline-flex w-full justify-center px-4 py-2 text-sm font-medium">
          Sign in without this invite
        </Link>
      </div>
    );
  }

  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">
          {league ? 'Predictotronix league invitation' : 'Predictotronix player access'}
        </p>
        <h1 className="text-2xl font-bold">
          {league ? `Join ${league.name}` : 'Sign in'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {league
            ? 'Sign in and we will send your request to the league admin.'
            : 'Enter your email and password to continue.'}
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p>
      )}

      <form action={signIn} className="space-y-4">
        {inviteCode && <input type="hidden" name="invite_code" value={inviteCode} />}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href={
                inviteCode ? inviteAuthPath('/forgot-password', inviteCode) : '/forgot-password'
              }
              className="text-sm underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FormSubmitButton
          pendingLabel="Signing in…"
          className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Sign in{league ? ' and request to join' : ''}
        </FormSubmitButton>
      </form>

      <p className="text-center text-sm">
        {league && inviteCode ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href={inviteAuthPath('/register', inviteCode)} className="underline">
              Create an account to join
            </Link>
          </>
        ) : (
          'Need an account? Ask your league admin for an invitation link.'
        )}
      </p>
    </div>
  );
}
