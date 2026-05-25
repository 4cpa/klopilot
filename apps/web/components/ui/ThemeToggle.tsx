'use client';

import { useTheme } from '@/lib/hooks';

const OPTIONS = [
  { value: 'light', label: '☀️', title: 'Hell' },
  { value: 'dark', label: '🌙', title: 'Dunkel' },
  { value: 'system', label: '⚙️', title: 'System' },
] as const;

/* ── Desktop 3-Button-Gruppe ─────────────────────────────────────────────── */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="hidden sm:flex rounded-lg overflow-hidden border border-[var(--line)]"
      role="group"
      aria-label="Theme wählen"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={theme === o.value}
          onClick={() => setTheme(o.value)}
          className={`px-2.5 py-1.5 text-sm transition-colors ${
            theme === o.value
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--cream)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Mini-Button für eingebettete Nutzung (z. B. in SearchBar auf Mobile) ── */
export function ThemeToggleMini() {
  const { theme, setTheme } = useTheme();

  const idx = OPTIONS.findIndex((o) => o.value === theme);
  const current = OPTIONS[idx] ?? OPTIONS[0];
  const next = OPTIONS[(idx + 1) % OPTIONS.length];

  return (
    <button
      type="button"
      title={`Theme: ${current.title} → ${next.title}`}
      aria-label={`Theme wechseln (aktuell: ${current.title})`}
      onClick={(e) => {
        e.stopPropagation(); // verhindert dass SearchBar-Dropdown sich öffnet
        setTheme(next.value);
      }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'var(--muted)',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
    >
      {current.label}
    </button>
  );
}
