import { FormSubmitButton } from '@/components/ui/form-submit-button';
import { updatePassword } from '@/lib/auth/actions';
import { getUser } from '@/lib/auth';
import { normalizeInviteCode, withInviteParam } from '@/lib/invitations';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Choose a new password',
  description: 'Choose a new password for your Predictotronix account.',
};

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; error?: string }>;
}) {
  const { invite: rawInvite, error } = await searchParams;
  const inviteCode = normalizeInviteCode(rawInvite);
  const user = await getUser();

  if (!user) {
    redirect(
      withInviteParam(
        '/forgot-password',
        inviteCode,
        'error',
        'This password reset link is invalid or has expired. Request a new one.'
      )
    );
  }

  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">Predictotronix account recovery</p>
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use at least 8 characters. You will sign in again after updating it.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={updatePassword} className="space-y-4">
        {inviteCode && <input type="hidden" name="invite_code" value={inviteCode} />}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm_password" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FormSubmitButton
          pendingLabel="Updating password…"
          className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Update password
        </FormSubmitButton>
      </form>
    </div>
  );
}
