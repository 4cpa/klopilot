import { Rating } from '@prisma/client';

export type Score = {
  flowers: number;
  flies: number;
  net: number;
  count: number;
};

export const ZERO_SCORE: Score = { flowers: 0, flies: 0, net: 0, count: 0 };

// Alle 10 Bewertungs-Kriterien als [flowerField, fliesField]-Paare
export const CRITERIA = [
  ['flowersAccessibility', 'fliesAccessibility'],
  ['flowersCleanliness', 'fliesCleanliness'],
  ['flowersHygiene', 'fliesHygiene'],
  ['flowersStyle', 'fliesStyle'],
  ['flowersAmenities', 'fliesAmenities'],
  ['flowersSafety', 'fliesSafety'],
  ['flowersInclusivity', 'fliesInclusivity'],
  ['flowersCost', 'fliesCost'],
  ['flowersWait', 'fliesWait'],
  ['flowersKids', 'fliesKids'],
] as const;

type CriterionKey = (typeof CRITERIA)[number][0] | (typeof CRITERIA)[number][1];

function r1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Score aus einem Array von Rating-Objekten (für Detail-View) */
export function computeScore(ratings: Rating[]): Score {
  if (!ratings.length) return ZERO_SCORE;

  let sumF = 0,
    sumL = 0,
    activePairs = 0,
    netSum = 0;
  for (const [fk, lk] of CRITERIA) {
    const avgF = ratings.reduce((s, r) => s + r[fk], 0) / ratings.length;
    const avgL = ratings.reduce((s, r) => s + r[lk], 0) / ratings.length;
    sumF += avgF;
    sumL += avgL;
    if (avgF > 0 || avgL > 0) {
      netSum += avgF - avgL;
      activePairs++;
    }
  }
  return {
    flowers: r1(sumF / CRITERIA.length),
    flies: r1(sumL / CRITERIA.length),
    net: r1(activePairs ? netSum / activePairs : 0),
    count: ratings.length,
  };
}

/** Score aus Prisma groupBy-Ergebnis (für List-View, kein N+1) */
export function scoreFromGroup(group: {
  _count: { _all: number };
  _avg: Partial<Record<CriterionKey, number | null>>;
}): Score {
  const n = group._count._all;
  if (!n) return ZERO_SCORE;

  let sumF = 0,
    sumL = 0,
    activePairs = 0,
    netSum = 0;
  for (const [fk, lk] of CRITERIA) {
    const f = group._avg[fk] ?? 0;
    const l = group._avg[lk] ?? 0;
    sumF += f;
    sumL += l;
    if (f > 0 || l > 0) {
      netSum += f - l;
      activePairs++;
    }
  }
  return {
    flowers: r1(sumF / CRITERIA.length),
    flies: r1(sumL / CRITERIA.length),
    net: r1(activePairs ? netSum / activePairs : 0),
    count: n,
  };
}
