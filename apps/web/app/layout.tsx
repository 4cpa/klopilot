import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { ThemeScript } from '@/components/ui/ThemeScript';
import { I18nProvider } from '@/components/ui/I18nProvider';
import { AuthProvider } from '@/components/ui/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // ermöglicht env(safe-area-inset-*) auf iPhone
};

export const metadata: Metadata = {
  title: 'klopilot — Toiletten-Guide',
  description:
    'Community-Plattform für öffentliche Toiletten. Finde, bewerte und teile saubere Toiletten in deiner Nähe — kostenlos, ohne Werbung.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'klopilot — Toiletten-Guide',
    description: 'Finde öffentliche Toiletten in deiner Nähe. Kostenlos, ohne Werbung.',
    siteName: 'klopilot.ch',
    locale: 'de_CH',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
