import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { ThemeScript } from '@/components/ui/ThemeScript';
import { I18nProvider } from '@/components/ui/I18nProvider';
import { AuthProvider } from '@/components/ui/AuthProvider';
import { SkipLink } from '@/components/ui/SkipLink';
import { MvpBanner } from '@/components/ui/MvpBanner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // ermöglicht env(safe-area-inset-*) auf iPhone
};

export const metadata: Metadata = {
  // metadataBase sorgt dafür dass relative OG-/Twitter-URLs korrekt aufgelöst werden
  // (z. B. /api/og → https://klopilot.ch/api/og für externe Crawler)
  metadataBase: new URL('https://klopilot.ch'),
  title: 'klopilot — Toiletten-Guide',
  description:
    'Community-Plattform für öffentliche Toiletten. Finde, bewerte und teile saubere Toiletten in deiner Nähe — kostenlos, ohne Werbung.',
  // Favicon: app/icon.tsx + app/apple-icon.tsx werden von Next.js automatisch
  // als <link rel="icon"> / <link rel="apple-touch-icon"> injiziert.
  // Kein manueller icons-Eintrag nötig — verhindert Konflikt mit /favicon.svg (404).
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    title: 'klopilot — Toiletten-Guide',
    description: 'Finde öffentliche Toiletten in deiner Nähe. Kostenlos, ohne Werbung.',
    siteName: 'klopilot.ch',
    locale: 'de_CH',
    type: 'website',
    url: 'https://klopilot.ch',
    // Default-Vorschaubild (DE) für alle Routen; die Landing-Seite überschreibt
    // es sprachabhängig (siehe app/page.tsx → app/api/og).
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'klopilot — Community-Toiletten-Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'klopilot — Toiletten-Guide',
    description: 'Finde öffentliche Toiletten in deiner Nähe. Kostenlos, ohne Werbung.',
    images: ['/api/og'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        {/* Skip-Link: für Tastatur-/Screenreader-Nutzer (WCAG 2.4.1) */}
        <SkipLink />
        <I18nProvider>
          <AuthProvider>
            <MvpBanner />
            {/* id="main-content" als Sprungziel des Skip-Links; paddingTop reserviert
                den Platz für den fixen MvpBanner (siehe --mvp-banner-h) */}
            <div id="main-content" style={{ paddingTop: 'var(--mvp-banner-h)' }}>
              {children}
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
