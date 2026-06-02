'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { search, type Toilet } from '@/lib/api';

const CATEGORY_EMOJI: Record<string, string> = {
  public: '🚻',
  nette_toilette: '🌸',
  gastronomy: '🍽️',
  transport: '🚆',
  mall: '🛍️',
  event: '🎪',
  private: '🔒',
};

function formatDist(m?: number) {
  if (!m) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

interface Props {
  userLocation?: [number, number];
  onSelect: (toilet: Toilet) => void;
  /** Optionales Element rechts im Input-Feld (z. B. ThemeToggleMini auf Mobile) */
  trailing?: ReactNode;
}

export function SearchBar({ userLocation, onSelect, trailing }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Suche mit Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const loc = userLocation ? { lat: userLocation[1], lng: userLocation[0] } : undefined;
        const { results: hits } = await search.query(query.trim(), loc);
        setResults(hits.slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userLocation]);

  // Schliessen bei Klick ausserhalb
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (toilet: Toilet) => {
      setQuery(toilet.name);
      setOpen(false);
      setResults([]);
      onSelect(toilet);
    },
    [onSelect],
  );

  const wcLabel = t('search.wc_label');
  const placeholder = t('search.placeholder_short');

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0" style={{ maxWidth: 360 }}>
      {/* Input — Glas-Pill */}
      <div
        className="flex items-center rounded-full px-3 py-1.5 transition-all"
        style={{
          gap: 0,
          background: open ? 'var(--search-glass-open)' : 'var(--search-glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: open
            ? '0 0 0 2px rgba(255,107,53,.45), 0 4px 20px rgba(15,23,42,.12)'
            : '0 2px 8px rgba(15,23,42,.14)',
        }}
      >
        {/* Lupe + WC — als <label>, damit ein Tap auf diese Zone den Input
            fokussiert (auf dem schmalen Mobile-Layout ist der Input selbst nur
            wenige px breit und kaum treffbar). */}
        <label
          htmlFor="kp-search-input"
          className="flex items-center leading-none select-none"
          style={{ gap: 2, marginInlineEnd: 6, flexShrink: 0, cursor: 'text' }}
        >
          <span className="text-sm" aria-hidden>
            {loading ? '⏳' : '🔍'}
          </span>
          {/* WC-Text auf Mobile ausgeblendet → mehr Platz für die Eingabe */}
          <span
            className="hidden sm:inline"
            aria-hidden
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: 'var(--brand-primary)',
              lineHeight: 1,
            }}
          >
            {wcLabel}
          </span>
        </label>

        {/* Trennlinie — nur ab sm (auf Mobile ohne WC-Label sinnlos) */}
        <span
          className="hidden sm:block"
          style={{
            width: 1,
            height: 14,
            background: 'var(--line)',
            flexShrink: 0,
            marginInlineEnd: 6,
          }}
          aria-hidden
        />

        <input
          id="kp-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          aria-label={`${wcLabel} ${placeholder}`}
          className="flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]"
          style={{
            color: 'var(--ink)',
            border: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            minWidth: 0,
            // Logische Ausrichtung: folgt dem HTML-`dir` (RTL für ar/he),
            // damit der Text nicht am linken Rand abgeschnitten wird.
            textAlign: 'start',
            paddingInline: 2,
            // iOS-Safari-Workaround: Eingabefelder INNERHALB eines
            // `backdrop-filter`-Containers (Glas-Pill) bekommen auf echten
            // iPhones manchmal keine Soft-Tastatur. Ein eigener Stacking-
            // Context (position + z-index) hebt den Input über die gefilterte
            // Ebene und stellt die Fokus-/Tastatur-Interaktion wieder her.
            position: 'relative',
            zIndex: 1,
            // 16px verhindert zugleich das iOS-Auto-Zoom beim Fokussieren
            // (Safari zoomt bei <16px-Inputs). text-sm wurde daher entfernt.
            fontSize: 16,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            className="text-[var(--muted)] hover:text-[var(--ink)] text-sm leading-none ms-1"
            aria-label="Suche löschen"
          >
            ✕
          </button>
        )}
        {/* Trailing-Slot: z. B. ThemeToggleMini auf Mobile */}
        {trailing && !query && (
          <>
            <span
              style={{
                width: 1,
                height: 16,
                background: 'var(--line)',
                flexShrink: 0,
                margin: '0 6px',
              }}
              aria-hidden
            />
            {trailing}
          </>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Suchergebnisse"
          data-testid="search-results"
          className="absolute top-full mt-2 start-0 rounded-xl overflow-hidden z-50"
          style={{
            // Breiter als das Suchfeld, damit längere Namen lesbar sind
            width: 'min(440px, 92vw)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: '0 12px 40px rgba(15,23,42,.15)',
          }}
        >
          {results.map((toilet) => {
            const dist = formatDist(toilet.distanceM);
            return (
              <li key={toilet.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="w-full flex items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[var(--cream)] focus-visible:bg-[var(--cream)]"
                  onClick={() => handleSelect(toilet)}
                >
                  <span className="text-xl flex-shrink-0">
                    {CATEGORY_EMOJI[toilet.category] ?? '🚻'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-sm font-semibold line-clamp-2"
                      style={{ color: 'var(--ink)' }}
                    >
                      {toilet.name}
                    </span>
                    {toilet.address && (
                      <span className="block text-xs truncate" style={{ color: 'var(--muted)' }}>
                        {toilet.address}
                      </span>
                    )}
                  </span>
                  {dist && (
                    <span
                      className="text-xs font-medium flex-shrink-0"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      {dist}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Kein Ergebnis */}
      {open && !loading && query.trim() && results.length === 0 && (
        <div
          className="absolute top-full mt-2 start-0 rounded-xl px-4 py-6 text-center z-50"
          style={{
            width: 'min(440px, 92vw)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            fontSize: '0.875rem',
          }}
        >
          {t('search.no_results', { query })}
        </div>
      )}
    </div>
  );
}
