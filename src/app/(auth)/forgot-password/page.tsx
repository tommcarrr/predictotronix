import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { requestPasswordReset } from '@/lib/auth/actions';
import { inviteAuthPath, normalizeInviteCode } from '@/lib/invitations';
import Link from 'next/link';

export const metadata = {
  title: 'Reset your password',
  description: 'Request a password reset link for your Predictotronix account.',
};

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; message?: string; error?: string }>;
}) {
  const { invite: rawInvite, message, error } = await searchParams;
  const inviteCode = normalizeInviteCode(rawInvite);

  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">Predictotronix account recovery</p>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we will send you a secure reset link.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <form action={requestPasswordReset} className="space-y-4">
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

        <FormSubmitButton
          pendingLabel="Sending reset link…"
          className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Send reset link
        </FormSubmitButton>
      </form>

      <p className="text-center text-sm">
        <Link
          href={inviteCode ? inviteAuthPath('/login', inviteCode) : '/login'}
          className="underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
