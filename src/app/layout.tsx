import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const siteName = 'Predictotronix';
const description =
  'Predict Premier League scores. Your participation helps Predictotronix improve its understanding of human judgement.';

function getMetadataBase() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    return new URL(appUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'block',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'block',
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.fonts.ready.then(function(){document.documentElement.classList.add('fonts-loaded')}).catch(function(){document.documentElement.classList.add('fonts-loaded')});`,
          }}
        />
        <noscript>
          <style>{`body { visibility: visible !important; opacity: 1 !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}
