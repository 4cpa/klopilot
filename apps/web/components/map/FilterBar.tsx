'use client';

import { useTranslation } from 'react-i18next';

export interface MapFilters {
  free: boolean;
  accessible: boolean;
  categories: Set<string>;
}

export const DEFAULT_FILTERS: MapFilters = {
  free: false,
  accessible: false,
  categories: new Set(),
};

export function hasActiveFilters(f: MapFilters) {
  return f.free || f.accessible || f.categories.size > 0;
}

const CATEGORIES: { key: string; emoji: string; i18nKey: string }[] = [
  { key: 'public', emoji: '🚽', i18nKey: 'category.public' },
  { key: 'nette_toilette', emoji: '🤝', i18nKey: 'category.nette_toilette' },
  { key: 'gastronomy', emoji: '🍽️', i18nKey: 'category.gastronomy' },
  { key: 'transport', emoji: '🚂', i18nKey: 'category.transport' },
  { key: 'mall', emoji: '🏬', i18nKey: 'category.mall' },
  { key: 'event', emoji: '🎪', i18nKey: 'category.event' },
];

interface Props {
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
  totalCount?: number;
  visibleCount?: number;
}

/* ── single chip ─────────────────────────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 999,
        border: active ? '1.5px solid var(--brand-primary)' : '1.5px solid var(--line)',
        background: active ? 'var(--brand-primary)' : 'var(--paper)',
        color: active ? '#fff' : 'var(--ink)',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 2px 10px rgba(255,107,53,0.28)' : '0 1px 4px rgba(15,23,42,0.06)',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ── FilterBar ───────────────────────────────────────────────────────────── */
export function FilterBar({ filters, onChange, totalCount, visibleCount }: Props) {
  const { t } = useTranslation();

  function toggleFree() {
    onChange({ ...filters, free: !filters.free });
  }

  function toggleAccessible() {
    onChange({ ...filters, accessible: !filters.accessible });
  }

  function toggleCategory(key: string) {
    const next = new Set(filters.categories);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange({ ...filters, categories: next });
  }

  function clearAll() {
    onChange(DEFAULT_FILTERS);
  }

  const active = hasActiveFilters(filters);

  return (
    <div
      role="toolbar"
      aria-label="Kartenfilter"
      style={{
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        zIndex: 15,
        padding: '7px 8px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        background: 'linear-gradient(to bottom, var(--paper) 50%, transparent)',
        // Kein maskImage — Chips wurden dadurch ausgegraut / sahen deaktiviert aus
      }}
    >
      {/* Quick-toggle filters */}
      <Chip active={filters.free} onClick={toggleFree}>
        💸 {t('filter.free')}
      </Chip>
      <Chip active={filters.accessible} onClick={toggleAccessible}>
        ♿ {t('filter.accessible')}
      </Chip>

      {/* Divider dot */}
      <span
        style={{ color: 'var(--muted)', opacity: 0.4, flexShrink: 0, fontSize: 18, lineHeight: 1 }}
      >
        ·
      </span>

      {/* Category chips */}
      {CATEGORIES.map(({ key, emoji, i18nKey }) => (
        <Chip key={key} active={filters.categories.has(key)} onClick={() => toggleCategory(key)}>
          {emoji} {t(i18nKey)}
        </Chip>
      ))}

      {/* Clear all */}
      {active && (
        <>
          <span
            style={{
              color: 'var(--muted)',
              opacity: 0.4,
              flexShrink: 0,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ·
          </span>
          <button
            type="button"
            onClick={clearAll}
            aria-label="Filter zurücksetzen"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 999,
              border: '1.5px solid var(--brand-berry)',
              background: 'var(--paper)',
              color: 'var(--brand-berry)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--brand-berry)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
              (e.currentTarget as HTMLElement).style.color = 'var(--brand-berry)';
            }}
          >
            ✕ Reset
          </button>
        </>
      )}

      {/* Result count badge — shown when filters active */}
      {active && visibleCount !== undefined && totalCount !== undefined && (
        <span
          aria-live="polite"
          style={{
            marginLeft: 4,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: visibleCount === 0 ? 'var(--brand-berry)' : 'var(--brand-mint)',
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '0.01em',
          }}
        >
          {visibleCount} / {totalCount}
        </span>
      )}

      {/* Spacer so last chip isn't flush against edge */}
      <span style={{ flexShrink: 0, width: 8, display: 'inline-block' }} aria-hidden />

      <style>{`
        [role="toolbar"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
