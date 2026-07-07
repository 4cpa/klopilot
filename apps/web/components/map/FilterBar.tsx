'use client';

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface MapFilters {
  free: boolean;
  accessible: boolean;
  shower: boolean;
  categories: Set<string>;
}

export const DEFAULT_FILTERS: MapFilters = {
  free: false,
  accessible: false,
  shower: false,
  categories: new Set(),
};

export function hasActiveFilters(f: MapFilters) {
  return f.free || f.accessible || f.shower || f.categories.size > 0;
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
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 12px',
        borderRadius: 999,
        border: active ? '1.5px solid var(--btn-primary-bg)' : '1.5px solid var(--line)',
        background: active ? 'var(--btn-primary-bg)' : 'var(--paper)',
        color: active ? '#fff' : 'var(--ink)',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'inherit', // erbt grab/grabbing vom Container
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
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  // Desktop: Mausrad → horizontal scrollen + Drag-Scroll
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    // Mausrad: vertikale Drehung → horizontaler Scroll
    const onWheel = (e: WheelEvent) => {
      // deltaX: native horizontales Scrollen (Trackpad) — kein Override nötig
      if (e.deltaX !== 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    // Drag-Scroll per Maustaste
    const onMouseDown = (e: MouseEvent) => {
      drag.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft };
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const dx = e.pageX - drag.current.startX;
      el.scrollLeft = drag.current.scrollLeft - dx;
    };
    const onMouseUp = () => {
      drag.current.active = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function toggleFree() {
    onChange({ ...filters, free: !filters.free });
  }

  function toggleAccessible() {
    onChange({ ...filters, accessible: !filters.accessible });
  }

  function toggleShower() {
    onChange({ ...filters, shower: !filters.shower });
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

  // ARIA APG Toolbar-Pattern: Pfeiltasten bewegen den Fokus zwischen den Chips
  // (statt jeden einzelnen per Tab anzusteuern).
  function handleToolbarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const buttons = Array.from(e.currentTarget.querySelectorAll('button'));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    const next =
      e.key === 'ArrowRight'
        ? (idx + 1) % buttons.length
        : (idx - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  const active = hasActiveFilters(filters);

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label={t('a11y.filters')}
      onKeyDown={handleToolbarKeyDown}
      style={{
        position: 'absolute',
        top: 64,
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
        background: 'transparent',
        cursor: 'grab',
      }}
    >
      {/* Quick-toggle filters */}
      <Chip active={filters.free} onClick={toggleFree}>
        <span aria-hidden>💸</span> {t('filter.free')}
      </Chip>
      <Chip active={filters.accessible} onClick={toggleAccessible}>
        <span aria-hidden>♿</span> {t('filter.accessible')}
      </Chip>
      <Chip active={filters.shower} onClick={toggleShower}>
        <span aria-hidden>🚿</span> {t('filter.shower')}
      </Chip>

      {/* Divider dot */}
      <span
        aria-hidden
        style={{ color: 'var(--muted)', opacity: 0.4, flexShrink: 0, fontSize: 18, lineHeight: 1 }}
      >
        ·
      </span>

      {/* Category chips */}
      {CATEGORIES.map(({ key, emoji, i18nKey }) => (
        <Chip key={key} active={filters.categories.has(key)} onClick={() => toggleCategory(key)}>
          <span aria-hidden>{emoji}</span> {t(i18nKey)}
        </Chip>
      ))}

      {/* Clear all */}
      {active && (
        <>
          <span
            aria-hidden
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
            aria-label={t('a11y.reset_filters')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 999,
              border: '1.5px solid var(--score-berry-text)',
              background: 'var(--paper)',
              color: 'var(--score-berry-text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--score-berry-solid)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
              (e.currentTarget as HTMLElement).style.color = 'var(--score-berry-text)';
            }}
          >
            <span aria-hidden>✕</span> Reset
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
            background: visibleCount === 0 ? 'var(--score-berry-solid)' : 'var(--score-mint-solid)',
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
