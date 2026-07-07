'use client';

import type { Toilet } from '@/lib/api';

/* ── Icons je Kategorie (identisch zu ProfileSidebar/AddToiletSheet) ────────── */
const CATEGORY_EMOJI: Record<string, string> = {
  public: '🚽',
  nette_toilette: '🤝',
  gastronomy: '🍽️',
  transport: '🚂',
  mall: '🏬',
  event: '🎪',
  private: '🔒',
};

interface Props {
  toilets: Toilet[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

function scoreLabel(t: Toilet): string {
  if (!t.score || t.score.count === 0) return 'noch keine Bewertungen';
  const net = t.score.net;
  return `Bewertung ${net > 0 ? '+' : ''}${net.toFixed(1)} aus ${t.score.count} Bewertungen`;
}

function netColor(t: Toilet): string {
  if (!t.score || t.score.count === 0) return 'var(--muted)';
  const net = t.score.net;
  if (net > 1) return 'var(--score-mint-text)';
  if (net > 0) return 'var(--score-secondary-text)';
  if (net > -1) return 'var(--score-primary-text)';
  return 'var(--score-berry-text)';
}

/**
 * Listen-Alternative zur Karte (WCAG 2.1.1/1.4.5): Karten-Marker sind für
 * Screenreader-Nutzer:innen nur einzeln per Tab erreichbar und vermitteln
 * räumliche Nähe rein visuell. Diese Liste macht dieselben Toiletten als
 * gewöhnliche, per Tab/Pfeiltasten navigierbare Buttons durchsuchbar —
 * unabhängig davon, ob man die Karte überhaupt sehen/bedienen kann.
 */
export function ToiletListPanel({ toilets, onSelect, onClose }: Props) {
  const sorted = [...toilets].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));

  return (
    <section
      aria-label="Toiletten in diesem Kartenausschnitt als Liste"
      className="absolute inset-0 flex flex-col"
      style={{
        zIndex: 25,
        background: 'var(--paper)',
        paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <h2 className="text-base font-semibold text-[var(--ink)]" aria-live="polite">
          {sorted.length} Toilette{sorted.length !== 1 ? 'n' : ''} in diesem Ausschnitt
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold px-3 py-2 rounded-lg"
          style={{ background: 'var(--cream)', color: 'var(--ink)' }}
        >
          <span aria-hidden>🗺️</span> Zur Karte
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2" style={{ listStyle: 'none', margin: 0 }}>
        {sorted.length === 0 && (
          <li className="text-sm text-[var(--muted)] text-center py-10">
            Keine Toiletten in diesem Kartenausschnitt — Karte verschieben oder Filter anpassen.
          </li>
        )}
        {sorted.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              className="w-full flex items-center gap-3 text-left px-3 py-3 rounded-lg transition-colors"
              style={{ borderBottom: '1px solid var(--line)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'transparent')
              }
            >
              <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>
                {CATEGORY_EMOJI[t.category] ?? '🚽'}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[var(--ink)] truncate">
                  {t.name}
                </span>
                <span className="block text-xs text-[var(--muted)] truncate">
                  {t.address ?? scoreLabel(t)}
                  {t.distanceM != null &&
                    ` · ${t.distanceM < 1000 ? `${t.distanceM} m` : `${(t.distanceM / 1000).toFixed(1)} km`}`}
                </span>
              </span>
              {t.score && t.score.count > 0 && (
                <span
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: netColor(t) }}
                  aria-hidden
                >
                  {t.score.net > 0 ? '+' : ''}
                  {t.score.net.toFixed(1)}
                </span>
              )}
              <span className="sr-only">, {scoreLabel(t)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
