'use client';

import { useTheme } from '@/lib/hooks';

const OPTIONS = [
  { value: 'light', label: '☀️', title: 'Hell' },
  { value: 'dark', label: '🌙', title: 'Dunkel' },
  { value: 'system', label: '⚙️', title: 'System' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Compact single-button for mobile: cycles through modes on tap
  const idx = OPTIONS.findIndex((o) => o.value === theme);
  const current = OPTIONS[idx] ?? OPTIONS[0];
  const next = OPTIONS[(idx + 1) % OPTIONS.length];

  return (
    <>
      {/* Mobile: single cycle button — spart Platz in der AppBar */}
      <button
        type="button"
        title={`Theme: ${current.title} → ${next.title}`}
        aria-label={`Theme wechseln (aktuell: ${current.title})`}
        onClick={() => setTheme(next.value)}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-sm border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
      >
        {current.label}
      </button>

      {/* Desktop: alle drei Optionen sichtbar */}
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
    </>
  );
}
