'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const LANGS = ['DE', 'FR', 'IT', 'EN'] as const;

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentLang = i18n.language?.toUpperCase().slice(0, 2) ?? 'DE';

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
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
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
          {/* Language switcher — desktop only */}
          <div style={{ display: 'flex', gap: 2 }} className="hidden-mobile">
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => i18n.changeLanguage(lang.toLowerCase())}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: currentLang === lang ? 'var(--line)' : 'transparent',
                  color: currentLang === lang ? 'var(--ink)' : 'var(--muted)',
                  transition: 'all 0.15s',
                }}
              >
                {lang}
              </button>
            ))}
          </div>

          <ThemeToggle />

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
          {/* Language switcher mobile */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            {LANGS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  i18n.changeLanguage(lang.toLowerCase());
                  setMenuOpen(false);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: currentLang === lang ? 'var(--brand-primary)' : 'var(--line)',
                  color: currentLang === lang ? '#fff' : 'var(--ink)',
                }}
              >
                {lang}
              </button>
            ))}
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
