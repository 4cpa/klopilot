'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
function IconMap() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
function IconMobile() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
function IconPartner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconScroll() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function IconWarn() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconGitHub() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/* ── Language flags ───────────────────────────────────────────────────────── */
const LANGS = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'is', label: 'Íslenska', flag: '🇮🇸' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
  { code: 'et', label: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', label: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'mk', label: 'Македонски', flag: '🇲🇰' },
  { code: 'sl', label: 'Slovenščina', flag: '🇸🇮' },
  { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', label: 'Srpski', flag: '🇷🇸' },
  { code: 'bs', label: 'Bosanski', flag: '🇧🇦' },
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
  { code: 'ar', label: 'العربية', flag: '🌍' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
];

/* ── Reusable link row ────────────────────────────────────────────────────── */
function FooterLink({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 0',
          fontSize: 14,
          color: 'rgba(255,255,255,0.60)',
          textDecoration: 'none',
          transition: 'color 0.15s',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#fff')}
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.60)')
        }
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        {label}
      </Link>
    </li>
  );
}

/* ── Column header ────────────────────────────────────────────────────────── */
function ColHeader({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */
export function Footer() {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--brand-deep)' }}>
      {/* ── Top: brand + columns ── */}
      <div
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '72px 32px 0',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
          gap: 48,
        }}
        className="footer-grid"
      >
        {/* Brand */}
        <div>
          <Link
            href="/"
            aria-label={t('a11y.home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              marginBottom: 18,
              borderRadius: 10,
              padding: '4px 8px',
              marginLeft: -8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              const logo = (e.currentTarget as HTMLElement).querySelector(
                '.footer-logo',
              ) as HTMLElement | null;
              if (logo) logo.style.transform = 'scale(1.06)';
              const name = (e.currentTarget as HTMLElement).querySelector(
                '.footer-brand-name',
              ) as HTMLElement | null;
              if (name) name.style.color = 'var(--brand-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              const logo = (e.currentTarget as HTMLElement).querySelector(
                '.footer-logo',
              ) as HTMLElement | null;
              if (logo) logo.style.transform = '';
              const name = (e.currentTarget as HTMLElement).querySelector(
                '.footer-brand-name',
              ) as HTMLElement | null;
              if (name) name.style.color = '#fff';
            }}
          >
            <span
              className="footer-logo"
              style={{ display: 'flex', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <Logo size={36} />
            </span>
            <span
              className="footer-brand-name"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontWeight: 800,
                fontSize: 22,
                color: '#fff',
                letterSpacing: '-0.02em',
                transition: 'color 0.15s',
              }}
            >
              klopilot
            </span>
          </Link>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 240,
              marginBottom: 28,
            }}
          >
            {t('footer.tagline')}
          </p>

          {/* Bewertungs-Symbole */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {['🌸', '🪰'].map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 22,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* GitHub */}
          <a
            href="https://github.com/4cpa/klopilot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'none',
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.22)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#fff';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.45)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <IconGitHub /> Open Source
          </a>
        </div>

        {/* Plattform */}
        <div>
          <ColHeader emoji="🗺️" label={t('footer.platform')} />
          <nav aria-label={t('footer.platform')}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FooterLink href="/karte" icon={<IconMap />} label={t('footer.link_map')} />
              <FooterLink href="/app" icon={<IconMobile />} label={t('footer.link_app')} />
              <FooterLink href="/partner" icon={<IconPartner />} label={t('footer.link_partner')} />
            </ul>
          </nav>
        </div>

        {/* Rechtliches */}
        <div>
          <ColHeader emoji="⚖️" label={t('footer.legal')} />
          <nav aria-label={t('footer.legal')}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <FooterLink href="/impressum" icon={<IconDoc />} label={t('footer.link_impressum')} />
              <FooterLink
                href="/datenschutz"
                icon={<IconLock />}
                label={t('footer.link_privacy')}
              />
              <FooterLink href="/agb" icon={<IconScroll />} label={t('footer.link_terms')} />
              <FooterLink
                href="/disclaimer"
                icon={<IconWarn />}
                label={t('footer.link_disclaimer')}
              />
              <FooterLink href="/licence" icon={<IconDoc />} label={t('footer.link_licence')} />
              <FooterLink
                href="mailto:admin@4cpa.ch"
                icon={<IconMail />}
                label={t('footer.link_contact')}
                external
              />
            </ul>
          </nav>
        </div>

        {/* Sprache */}
        <div>
          <ColHeader emoji="🌍" label="Sprache / Language" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {LANGS.map(({ code, label, flag }) => {
              const active = i18n.language?.startsWith(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => i18n.changeLanguage(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    borderRadius: 9,
                    background: active ? 'rgba(255,107,53,0.18)' : 'transparent',
                    border: active ? '1px solid rgba(255,107,53,0.35)' : '1px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
                  <span>{label}</span>
                  {active && (
                    <span
                      style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--brand-primary)' }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ maxWidth: 1140, margin: '48px auto 0', padding: '0 32px' }}>
        <div
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.10) 80%, transparent)',
          }}
        />
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '24px 32px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          {t('footer.copyright', { year })}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
            <IconGlobe />
          </span>
          <a
            href="https://klopilot.ch"
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#fff')}
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')
            }
          >
            klopilot.ch
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 4px' }}>·</span>
          <a
            href="mailto:admin@4cpa.ch"
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#fff')}
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')
            }
          >
            admin@4cpa.ch
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
