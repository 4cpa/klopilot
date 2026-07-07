'use client';

import { useTheme } from '@/lib/hooks';
import { useTranslation } from 'react-i18next';

/* ── SVG-Icons ────────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const OPTIONS = [
  { value: 'light' as const, Icon: SunIcon, title: 'Hell' },
  { value: 'system' as const, Icon: MonitorIcon, title: 'System' },
  { value: 'dark' as const, Icon: MoonIcon, title: 'Dunkel' },
];

/* ── Desktop 3-Button-Gruppe ─────────────────────────────────────────────── */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label={t('a11y.theme')}
      style={{
        display: 'flex',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1.5px solid var(--line)',
        background: 'var(--surface)',
        boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
      }}
    >
      {OPTIONS.map(({ value, Icon, title }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            title={title}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              background: active ? 'var(--btn-primary-bg)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
              borderRight: value !== 'dark' ? '1px solid var(--line)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'var(--cream)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
              }
            }}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

/* ── Mini-Button (Navbar mobile, AppBar) — gleicher Stil wie HelpButton ────── */
export function ThemeToggleMini() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const idx = OPTIONS.findIndex((o) => o.value === theme);
  const current = OPTIONS[idx] ?? OPTIONS[0];
  const nextOption = OPTIONS[(idx + 1) % OPTIONS.length];

  return (
    <button
      type="button"
      title={`Theme: ${current.title} → ${nextOption.title}`}
      aria-label={t('a11y.theme')}
      onClick={(e) => {
        e.stopPropagation();
        setTheme(nextOption.value);
      }}
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
      <current.Icon />
    </button>
  );
}
