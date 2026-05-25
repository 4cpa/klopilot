import type { Score } from './types';

export const ZERO_SCORE: Score = { flowers: 0, flies: 0, net: 0, count: 0 };

export const CRITERIA_KEYS = [
  'accessibility',
  'cleanliness',
  'hygiene',
  'style',
  'amenities',
  'safety',
  'inclusivity',
  'cost',
  'wait',
  'kids',
] as const;

export const CRITERIA_LABELS: Record<(typeof CRITERIA_KEYS)[number], string> = {
  accessibility: 'Zugänglichkeit',
  cleanliness: 'Sauberkeit',
  hygiene: 'Hygiene',
  style: 'Stil & Aufmachung',
  amenities: 'Ausstattung',
  safety: 'Sicherheit',
  inclusivity: 'Inklusivität',
  cost: 'Kosten',
  wait: 'Wartezeit',
  kids: 'Kinderfreundlich',
};

function r1(n: number) {
  return Math.round(n * 10) / 10;
}

export function scoreNetColor(score?: Score): string {
  if (!score || score.count === 0) return '#9AA4B2';
  if (score.net > 1) return '#06D6A0'; // mint
  if (score.net > 0) return '#FFD23F'; // yellow
  if (score.net > -1) return '#FF8B5C'; // orange
  return '#EF476F'; // berry
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export function formatFee(fee?: number | null): string {
  if (!fee) return 'Kostenlos';
  return `CHF ${Number(fee).toFixed(2)}`;
}
