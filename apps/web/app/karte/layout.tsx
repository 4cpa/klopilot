import type { Viewport } from 'next';

/**
 * Pinch-Zoom bleibt erlaubt (WCAG 1.4.4/1.4.10) — MapLibre setzt selbst
 * `touch-action: none` auf den Canvas-Container (maplibre-gl.css), sodass der
 * Browser die Geste dort ohnehin nicht abgreift. Der frühere
 * maximumScale/userScalable-Hack war unnötig und blockierte sehbeeinträchtigten
 * Nutzer:innen jedes Vergrössern der restlichen UI (AppBar, Sheets, …).
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function KarteLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: '100dvh', overflow: 'hidden' }}>{children}</div>;
}
