import type { Metadata } from 'next';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description: 'How Predictotronix uses functional cookies and local storage.',
  alternates: { canonical: '/cookies' },
};

export default function CookiePage() {
  return (
    <article className={styles.policy}>
      <header className={styles.pageHeader}>
        <p className={styles.updated}>Last updated 27 August 2026</p>
        <h1 className={styles.pageTitle}>Cookie policy</h1>
        <p className={styles.intro}>
          Predictotronix uses cookies and browser storage only to make the service work and remember
          choices you make. We do not use advertising, analytics, or cross-site tracking cookies.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What cookies are</h2>
          <p className={styles.copy}>
            Cookies are small pieces of data stored by your browser. Local storage is a similar
            browser feature used to remember settings on your device. Neither is used here to build
            a profile of you or follow you across other websites.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cookies we use</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Typical duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Authentication/session cookies</td>
                  <td>Keep you signed in and securely refresh your session.</td>
                  <td>Session or the configured sign-in period</td>
                </tr>
                <tr>
                  <td>Pending invitation</td>
                  <td>Remember a league invitation while you register or confirm your account.</td>
                  <td>Up to 7 days</td>
                </tr>
                <tr>
                  <td>Administrator league and season</td>
                  <td>Remember the league and season selected in the administration area.</td>
                  <td>Up to 1 year</td>
                </tr>
                <tr>
                  <td>Administrator view mode</td>
                  <td>
                    Temporarily remember when a super administrator is viewing a league-admin
                    experience.
                  </td>
                  <td>Browser session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Local storage</h2>
          <p className={styles.copy}>
            Predictotronix may store your chosen colour theme and accessibility display preference
            in local storage. These values stay on your device until you change them or clear your
            browser data. They are not used for tracking.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why there is no cookie banner</h2>
          <p className={styles.copy}>
            The cookies used by Predictotronix are required to provide the service or remember a
            setting you requested. Because we do not set non-essential tracking or advertising
            cookies, there is no tracking-cookie consent banner.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Managing cookies</h2>
          <p className={styles.copy}>
            You can delete or block cookies and local storage in your browser settings. Blocking
            authentication cookies will prevent sign-in, and clearing preferences will reset the
            related display or administrator choices. Consult your browser&apos;s help pages for
            exact instructions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes to this policy</h2>
          <p className={styles.copy}>
            We will update this page if the storage used by Predictotronix changes. The date at the
            top will show when it was last revised.
          </p>
        </section>
      </div>
    </article>
  );
}
