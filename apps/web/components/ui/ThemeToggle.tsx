'use client';

import { useTheme } from '@/lib/hooks';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: '☀️', title: 'Hell' },
    { value: 'dark', label: '🌙', title: 'Dunkel' },
    { value: 'system', label: '⚙️', title: 'System' },
  ] as const;

  return (
    <div
      className="flex rounded-lg overflow-hidden border border-[var(--line)]"
      role="group"
      aria-label="Theme wählen"
    >
      {options.map((o) => (
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
