'use client';

import { useTheme } from '@/lib/hooks';

/* ── SVG-Icons ────────────────────────────────────────────────────────────── */
function SunIcon() {
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
      width="14"
      height="14"
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
      width="14"
      height="14"
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
  { value: 'dark' as const, Icon: MoonIcon, title: 'Dunkel' },
  { value: 'system' as const, Icon: MonitorIcon, title: 'System' },
];

/* ── Desktop 3-Button-Gruppe ─────────────────────────────────────────────── */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="hidden sm:flex rounded-lg overflow-hidden border border-[var(--line)]"
      role="group"
      aria-label="Theme wählen"
    >
      {OPTIONS.map(({ value, Icon, title }) => (
        <button
          key={value}
          type="button"
          title={title}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`px-2.5 py-1.5 transition-colors ${
            theme === value
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--cream)]'
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}

/* ── Mini-Button für eingebettete Nutzung im Suchfeld ─────────────────────── */
/* Kein sichtbarer Rahmen / Hintergrund — Icon sitzt nahtlos im Suchfeld-Pill. */
export function ThemeToggleMini() {
  const { theme, setTheme } = useTheme();

  const idx = OPTIONS.findIndex((o) => o.value === theme);
  const current = OPTIONS[idx] ?? OPTIONS[0];
  const nextOption = OPTIONS[(idx + 1) % OPTIONS.length];

  return (
    <button
      type="button"
      title={`Theme: ${current.title} → ${nextOption.title}`}
      aria-label={`Theme wechseln (aktuell: ${current.title})`}
      onClick={(e) => {
        e.stopPropagation();
        setTheme(nextOption.value);
      }}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        flexShrink: 0,
        padding: '4px',
        lineHeight: 0,
        /* Kein borderRadius / Hover-Hintergrund — verhindert sichtbares Rechteck */
      }}
    >
      <current.Icon />
    </button>
  );
}
