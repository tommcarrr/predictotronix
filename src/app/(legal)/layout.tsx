import Link from 'next/link';
import { PlayerAccessibilityMode } from '@/components/participant/PlayerAccessibilityMode';
import '@/styles/ceefax.css';
import styles from './legal.module.css';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerAccessibilityMode>
      <div className={`ceefax ${styles.shell}`}>
        <div className={styles.frame}>
          <header className={styles.masthead}>
            <div className={styles.serviceBar}>
              <Link className={styles.brand} href="/">
                <span className={styles.pageNumber}>P100</span>
                <span>Predictotronix</span>
              </Link>
              <p className={styles.serviceName}>Player information service</p>
            </div>
            <nav aria-label="Legal policies" className={styles.policyNav}>
              <Link className={styles.navLink} href="/privacy">
                Privacy
              </Link>
              <span aria-hidden="true">/</span>
              <Link className={styles.navLink} href="/cookies">
                Cookies
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </div>
    </PlayerAccessibilityMode>
  );
}
