import { signUp } from '@/lib/auth/actions';

export const metadata = {
  title: 'Create an account',
  description: 'Create a Predictotronix account and join a predictor league.',
};

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register to join a predictor league.
        </p>
      </div>

      <form action={signUp} className="space-y-4">
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

        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Create account
        </button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <a href="/login" className="underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
