'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/* ── Hilfe-Sektionen: Icon + i18n-Key (Texte in packages/i18n → `help.*`) ───── */
const SECTIONS = [
  { icon: '🗺️', id: 'map' },
  { icon: '🔍', id: 'search' },
  { icon: '🎛️', id: 'filter' },
  { icon: '🌸 / 🪰', id: 'rating' },
  { icon: '🚽', id: 'contribute' },
  { icon: '♿', id: 'accessibility' },
  { icon: '🔒', id: 'privacy' },
  { icon: '🌍', id: 'coverage' },
  { icon: '🗣️', id: 'language' },
  { icon: '⌨️', id: 'shortcuts' },
  { icon: '📩', id: 'contact' },
] as const;

/* ── QuestionMarkIcon ──────────────────────────────────────────────────────── */
function QuestionMarkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ── HelpButton + Overlay ──────────────────────────────────────────────────── */
export function HelpButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus auf ersten interaktiven Element beim Öffnen
  useEffect(() => {
    if (open) {
      // kleines Delay damit DOM ready ist
      const t = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      // Fokus zurück auf Trigger beim Schliessen
      triggerRef.current?.focus();
    }
  }, [open]);

  // Escape schliesst
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('a11y.help')}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('a11y.help')}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1.5px solid var(--line)',
          background: 'var(--surface)',
          color: 'var(--muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--cream)';
          (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
          (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
        }}
      >
        <QuestionMarkIcon />
      </button>

      {/* Overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 58,
              background: 'rgba(11,19,43,0.25)',
            }}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            id="help-overlay"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 60,
              background: 'var(--paper)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(15,23,42,.22)',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div
              style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center' }}
              aria-hidden
            >
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)' }} />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 16px 12px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <h2
                id="help-title"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span aria-hidden>❓</span> {t('a11y.help')}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--cream)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {SECTIONS.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      padding: '12px 14px',
                      background: 'var(--surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 18 }} aria-hidden>
                        {s.icon}
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>
                        {t(`help.${s.id}.title`)}
                      </strong>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {t(`help.${s.id}.body`)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Version info */}
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginTop: 20,
                  opacity: 0.6,
                }}
              >
                klopilot.ch · kostenlos · ohne Werbung ·{' '}
                <a
                  href="https://github.com/4cpa/klopilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Open Source
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
