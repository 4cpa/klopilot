import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'klopilot — Toiletten-Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFBF2',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          right: -80,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,214,160,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 28,
          background: '#FF6B35',
          marginBottom: 32,
          boxShadow: '0 16px 48px rgba(255,107,53,0.4)',
        }}
      >
        {/* Toilet bowl */}
        <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="42" rx="16" ry="10" fill="white" opacity="0.95" />
          <ellipse cx="32" cy="40" rx="16" ry="10" fill="white" />
          <ellipse cx="32" cy="40" rx="11" ry="7" fill="#FF6B35" />
          <path d="M18 32 Q18 24 32 24 Q46 24 46 32 Q46 34 32 34 Q18 34 18 32Z" fill="white" />
          <circle cx="32" cy="18" r="6" fill="white" opacity="0.9" />
          <path d="M32 13 L34 21 L32 19 L30 21Z" fill="#EF476F" />
          <path d="M32 23 L30 15 L32 17 L34 15Z" fill="white" opacity="0.5" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: '#0B132B',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        klopilot
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          color: '#6B7280',
          fontWeight: 500,
          marginBottom: 40,
        }}
      >
        Toiletten-Guide · kostenlos · ohne Werbung
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 12 }}>
        {['🌸 Bewertungen', '🗺️ Karte', '♿ Barrierefrei', '🔍 Suche'].map((tag) => (
          <div
            key={tag}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              background: '#FFF3DC',
              border: '1.5px solid #E7E0CF',
              fontSize: 18,
              fontWeight: 600,
              color: '#0B132B',
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* URL badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 18,
          color: '#FF6B35',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        klopilot.ch
      </div>
    </div>,
    { ...size },
  );
}
