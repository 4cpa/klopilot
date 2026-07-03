'use client';

import { useTranslation } from 'react-i18next';

/**
 * Dauerhafter, nicht schliessbarer Hinweis, dass klopilot sich im MVP-Aufbau
 * befindet. Bewusst kein Pop-up/Overlay — fixe schmale Leiste, die den
 * restlichen Seiteninhalt (inkl. Karte, siehe --mvp-banner-h) nach unten
 * verschiebt, statt ihn zu verdecken.
 */
export function MvpBanner() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 'var(--mvp-banner-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '0 12px',
        background: 'var(--brand-secondary)',
        color: 'var(--brand-deep)',
        fontSize: 12,
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.3,
        boxShadow: '0 1px 0 rgba(0,0,0,.08)',
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {t('common.mvp_banner')}
      </span>
    </div>
  );
}
