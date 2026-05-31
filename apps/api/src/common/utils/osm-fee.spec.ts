import { describe, it, expect } from 'vitest';
import { mapFee, MAX_PLAUSIBLE_FEE } from './osm-fee';

describe('mapFee', () => {
  it('gibt 0 zurück, wenn fee=no', () => {
    expect(mapFee({ fee: 'no' })).toBe(0);
  });

  it('gibt 0.5 (Fallback) zurück, wenn fee=yes ohne Betrag', () => {
    expect(mapFee({ fee: 'yes' })).toBe(0.5);
  });

  it('parst Komma-Dezimalwerte ("0,50 €" → 0.5)', () => {
    expect(mapFee({ fee: 'yes', charge: '0,50 €' })).toBe(0.5);
  });

  it('nimmt den ERSTEN Betrag bei mehreren Werten ("1.00/2.00" → 1)', () => {
    expect(mapFee({ fee: 'yes', charge: '1.00/2.00' })).toBe(1);
  });

  it('liest auch fee:amount aus', () => {
    expect(mapFee({ fee: 'yes', 'fee:amount': '2.50' })).toBe(2.5);
  });

  it('greift bei fee:conditional auch ohne fee=yes', () => {
    expect(mapFee({ 'fee:conditional': 'yes @ (Mo-Fr)', charge: '1' })).toBe(1);
  });

  it('verwirft unplausible Fremdwährungs-/Artefakt-Beträge → Fallback 0.5', () => {
    // Plausibilitätsgrenze schützt vor numeric(6,2)-Overflow (kein Wert > 20)
    expect(mapFee({ fee: 'yes', charge: '200 CZK' })).toBe(0.5);
    expect(mapFee({ fee: 'yes', charge: '1500 HUF' })).toBe(0.5);
    expect(mapFee({ fee: 'yes', charge: '10000' })).toBe(0.5);
  });

  it('hält die Plausibilitätsgrenze ein (kein Rückgabewert > MAX_PLAUSIBLE_FEE)', () => {
    expect(MAX_PLAUSIBLE_FEE).toBe(20);
    // Grenzwert exakt: noch übernommen
    expect(mapFee({ fee: 'yes', charge: '20' })).toBe(20);
    // knapp darüber: verworfen → Fallback
    expect(mapFee({ fee: 'yes', charge: '21' })).toBe(0.5);
  });

  it('parst plausible Beträge mit Währungspräfix/-suffix', () => {
    expect(mapFee({ fee: 'yes', charge: 'CHF 1' })).toBe(1);
    expect(mapFee({ fee: 'yes', charge: '2.50 SEK' })).toBe(2.5);
  });

  it('fällt bei unparsebarem Betrag auf 0.5 zurück ("abc")', () => {
    expect(mapFee({ fee: 'yes', charge: 'abc' })).toBe(0.5);
  });

  it('gibt undefined zurück, wenn kein fee-Tag vorhanden ist', () => {
    expect(mapFee({})).toBeUndefined();
    expect(mapFee({ amenity: 'toilets' })).toBeUndefined();
  });
});
