'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ratings, type RatingInput, type ScoreInput } from '@/lib/api';
import { RatingSlider } from '@/components/ui/RatingSlider';
import { useFocusTrap } from '@/lib/useFocusTrap';

const CRITERIA: { key: keyof RatingInput['scores']; label: string }[] = [
  { key: 'cleanliness', label: 'Sauberkeit' },
  { key: 'hygiene', label: 'Hygiene' },
  { key: 'accessibility', label: 'Zugänglichkeit' },
  { key: 'style', label: 'Stil & Aufmachung' },
  { key: 'amenities', label: 'Ausstattung' },
  { key: 'safety', label: 'Sicherheit' },
  { key: 'inclusivity', label: 'Inklusivität' },
  { key: 'cost', label: 'Kosten' },
  { key: 'wait', label: 'Wartezeit' },
  { key: 'kids', label: 'Kinderfreundlich' },
];

interface Props {
  toiletId: string;
  onClose: () => void;
  onSaved: () => void;
}

type ScoreMap = Record<string, ScoreInput>;

export function RatingSheet({ toiletId, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [scores, setScores] = useState<ScoreMap>({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useFocusTrap<HTMLElement>(true, onClose);

  function handleScore(key: string, flowers: number, flies: number) {
    setScores((prev) => ({ ...prev, [key]: { flowers, flies } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: RatingInput = {
        scores: Object.fromEntries(
          Object.entries(scores).filter(([, v]) => (v.flowers ?? 0) > 0 || (v.flies ?? 0) > 0),
        ) as RatingInput['scores'],
        comment: comment.trim() || undefined,
        language: 'de',
      };
      await ratings.upsert(toiletId, input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-30" onClick={onClose} aria-hidden />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('rating.title')}
        tabIndex={-1}
        className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface)', boxShadow: '0 -8px 40px rgba(15,23,42,.18)' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--line)' }} />
        </div>

        <div className="px-5 py-2 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Bewertung abgeben</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--muted)]"
            style={{ background: 'var(--cream)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
          {CRITERIA.map(({ key, label }) => (
            <RatingSlider
              key={key}
              label={label}
              flowers={scores[key]?.flowers ?? 0}
              flies={scores[key]?.flies ?? 0}
              onChange={(f, l) => handleScore(key, f, l)}
            />
          ))}

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1" htmlFor="comment">
              Kommentar (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Was war besonders gut oder schlecht?"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {error && (
            <p id="rating-error" role="alert" className="text-sm text-[var(--error-text)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            aria-describedby={error ? 'rating-error' : undefined}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--btn-primary-bg)' }}
          >
            {saving ? 'Wird gespeichert…' : '🌸 Bewertung speichern'}
          </button>
        </form>
      </aside>
    </>
  );
}
