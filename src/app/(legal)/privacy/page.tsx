import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Predictotronix collects, uses, and protects personal data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <article className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10">
      <header className="border-b pb-6">
        <p className="text-sm text-muted-foreground">Last updated 27 August 2026</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Predictotronix is a private football prediction service. We use personal data only to
          provide, secure, and support the service. We do not sell it, use it for advertising, or
          share it for unrelated purposes.
        </p>
      </header>

      <div className="mt-8 space-y-8 leading-7">
        <section>
          <h2 className="text-xl font-semibold">Who is responsible for your data</h2>
          <p className="mt-2 text-muted-foreground">
            The operator of Predictotronix is responsible for the service. League administrators can
            access the information needed to run their leagues, including membership, predictions,
            and standings. If you have a privacy question or request, contact the person who invited
            you or your league administrator, who can pass it to the service operator where
            necessary.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Data we collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Your display name, email address, and optional mobile number.</li>
            <li>Account, league membership, join request, and administrator-role information.</li>
            <li>Your predictions, scores, standings, and related league activity.</li>
            <li>Your notification choices and basic delivery records.</li>
            <li>
              Essential technical information used for authentication, security, and reliable
              operation of the service.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Most of this information comes from you. A league administrator may also create an
            offline participant record or enter a prediction on a player&apos;s behalf, and the
            service generates scores and delivery records as it operates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How we use it</h2>
          <p className="mt-2 text-muted-foreground">We use this information only to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Create and secure your account.</li>
            <li>Run leagues, accept predictions, calculate scores, and show standings.</li>
            <li>Send service messages and prediction reminders according to your settings.</li>
            <li>Respond to support requests, prevent misuse, and keep the service reliable.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            We rely on providing the service and our legitimate interest in operating it safely.
            Where consent is required for an optional notification, you can change your choice at
            any time in notification settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">When data is shared</h2>
          <p className="mt-2 text-muted-foreground">
            We do not share personal data for marketing, advertising, analytics, data brokerage, or
            profiling. Limited information is processed by infrastructure providers solely to host,
            store, secure, and back up the service. For notifications:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Resend</strong> receives the relevant recipient
              email address and the notification content needed to deliver an email.
            </li>
            <li>
              <strong className="text-foreground">Twilio</strong> receives the relevant recipient
              mobile number and the notification content needed to deliver an SMS.
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            These providers process that information only to deliver and report on the requested
            notification. We may also disclose information if required by law or to protect the
            security and rights of users, but never for commercial resale.
          </p>
          <p className="mt-3 text-muted-foreground">
            A provider may process information outside the UK. Where data protection law requires
            it, we rely on recognised transfer arrangements and contractual safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How long we keep data</h2>
          <p className="mt-2 text-muted-foreground">
            We keep account and league data while it is needed to operate Predictotronix and
            preserve the relevant league record. If your account or data is no longer needed, you
            can ask for it to be deleted. Limited backup, security, or legal records may remain for
            a short period where reasonably necessary.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="mt-2 text-muted-foreground">
            We use access controls, authenticated sessions, and reputable service providers to
            protect personal data. No online service can promise absolute security, but access is
            limited to people and systems that need it to operate Predictotronix.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Your choices and rights</h2>
          <p className="mt-2 text-muted-foreground">
            You can update notification preferences in the service. Depending on where you live, you
            may also ask to access, correct, delete, restrict, or receive a copy of your data, or
            object to how it is used. Contact your league administrator or the person who operates
            your Predictotronix service to make a request. You may also complain to your local data
            protection authority, including the{' '}
            <a
              className="font-medium text-foreground underline underline-offset-4"
              href="https://ico.org.uk/make-a-complaint/data-protection-complaints/"
            >
              Information Commissioner&apos;s Office
            </a>{' '}
            in the UK.
          </p>
          <p className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground">
            You have the right to object to processing based on legitimate interests. Raise this
            with the service operator through your league administrator.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Required information and automated scoring</h2>
          <p className="mt-2 text-muted-foreground">
            An email address is needed for an online account; a mobile number is optional and is
            needed only for SMS reminders. Scores and standings are calculated automatically from
            submitted predictions and fixture results under the league&apos;s scoring rules. We do
            not use solely automated decisions that have legal or similarly significant effects on
            you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Changes to this policy</h2>
          <p className="mt-2 text-muted-foreground">
            We may update this policy if the service or its legal obligations change. The date at
            the top will show when it was last revised.
          </p>
        </section>
      </div>
    </article>
  );
}
