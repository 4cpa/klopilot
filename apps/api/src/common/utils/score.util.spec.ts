import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { computeScore, scoreFromGroup, ZERO_SCORE } from './score.util';
import { RatingInputSchema } from '@/modules/ratings/ratings.service';
import type { Rating } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRating(overrides: Partial<Rating> = {}): Rating {
  return {
    id: 'r1',
    toiletId: 't1',
    userId: 'u1',
    createdAt: new Date(),
    comment: null,
    language: 'de',
    helpfulCount: 0,
    flowersAccessibility: 0,
    fliesAccessibility: 0,
    flowersCleanliness: 0,
    fliesCleanliness: 0,
    flowersHygiene: 0,
    fliesHygiene: 0,
    flowersStyle: 0,
    fliesStyle: 0,
    flowersAmenities: 0,
    fliesAmenities: 0,
    flowersSafety: 0,
    fliesSafety: 0,
    flowersInclusivity: 0,
    fliesInclusivity: 0,
    flowersCost: 0,
    fliesCost: 0,
    flowersWait: 0,
    fliesWait: 0,
    flowersKids: 0,
    fliesKids: 0,
    ...overrides,
  };
}

// ── computeScore ─────────────────────────────────────────────────────────────

describe('computeScore', () => {
  it('gibt ZERO_SCORE zurück wenn keine Ratings vorhanden', () => {
    expect(computeScore([])).toEqual(ZERO_SCORE);
  });

  it('berechnet positive net-Score für reine Blümchen-Bewertung', () => {
    const rating = makeRating({ flowersCleanliness: 5, flowersHygiene: 4 });
    const score = computeScore([rating]);
    expect(score.net).toBeGreaterThan(0);
    expect(score.flies).toBe(0);
    expect(score.count).toBe(1);
  });

  it('berechnet negativen net-Score für reine Fliegen-Bewertung', () => {
    const rating = makeRating({ fliesCleanliness: 5, fliesHygiene: 3 });
    const score = computeScore([rating]);
    expect(score.net).toBeLessThan(0);
    expect(score.flowers).toBe(0);
  });

  it('mittelt über mehrere Ratings korrekt', () => {
    const r1 = makeRating({ id: 'r1', userId: 'u1', flowersCleanliness: 4 });
    const r2 = makeRating({ id: 'r2', userId: 'u2', flowersCleanliness: 2 });
    const score = computeScore([r1, r2]);
    expect(score.count).toBe(2);
    expect(score.net).toBeGreaterThan(0);
  });

  it('net ist 0 wenn flowers === flies (symmetrisch)', () => {
    // Zwei User: einer gibt Blümchen, einer Fliegen — gleicher Wert
    const r1 = makeRating({ id: 'r1', userId: 'u1', flowersCleanliness: 3 });
    const r2 = makeRating({ id: 'r2', userId: 'u2', fliesCleanliness: 3 });
    const score = computeScore([r1, r2]);
    // avg flowers = 1.5, avg flies = 1.5 → net = 0
    expect(score.net).toBe(0);
  });

  it('rundet auf eine Dezimalstelle', () => {
    const r1 = makeRating({ id: 'r1', userId: 'u1', flowersCleanliness: 1 });
    const r2 = makeRating({ id: 'r2', userId: 'u2', flowersCleanliness: 2 });
    const r3 = makeRating({ id: 'r3', userId: 'u3', flowersCleanliness: 2 });
    const score = computeScore([r1, r2, r3]);
    const decimals = score.net.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it('zählt nur aktive Kriterien in den net-Score', () => {
    // Nur 1 von 10 Kriterien bewertet
    const rating = makeRating({ flowersCleanliness: 5 });
    const score = computeScore([rating]);
    // net = nur aus cleanliness berechnet, nicht durch alle 10 geteilt
    expect(score.net).toBe(5);
  });
});

// ── scoreFromGroup ────────────────────────────────────────────────────────────

describe('scoreFromGroup', () => {
  it('gibt ZERO_SCORE zurück wenn count 0', () => {
    const group = { _count: { _all: 0 }, _avg: {} };
    expect(scoreFromGroup(group)).toEqual(ZERO_SCORE);
  });

  it('produziert äquivalente Ergebnisse zu computeScore für einfachen Fall', () => {
    // Ein Rating mit flowers=4 auf cleanliness
    const fromCompute = computeScore([makeRating({ flowersCleanliness: 4 })]);
    const fromGroup = scoreFromGroup({
      _count: { _all: 1 },
      _avg: {
        flowersAccessibility: 0,
        fliesAccessibility: 0,
        flowersCleanliness: 4,
        fliesCleanliness: 0,
        flowersHygiene: 0,
        fliesHygiene: 0,
        flowersStyle: 0,
        fliesStyle: 0,
        flowersAmenities: 0,
        fliesAmenities: 0,
        flowersSafety: 0,
        fliesSafety: 0,
        flowersInclusivity: 0,
        fliesInclusivity: 0,
        flowersCost: 0,
        fliesCost: 0,
        flowersWait: 0,
        fliesWait: 0,
        flowersKids: 0,
        fliesKids: 0,
      },
    });
    expect(fromGroup.net).toBeCloseTo(fromCompute.net, 1);
    expect(fromGroup.count).toBe(1);
  });
});

// ── XOR-Validierung (via RatingInputSchema) ───────────────────────────────────

describe('RatingInputSchema XOR-Constraint', () => {
  it('akzeptiert nur flowers > 0 pro Kriterium', () => {
    const result = RatingInputSchema.safeParse({
      scores: { cleanliness: { flowers: 4, flies: 0 } },
    });
    expect(result.success).toBe(true);
  });

  it('akzeptiert nur flies > 0 pro Kriterium', () => {
    const result = RatingInputSchema.safeParse({
      scores: { cleanliness: { flowers: 0, flies: 3 } },
    });
    expect(result.success).toBe(true);
  });

  it('lehnt flowers > 0 UND flies > 0 gleichzeitig ab', () => {
    const result = RatingInputSchema.safeParse({
      scores: { cleanliness: { flowers: 3, flies: 2 } },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/Blümchen und Fliegen/);
  });

  it('akzeptiert leeres scores-Objekt', () => {
    const result = RatingInputSchema.safeParse({ scores: {} });
    expect(result.success).toBe(true);
  });

  it('akzeptiert mehrere Kriterien mit verschiedenen Typen', () => {
    const result = RatingInputSchema.safeParse({
      scores: {
        cleanliness: { flowers: 5, flies: 0 },
        hygiene: { flowers: 0, flies: 2 },
      },
    });
    expect(result.success).toBe(true);
  });
});
