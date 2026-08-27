import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description: 'How Predictotronix uses functional cookies and local storage.',
  alternates: { canonical: '/cookies' },
};

export default function CookiePage() {
  return (
    <article className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10">
      <header className="border-b pb-6">
        <p className="text-sm text-muted-foreground">Last updated 27 August 2026</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Cookie policy</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Predictotronix uses cookies and browser storage only to make the service work and remember
          choices you make. We do not use advertising, analytics, or cross-site tracking cookies.
        </p>
      </header>

      <div className="mt-8 space-y-8 leading-7">
        <section>
          <h2 className="text-xl font-semibold">What cookies are</h2>
          <p className="mt-2 text-muted-foreground">
            Cookies are small pieces of data stored by your browser. Local storage is a similar
            browser feature used to remember settings on your device. Neither is used here to build
            a profile of you or follow you across other websites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Cookies we use</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3 font-semibold">Cookie</th>
                  <th className="px-3 py-3 font-semibold">Purpose</th>
                  <th className="px-3 py-3 font-semibold">Typical duration</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b align-top">
                  <td className="px-3 py-3">Authentication/session cookies</td>
                  <td className="px-3 py-3">
                    Keep you signed in and securely refresh your session.
                  </td>
                  <td className="px-3 py-3">Session or the configured sign-in period</td>
                </tr>
                <tr className="border-b align-top">
                  <td className="px-3 py-3">Pending invitation</td>
                  <td className="px-3 py-3">
                    Remember a league invitation while you register or confirm your account.
                  </td>
                  <td className="px-3 py-3">Up to 7 days</td>
                </tr>
                <tr className="border-b align-top">
                  <td className="px-3 py-3">Administrator league and season</td>
                  <td className="px-3 py-3">
                    Remember the league and season selected in the administration area.
                  </td>
                  <td className="px-3 py-3">Up to 1 year</td>
                </tr>
                <tr className="align-top">
                  <td className="px-3 py-3">Administrator view mode</td>
                  <td className="px-3 py-3">
                    Temporarily remember when a super administrator is viewing a league-admin
                    experience.
                  </td>
                  <td className="px-3 py-3">Browser session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Local storage</h2>
          <p className="mt-2 text-muted-foreground">
            Predictotronix may store your chosen colour theme and accessibility display preference
            in local storage. These values stay on your device until you change them or clear your
            browser data. They are not used for tracking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Why there is no cookie banner</h2>
          <p className="mt-2 text-muted-foreground">
            The cookies used by Predictotronix are required to provide the service or remember a
            setting you requested. Because we do not set non-essential tracking or advertising
            cookies, there is no tracking-cookie consent banner.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Managing cookies</h2>
          <p className="mt-2 text-muted-foreground">
            You can delete or block cookies and local storage in your browser settings. Blocking
            authentication cookies will prevent sign-in, and clearing preferences will reset the
            related display or administrator choices. Consult your browser&apos;s help pages for
            exact instructions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Changes to this policy</h2>
          <p className="mt-2 text-muted-foreground">
            We will update this page if the storage used by Predictotronix changes. The date at the
            top will show when it was last revised.
          </p>
        </section>
      </div>
    </article>
  );
}
