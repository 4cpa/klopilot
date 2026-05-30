'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle, ThemeToggleMini } from '@/components/ui/ThemeToggle';
import { changeLanguage } from '@/lib/i18n';

/** Sprach-Optionen: Code → Label, Flagge, Länder-Hinweis */
export const LANG_OPTIONS = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', hint: 'DE · AT · CH' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', hint: 'FR · CH · BE' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', hint: 'IT · CH' },
  { code: 'en', label: 'English', flag: '🇬🇧', hint: 'UK · IE' },
  { code: 'es', label: 'Español', flag: '🇪🇸', hint: 'ES · PT' },
  { code: 'pt', label: 'Português', flag: '🇵🇹', hint: 'PT · BR' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰', hint: 'DK' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪', hint: 'SE' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴', hint: 'NO' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮', hint: 'FI' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', hint: 'NL · BE' },
  { code: 'is', label: 'Íslenska', flag: '🇮🇸', hint: 'IS' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷', hint: 'CY · GR' },
] as const;

/** Kompaktes Sprach-Dropdown — wiederverwendbar (Navbar + AppBar) */
export function LangDropdown({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentCode = i18n.language?.slice(0, 2).toLowerCase() ?? 'de';
  const current = LANG_OPTIONS.find((l) => l.code === currentCode) ?? LANG_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sprache: ${current.label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 3 : 5,
          padding: compact ? '5px 8px' : '5px 10px',
          borderRadius: 8,
          border: '1px solid var(--line)',
          background: open ? 'var(--line)' : 'var(--cream)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--line)')}
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background = open
            ? 'var(--line)'
            : 'var(--cream)')
        }
      >
        <span style={{ fontSize: 15 }}>{current.flag}</span>
        {!compact && <span style={{ letterSpacing: '0.03em' }}>{current.code.toUpperCase()}</span>}
        <span
          style={{
            fontSize: 8,
            color: 'var(--muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Sprache wählen"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 175,
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(15,23,42,0.16)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {LANG_OPTIONS.map((opt) => {
            const isActive = currentCode === opt.code;
            return (
              <button
                key={opt.code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  changeLanguage(opt.code);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  background: isActive ? 'var(--cream)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--cream)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{opt.flag}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--brand-primary)' : 'var(--ink)',
                      lineHeight: 1.25,
                    }}
                  >
                    {opt.label}
                  </div>
                  {opt.hint && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                      {opt.hint}
                    </div>
                  )}
                </div>
                {isActive && (
                  <span style={{ color: 'var(--brand-primary)', fontSize: 12, flexShrink: 0 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentCode = i18n.language?.slice(0, 2).toLowerCase() ?? 'de';

  return (
    <nav
      aria-label="Hauptnavigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.2s, box-shadow 0.2s',
        background: scrolled ? 'var(--paper)' : 'transparent',
        boxShadow: scrolled ? '0 1px 0 var(--line)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="klopilot Startseite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            borderRadius: 8,
            padding: '4px 6px',
            marginLeft: -6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Logo size={32} />
          <span
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontWeight: 700,
              fontSize: 20,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
            }}
          >
            klopilot
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div
          role="list"
          style={{ display: 'flex', gap: 4, marginLeft: 32, flex: 1 }}
          className="hidden-mobile"
        >
          {[
            { href: '#features', label: t('nav.features') },
            { href: '#how', label: t('nav.how_it_works') },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--ink)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--muted)')}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Spacer mobile */}
        <div style={{ flex: 1 }} className="show-mobile" />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language dropdown — desktop only (mobile → hamburger menu) */}
          <div className="hidden-mobile">
            <LangDropdown />
          </div>

          <div className="hidden-mobile">
            <ThemeToggle />
          </div>
          <div className="show-mobile">
            <ThemeToggleMini />
          </div>

          <Link
            href="/karte"
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              background: 'var(--brand-primary)',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.88')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
          >
            {t('nav.open_map')} →
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="show-mobile"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: 'var(--ink)',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            background: 'var(--paper)',
            borderTop: '1px solid var(--line)',
            padding: '16px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {[
            { href: '#features', label: t('nav.features') },
            { href: '#how', label: t('nav.how_it_works') },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 0',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--ink)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {label}
            </a>
          ))}

          {/* Sprache — mobile: als 2×2 Grid (keine z-index Kollision) */}
          <div style={{ paddingTop: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              Sprache / Langue / Lingua
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LANG_OPTIONS.map((opt) => {
                const isActive = currentCode === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(opt.code);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${isActive ? 'var(--brand-primary)' : 'var(--line)'}`,
                      background: isActive ? 'rgba(255,107,53,0.07)' : 'var(--cream)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{opt.flag}</span>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isActive ? 'var(--brand-primary)' : 'var(--ink)',
                          lineHeight: 1.2,
                        }}
                      >
                        {opt.label}
                      </div>
                      {opt.hint && (
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{opt.hint}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
