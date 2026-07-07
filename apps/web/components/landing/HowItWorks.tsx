'use client';

import { useTranslation } from 'react-i18next';

const STEPS = [
  { num: '01', icon: '📍', titleKey: 'landing.how_step1_title', descKey: 'landing.how_step1_desc' },
  { num: '02', icon: '🔍', titleKey: 'landing.how_step2_title', descKey: 'landing.how_step2_desc' },
  { num: '03', icon: '🌸', titleKey: 'landing.how_step3_title', descKey: 'landing.how_step3_desc' },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" style={{ padding: '96px 24px', scrollMarginTop: 64 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            {t('landing.how_title')}
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 32,
          }}
        >
          {STEPS.map(({ num, icon, titleKey, descKey }, idx) => (
            <div key={num} style={{ position: 'relative' }}>
              {/* Connector line (not last) */}
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 26,
                    left: 'calc(100% - 16px)',
                    width: 'calc(32px + 16px)',
                    height: 2,
                    background: 'linear-gradient(to right, var(--brand-primary), var(--line))',
                    display: 'none', // desktop only via CSS
                  }}
                  className="step-connector"
                />
              )}

              {/* Step number */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--btn-primary-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: 20,
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.30)',
                }}
              >
                {num}
              </div>

              {/* Icon */}
              <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: 8,
                }}
              >
                {t(titleKey)}
              </h3>

              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .step-connector { display: block !important; }
        }
      `}</style>
    </section>
  );
}
