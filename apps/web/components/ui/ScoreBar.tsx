import type { Score } from '@/lib/api';

interface Props {
  score: Score;
  className?: string;
}

export function ScoreBar({ score, className = '' }: Props) {
  if (score.count === 0) {
    return <p className={`text-sm text-[var(--muted)] ${className}`}>Noch keine Bewertungen</p>;
  }

  const maxVal = 5;
  const flowerPct = Math.min(100, (score.flowers / maxVal) * 100);
  const flyPct = Math.min(100, (score.flies / maxVal) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🌸
        </span>
        <div
          className="flex-1 h-2.5 bg-[var(--rate-flower-bg)] rounded-full overflow-hidden"
          role="img"
          aria-label={`Blümchen-Bewertung: ${score.flowers.toFixed(1)} von 5`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${flowerPct}%`, background: 'var(--rate-flower)' }}
          />
        </div>
        <span
          className="text-sm font-semibold w-6 text-right"
          style={{ color: 'var(--rate-flower-text)' }}
          aria-hidden
        >
          {score.flowers.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          🪰
        </span>
        <div
          className="flex-1 h-2.5 bg-[var(--rate-fly-bg)] rounded-full overflow-hidden"
          role="img"
          aria-label={`Fliegen-Bewertung: ${score.flies.toFixed(1)} von 5`}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${flyPct}%`, background: 'var(--rate-fly)' }}
          />
        </div>
        <span
          className="text-sm font-semibold w-6 text-right"
          style={{ color: 'var(--rate-fly)' }}
          aria-hidden
        >
          {score.flies.toFixed(1)}
        </span>
      </div>
      <p className="text-xs text-[var(--muted)] text-right">
        {score.count} Bewertung{score.count !== 1 ? 'en' : ''}
      </p>
    </div>
  );
}
