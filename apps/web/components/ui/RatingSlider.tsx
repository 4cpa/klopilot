'use client';

import { useId, useRef, useState } from 'react';

interface Props {
  label: string;
  flowers: number;
  flies: number;
  onChange: (flowers: number, flies: number) => void;
}

type Mode = 'flowers' | 'flies' | 'none';

const MODES: { value: Mode; glyph: string; noun: string }[] = [
  { value: 'flowers', glyph: '🌸', noun: 'Blümchen' },
  { value: 'flies', glyph: '🪰', noun: 'Fliegen' },
  { value: 'none', glyph: '—', noun: 'keine Bewertung' },
];

const FLOWER_EMOJI = ['', '🌸', '🌸🌸', '🌸🌸🌸', '🌸🌸🌸🌸', '🌸🌸🌸🌸🌸'];
const FLY_EMOJI = ['', '🪰', '🪰🪰', '🪰🪰🪰', '🪰🪰🪰🪰', '🪰🪰🪰🪰🪰'];

/** Pfeiltasten bewegen Fokus + Auswahl innerhalb einer role="radiogroup" (ARIA APG). */
function handleRovingArrowKey(
  e: React.KeyboardEvent,
  refs: Array<HTMLButtonElement | null>,
  currentIndex: number,
  selectIndex: (i: number) => void,
) {
  const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
  const backward = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
  if (!forward && !backward) return;
  e.preventDefault();
  const count = refs.length;
  const next = forward ? (currentIndex + 1) % count : (currentIndex - 1 + count) % count;
  selectIndex(next);
  refs[next]?.focus();
}

export function RatingSlider({ label, flowers, flies, onChange }: Props) {
  const groupId = useId();
  const [mode, setMode] = useState<Mode>(flowers > 0 ? 'flowers' : flies > 0 ? 'flies' : 'none');
  const modeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const valueRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleMode(m: Mode) {
    setMode(m);
    onChange(0, 0); // Modus­wechsel setzt Wertung zurück
  }

  function handleValue(val: number) {
    if (mode === 'flowers') onChange(val, 0);
    else if (mode === 'flies') onChange(0, val);
  }

  const current = mode === 'flowers' ? flowers : mode === 'flies' ? flies : 0;
  const modeNoun = MODES.find((m) => m.value === mode)?.noun ?? '';

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--cream)' }}>
      <div className="flex items-center justify-between">
        <span id={`${groupId}-label`} className="text-sm font-medium text-[var(--ink)]">
          {label}
        </span>
        <div role="radiogroup" aria-label={`Bewertungsart für ${label}`} className="flex gap-1">
          {MODES.map((m, i) => (
            <button
              key={m.value}
              ref={(el) => {
                modeRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              tabIndex={mode === m.value ? 0 : -1}
              onClick={() => handleMode(m.value)}
              onKeyDown={(e) =>
                handleRovingArrowKey(e, modeRefs.current, i, (idx) => handleMode(MODES[idx].value))
              }
              aria-label={`${label}: ${m.noun}`}
              className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                mode === m.value
                  ? m.value === 'flowers'
                    ? 'bg-[var(--rate-flower)] text-white'
                    : m.value === 'flies'
                      ? 'bg-[var(--rate-fly)] text-white'
                      : 'bg-[var(--muted)] text-white'
                  : 'bg-[var(--line)] text-[var(--muted)]'
              }`}
            >
              <span aria-hidden>{m.glyph}</span>
            </button>
          ))}
        </div>
      </div>

      {mode !== 'none' && (
        <div
          role="radiogroup"
          aria-labelledby={`${groupId}-label`}
          aria-label={`${modeNoun}-Bewertung, ${current > 0 ? `${current} von 5` : 'keine Auswahl'}`}
          className="flex gap-1.5 justify-center pt-1"
        >
          {[1, 2, 3, 4, 5].map((v, i) => {
            const checked = v === current;
            return (
              <button
                key={v}
                ref={(el) => {
                  valueRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked || (current === 0 && v === 1) ? 0 : -1}
                onClick={() => handleValue(v === current ? 0 : v)}
                onKeyDown={(e) =>
                  handleRovingArrowKey(e, valueRefs.current, i, (idx) => handleValue(idx + 1))
                }
                aria-label={`${label}, ${modeNoun}, ${v} von 5`}
                className={`w-11 h-11 rounded-md text-sm font-semibold transition-all ${
                  v <= current
                    ? mode === 'flowers'
                      ? 'bg-[var(--rate-flower)] text-white scale-105'
                      : 'bg-[var(--rate-fly)] text-white scale-105'
                    : 'bg-[var(--line)] text-[var(--muted)]'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}

      {mode !== 'none' && current > 0 && (
        <p className="text-center text-xs text-[var(--muted)]" aria-hidden>
          {mode === 'flowers' ? FLOWER_EMOJI[current] : FLY_EMOJI[current]}
        </p>
      )}
    </div>
  );
}
