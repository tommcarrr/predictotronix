import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
          <Link className="font-semibold tracking-tight" href="/">
            Predictotronix
          </Link>
          <nav aria-label="Legal policies" className="flex gap-4 text-sm text-muted-foreground">
            <Link
              className="underline-offset-4 hover:text-foreground hover:underline"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="underline-offset-4 hover:text-foreground hover:underline"
              href="/cookies"
            >
              Cookies
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
