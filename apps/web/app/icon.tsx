/**
 * Next.js 14 App-Router: Automatisches Favicon (32×32 PNG)
 * Wird als <link rel="icon"> injiziert — kein manuelles favicon.ico nötig.
 * Hardcodierte Farben: CSS-Variablen funktionieren im Edge-Runtime nicht.
 */
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: '#FF6B35',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
        {/* Schüssel */}
        <ellipse cx="32" cy="42" rx="16" ry="10" fill="white" opacity="0.95" />
        <ellipse cx="32" cy="40" rx="16" ry="10" fill="white" />
        <ellipse cx="32" cy="40" rx="11" ry="7" fill="#FF6B35" />
        {/* Deckel */}
        <path d="M18 32 Q18 24 32 24 Q46 24 46 32 Q46 34 32 34 Q18 34 18 32Z" fill="white" />
        {/* Kompass-Nadel */}
        <circle cx="32" cy="18" r="6" fill="white" opacity="0.9" />
        <path d="M32 13 L34 21 L32 19 L30 21Z" fill="#EF476F" />
      </svg>
    </div>,
    { ...size },
  );
}
