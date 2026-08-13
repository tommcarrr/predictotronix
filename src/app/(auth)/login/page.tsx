import { signIn } from '@/lib/auth/actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to make predictions and view your Predictotronix leagues.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { message, error } = await searchParams;
  return (
    <div className="login-ceefax w-full max-w-md space-y-6 p-8">
      <div>
        <p className="login-ceefax__eyebrow text-xs">Predictotronix player access</p>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and password to continue.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      {message && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p>
      )}

      <form action={signIn} className="space-y-4">
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
            autoComplete="current-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <FormSubmitButton
          pendingLabel="Signing in…"
          className="login-ceefax__submit w-full px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Sign in
        </FormSubmitButton>
      </form>

      <p className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <a href="/register" className="underline">
          Register
        </a>
      </p>
    </div>
  );
}
