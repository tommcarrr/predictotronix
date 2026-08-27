import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t border-border/60 bg-background px-4 py-3 text-foreground">
      <nav
        aria-label="Legal information"
        className="mx-auto flex max-w-6xl items-center justify-center gap-4 text-xs text-muted-foreground"
      >
        <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/privacy">
          Privacy
        </Link>
        <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/cookies">
          Cookies
        </Link>
      </nav>
    </footer>
  );
}
