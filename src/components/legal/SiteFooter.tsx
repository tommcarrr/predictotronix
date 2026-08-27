import Link from 'next/link';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.status}>
          <span className={styles.signal} aria-hidden="true">
            ●
          </span>
          <span className={styles.playerLabel}>P100 info</span>
          <span className={styles.adminLabel}>Service information</span>
        </span>
        <nav aria-label="Legal information" className={styles.links}>
          <Link href="/privacy">Privacy</Link>
          <span className={styles.divider} aria-hidden="true">
            /
          </span>
          <Link href="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
