import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

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
  title: {
    default: 'Predictotronix',
    template: '%s | Predictotronix',
  },
  description:
    'Predict Premier League scores, compete with friends, and follow live league standings.',
  applicationName: 'Predictotronix',
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
