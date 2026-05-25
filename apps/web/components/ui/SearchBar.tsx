'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
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

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0" style={{ maxWidth: 360 }}>
      {/* Input — Glas-Pill: backdrop-blur statt solider Hintergrund, kein harter Rahmen */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
        style={{
          background: open ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: open
            ? '0 0 0 2px rgba(255,107,53,.45), 0 4px 20px rgba(15,23,42,.12)'
            : '0 2px 8px rgba(15,23,42,.14)',
        }}
      >
        <span className="text-sm leading-none" aria-hidden>
          {loading ? '⏳' : '🔍'}
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Toilette suchen…"
          aria-label="Toilette suchen"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          style={{
            color: 'var(--ink)',
            border: 'none' /* browser-native input border entfernen */,
            appearance: 'none' /* -webkit-appearance: searchfield aufheben */,
            WebkitAppearance: 'none',
            minWidth: 0,
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
            className="text-[var(--muted)] hover:text-[var(--ink)] text-sm leading-none"
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
          className="absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden z-50"
          style={{
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
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--cream)] focus-visible:bg-[var(--cream)]"
                  onClick={() => handleSelect(toilet)}
                >
                  <span className="text-xl flex-shrink-0">
                    {CATEGORY_EMOJI[toilet.category] ?? '🚻'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-sm font-semibold truncate"
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
          className="absolute top-full mt-2 left-0 right-0 rounded-xl px-4 py-6 text-center z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            fontSize: '0.875rem',
          }}
        >
          Keine Treffer für «{query}»
        </div>
      )}
    </div>
  );
}
