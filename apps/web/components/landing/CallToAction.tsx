'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function CallToAction() {
  const { t } = useTranslation();

  return (
    <section
      style={{
        padding: '96px 24px',
        background: 'var(--brand-deep)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Background decoration */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80vw',
            maxWidth: 800,
            height: '80vw',
            maxHeight: 800,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 65%)',
          }}
        />
      </div>

      <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚽</div>

        <h2
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#fff',
            marginBottom: 16,
          }}
        >
          {t('landing.cta_title')}
        </h2>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', marginBottom: 40 }}>
          {t('landing.cta_subtitle')}
        </p>

        <Link
          href="/karte"
          style={{
            display: 'inline-block',
            padding: '16px 40px',
            borderRadius: 12,
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--brand-deep)',
            textDecoration: 'none',
            background: 'var(--brand-secondary)',
            boxShadow: '0 4px 24px rgba(255,210,63,0.40)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,210,63,0.55)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(255,210,63,0.40)';
          }}
        >
          🗺️ {t('landing.cta_button')}
        </Link>
      </div>
    </section>
  );
}
