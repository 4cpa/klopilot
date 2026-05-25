import type { Viewport } from 'next';

/**
 * Karte-spezifisches Viewport: maximum-scale=1 verhindert, dass iOS-Safari
 * das Pinch-Zoom auf den Browser-Zoom statt auf die MapLibre-Karte anwendet.
 * Nur für /karte gesetzt — andere Seiten behalten normales Zoom-Verhalten.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function KarteLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: '100dvh', overflow: 'hidden' }}>{children}</div>;
}
