'use client';

import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@klopilot/i18n';

const LANG_COUNT = SUPPORTED_LOCALES.length;

const FEATURES = [
  {
    icon: '🗺️',
    titleKey: 'landing.feature_map_title',
    descKey: 'landing.feature_map_desc',
    accent: 'var(--brand-sky)',
  },
  {
    icon: '🌸',
    titleKey: 'landing.feature_ratings_title',
    descKey: 'landing.feature_ratings_desc',
    accent: 'var(--rate-flower)',
  },
  {
    icon: '💸',
    titleKey: 'landing.feature_free_title',
    descKey: 'landing.feature_free_desc',
    accent: 'var(--brand-mint)',
  },
  {
    icon: '🔒',
    titleKey: 'landing.feature_private_title',
    descKey: 'landing.feature_private_desc',
    accent: 'var(--brand-primary)',
  },
  {
    icon: '🌍',
    titleKey: 'landing.feature_i18n_title',
    descKey: 'landing.feature_i18n_desc',
    accent: 'var(--brand-secondary)',
  },
  {
    icon: '🏆',
    titleKey: 'landing.feature_gamification_title',
    descKey: 'landing.feature_gamification_desc',
    accent: 'var(--brand-berry)',
  },
] as const;

export function Features() {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      style={{ padding: '96px 24px', background: 'var(--cream)', scrollMarginTop: 64 }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              marginBottom: 12,
            }}
          >
            {t('landing.features_title')}
          </h2>
          <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
            {t('landing.features_subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map(({ icon, titleKey, descKey, accent }) => (
            <div
              key={titleKey}
              style={{
                background: 'var(--paper)',
                borderRadius: 16,
                padding: '28px 24px',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--line)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(15,23,42,.10)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
              }}
            >
              {/* Icon badge */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                  background: `color-mix(in srgb, ${accent} 12%, var(--cream))`,
                  border: `1px solid color-mix(in srgb, ${accent} 20%, var(--line))`,
                }}
              >
                {icon}
              </div>

              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: 8,
                }}
              >
                {t(titleKey, { langCount: LANG_COUNT })}
              </h3>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
