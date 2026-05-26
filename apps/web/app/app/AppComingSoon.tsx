'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export function AppComingSoon() {
  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px 120px',
          background: 'var(--bg)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-deep) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            marginBottom: 36,
            boxShadow: '0 12px 40px rgba(255,107,53,0.30)',
          }}
          aria-hidden
        >
          🚽
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 999,
            background: 'rgba(255,107,53,0.10)',
            border: '1px solid rgba(255,107,53,0.30)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--brand-primary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          In Kürze verfügbar
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(36px, 6vw, 60px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: 640,
          }}
        >
          klopilot
          <br />
          Mobile App
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 18,
            color: 'var(--muted)',
            maxWidth: 480,
            lineHeight: 1.7,
            marginBottom: 48,
          }}
        >
          Toiletten finden, bewerten und melden — jetzt auch als native App für iOS und Android. Mit
          Offline-Caching, Push-Benachrichtigungen und Gamification.
        </p>

        {/* Store badges (placeholder) */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 56,
          }}
        >
          {[
            { label: 'App Store', sub: 'iOS — coming soon', icon: '🍎' },
            { label: 'Google Play', sub: 'Android — coming soon', icon: '🤖' },
          ].map(({ label, sub, icon }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 24px',
                borderRadius: 14,
                border: '1.5px solid var(--line)',
                background: 'var(--surface)',
                opacity: 0.55,
                cursor: 'not-allowed',
                minWidth: 180,
              }}
              title="Noch nicht verfügbar"
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{sub}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 52,
          }}
        >
          {[
            '📍 Karte & Marker',
            '🔎 Suche',
            '🌸 Bewertungen',
            '📷 Foto-Upload',
            '🔔 Push',
            '📶 Offline',
            '🏆 Gamification',
            '🌙 Dark Mode',
            '🌍 DE / FR / IT / EN',
          ].map((chip) => (
            <span
              key={chip}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                fontSize: 13,
                color: 'var(--ink)',
                fontWeight: 500,
              }}
            >
              {chip}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/karte"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              borderRadius: 12,
              background: 'var(--brand-primary)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            🗺️ Zur Web-Version
          </a>
          <a
            href="mailto:admin@4cpa.ch?subject=Mobile%20App%20Benachrichtigung"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              borderRadius: 12,
              border: '1.5px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-primary)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor = 'var(--line)')
            }
          >
            📬 Benachrichtigen wenn verfügbar
          </a>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
