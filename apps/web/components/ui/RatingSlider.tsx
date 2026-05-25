'use client';

import { useState } from 'react';

interface Props {
  label: string;
  flowers: number;
  flies: number;
  onChange: (flowers: number, flies: number) => void;
}

const FLOWER_EMOJI = ['', '🌸', '🌸🌸', '🌸🌸🌸', '🌸🌸🌸🌸', '🌸🌸🌸🌸🌸'];
const FLY_EMOJI = ['', '🪰', '🪰🪰', '🪰🪰🪰', '🪰🪰🪰🪰', '🪰🪰🪰🪰🪰'];

export function RatingSlider({ label, flowers, flies, onChange }: Props) {
  const [mode, setMode] = useState<'flowers' | 'flies' | 'none'>(
    flowers > 0 ? 'flowers' : flies > 0 ? 'flies' : 'none',
  );

  function handleMode(m: typeof mode) {
    setMode(m);
    onChange(0, 0); // reset on mode switch
  }

  function handleValue(val: number) {
    if (mode === 'flowers') onChange(val, 0);
    else if (mode === 'flies') onChange(0, val);
  }

  const current = mode === 'flowers' ? flowers : mode === 'flies' ? flies : 0;

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--cream)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
        <div className="flex gap-1">
          {(['flowers', 'flies', 'none'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMode(m)}
              aria-pressed={mode === m}
              className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                mode === m
                  ? m === 'flowers'
                    ? 'bg-[var(--rate-flower)] text-white'
                    : m === 'flies'
                      ? 'bg-[var(--rate-fly)] text-white'
                      : 'bg-[var(--muted)] text-white'
                  : 'bg-[var(--line)] text-[var(--muted)]'
              }`}
            >
              {m === 'flowers' ? '🌸' : m === 'flies' ? '🪰' : '—'}
            </button>
          ))}
        </div>
      </div>

      {mode !== 'none' && (
        <div className="flex gap-1.5 justify-center pt-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleValue(v === current ? 0 : v)}
              aria-label={`${v} von 5`}
              className={`w-9 h-9 rounded-md text-sm font-semibold transition-all ${
                v <= current
                  ? mode === 'flowers'
                    ? 'bg-[var(--rate-flower)] text-white scale-105'
                    : 'bg-[var(--rate-fly)] text-white scale-105'
                  : 'bg-[var(--line)] text-[var(--muted)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {mode !== 'none' && current > 0 && (
        <p className="text-center text-xs text-[var(--muted)]">
          {mode === 'flowers' ? FLOWER_EMOJI[current] : FLY_EMOJI[current]}
        </p>
      )}
    </div>
  );
}
