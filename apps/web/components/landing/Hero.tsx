'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            maxWidth: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '50vw',
            height: '50vw',
            maxWidth: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,214,160,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: '30vw',
            height: '30vw',
            maxWidth: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,210,63,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Logo + Brand → verlinkt zur Karte */}
      <Link
        href="/karte"
        aria-label="klopilot – Zur Karte"
        style={{
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            filter: 'drop-shadow(0 8px 24px rgba(255,107,53,0.30))',
            borderRadius: 22,
            transition: 'filter 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.filter =
              'drop-shadow(0 12px 32px rgba(255,107,53,0.50))';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.filter =
              'drop-shadow(0 8px 24px rgba(255,107,53,0.30))';
            (e.currentTarget as HTMLElement).style.transform = '';
          }}
        >
          <Logo size={80} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = 'var(--brand-primary)')
          }
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')}
        >
          klopilot
        </span>
      </Link>

      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'var(--cream)',
          border: '1px solid var(--line)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--brand-primary)',
          marginBottom: 32,
        }}
      >
        🌸 Community-Toiletten-Guide · klopilot.ch
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'clamp(44px, 8vw, 88px)',
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          marginBottom: 24,
          maxWidth: 800,
          whiteSpace: 'pre-line',
        }}
      >
        {t('landing.hero_title')
          .split('\n')
          .map((line, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} style={{ color: 'var(--brand-primary)' }}>
                {line}
              </span>
            ) : (
              <span key={i}>
                {line}
                <br />
              </span>
            ),
          )}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)',
          lineHeight: 1.6,
          color: 'var(--muted)',
          maxWidth: 560,
          marginBottom: 48,
        }}
      >
        {t('landing.hero_subtitle')}
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/karte"
          style={{
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            background: 'var(--brand-primary)',
            boxShadow: '0 4px 20px rgba(255,107,53,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(255,107,53,0.45)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(255,107,53,0.35)';
          }}
        >
          🗺️ {t('landing.hero_cta_map')}
        </Link>

        <a
          href="#features"
          style={{
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--ink)',
            textDecoration: 'none',
            background: 'var(--cream)',
            border: '1px solid var(--line)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--line)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
        >
          {t('landing.hero_cta_learn')} ↓
        </a>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'flex',
          gap: 48,
          marginTop: 80,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { value: '100 %', labelKey: 'landing.stat_free' },
          { value: '0', labelKey: 'landing.stat_ads' },
          { value: '🌸 🪰', labelKey: 'landing.stat_rating' },
          { value: '19', labelKey: 'landing.stat_available' },
        ].map(({ value, labelKey }) => (
          <div key={labelKey} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--ink)',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{t(labelKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
