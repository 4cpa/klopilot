/**
 * Next.js 14: Apple Touch Icon (180×180 PNG)
 * Wird als <link rel="apple-touch-icon"> injiziert.
 */
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: '#FF6B35',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="42" rx="16" ry="10" fill="white" opacity="0.95" />
        <ellipse cx="32" cy="40" rx="16" ry="10" fill="white" />
        <ellipse cx="32" cy="40" rx="11" ry="7" fill="#FF6B35" />
        <path d="M18 32 Q18 24 32 24 Q46 24 46 32 Q46 34 32 34 Q18 34 18 32Z" fill="white" />
        <circle cx="32" cy="18" r="6" fill="white" opacity="0.9" />
        <path d="M32 13 L34 21 L32 19 L30 21Z" fill="#EF476F" />
      </svg>
    </div>,
    { ...size },
  );
}
