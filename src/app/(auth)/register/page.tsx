import { signUp } from '@/lib/auth/actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';
import Link from 'next/link';
import { getInviteLeague, inviteAuthPath, normalizeInviteCode } from '@/lib/invitations';

export const metadata = {
  title: 'Create an account',
  description: 'Create a Predictotronix account and join a predictor league.',
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ invite?: string; error?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { invite: rawInvite, error } = await searchParams;
  const inviteCode = normalizeInviteCode(rawInvite);
  const league = inviteCode ? await getInviteLeague(inviteCode) : null;

  if (!inviteCode || !league) {
    const invalidInvite = Boolean(rawInvite);
    return (
      <div className="login-ceefax w-full max-w-md space-y-5 p-8">
        <p className="login-ceefax__eyebrow text-xs">Predictotronix invitation</p>
        <h1 className="text-2xl font-bold text-destructive">
          {invalidInvite ? 'This invite is no longer valid' : 'Invitation required'}
        </h1>
        {error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {invalidInvite
            ? 'Ask your league admin for a new link before creating an account.'
            : 'Ask your league admin for an invitation link before creating an account.'}
        </p>
        <Link
          href="/login"
          className="login-ceefax__submit inline-flex w-full justify-center px-4 py-2 text-sm font-medium"
        >
          Sign in to an existing account
        </Link>
      </div>
    );
  }

  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">
          {league ? 'Predictotronix league invitation' : 'Predictotronix player registration'}
        </p>
        <h1 className="text-2xl font-bold">
          {league ? `Join ${league.name}` : 'Create an account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {league
            ? 'Create your account and we will send your request to the league admin.'
            : 'Register to join a predictor league.'}
        </p>
      </div>

      {league && (
        <ol className="space-y-2 border-y border-border py-4 text-sm text-muted-foreground">
          <li><span className="text-primary">1.</span> Create your player account</li>
          <li><span className="text-primary">2.</span> The league admin approves your request</li>
          <li><span className="text-primary">3.</span> Start making predictions</li>
        </ol>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={signUp} className="space-y-4">
        <input type="hidden" name="invite_code" value={inviteCode} />
        <div className="space-y-1">
          <label htmlFor="display_name" className="text-sm font-medium">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

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
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FormSubmitButton
          pendingLabel="Creating account…"
          className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Create account
          {league ? ' and request to join' : ''}
        </FormSubmitButton>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href={inviteCode ? inviteAuthPath('/login', inviteCode) : '/login'} className="underline">
          {league ? 'Sign in to join' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}
