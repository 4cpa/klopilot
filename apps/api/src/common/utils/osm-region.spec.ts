import { describe, it, expect } from 'vitest';
import { isExcludedLocation, pointInPolygon, BELARUS_POLYGON } from './osm-region';

// Hilfsfunktion: Stadt = [lng, lat] → isExcludedLocation(lat, lng)
const excl = ([lng, lat]: [number, number], tags = {}) => isExcludedLocation(lat, lng, tags);

describe('isExcludedLocation', () => {
  // ── Auszuschliessen: Belarus ───────────────────────────────────────────────
  describe('schliesst belarusische Städte aus', () => {
    const BY: Record<string, [number, number]> = {
      Minsk: [27.56, 53.9],
      Brest: [23.7, 52.1],
      Hrodna: [23.83, 53.68],
      Homel: [30.98, 52.42],
      Wizebsk: [30.2, 55.19],
      Mahiljou: [30.33, 53.9],
      Pinsk: [26.1, 52.12],
      Polazk: [28.79, 55.49],
      Lida: [25.3, 53.89],
    };
    for (const [name, coord] of Object.entries(BY)) {
      it(name, () => expect(excl(coord)).toBe(true));
    }
  });

  // ── Auszuschliessen: Russland ──────────────────────────────────────────────
  describe('schliesst russische Städte aus', () => {
    const RU: Record<string, [number, number]> = {
      Pskow: [28.33, 57.82],
      Smolensk: [32.05, 54.78],
      Brjansk: [34.36, 53.25],
      Kursk: [36.19, 51.73],
      Belgorod: [36.59, 50.6],
      'Rostow am Don': [39.72, 47.23],
      Iwangorod: [28.21, 59.37],
      Wyborg: [28.73, 60.71],
      Sortawala: [30.69, 61.71],
      Petrosawodsk: [34.35, 61.79],
      Murmansk: [33.08, 68.97],
      'Welikije Luki': [30.53, 56.33],
      Kaliningrad: [20.51, 54.71], // via Bbox
    };
    for (const [name, coord] of Object.entries(RU)) {
      it(name, () => expect(excl(coord)).toBe(true));
    }
  });

  // ── Behalten: Nachbarländer (auch grenznahe Städte) ────────────────────────
  describe('behält Städte in Nachbarländern (kein Ausschluss)', () => {
    const KEEP: Record<string, [number, number]> = {
      'Białystok (PL)': [23.16, 53.13],
      'Lublin (PL)': [22.57, 51.25],
      'Warschau (PL)': [21.01, 52.23],
      'Vilnius (LT)': [25.28, 54.69],
      'Daugavpils (LV)': [26.52, 55.87],
      'Rēzekne (LV)': [27.33, 56.51],
      'Tallinn (EE)': [24.75, 59.43],
      'Narva (EE)': [28.18, 59.38],
      'Tartu (EE)': [26.72, 58.38],
      'Kyiv (UA)': [30.52, 50.45],
      'Tschernihiw (UA)': [31.29, 51.5],
      'Sumy (UA)': [34.8, 50.91],
      'Charkiw (UA)': [36.23, 49.99],
      'Mariupol (UA)': [37.54, 47.1],
      'Luhansk (UA)': [39.31, 48.57],
      'Helsinki (FI)': [24.94, 60.17],
      'Joensuu (FI)': [29.76, 62.6],
      'Imatra (FI)': [28.77, 61.17],
      'Lieksa (FI)': [30.02, 63.32],
      'Kirkenes (NO)': [30.0, 69.73],
    };
    for (const [name, coord] of Object.entries(KEEP)) {
      it(name, () => expect(excl(coord)).toBe(false));
    }
  });

  it('respektiert addr:country=RU/BY auch ausserhalb der Polygone', () => {
    expect(excl([10.0, 50.0], { 'addr:country': 'RU' })).toBe(true);
    expect(excl([10.0, 50.0], { 'addr:country': 'BY' })).toBe(true);
  });
});

describe('pointInPolygon', () => {
  it('erkennt einen Punkt klar innerhalb (Minsk in Belarus)', () => {
    expect(pointInPolygon(53.9, 27.56, BELARUS_POLYGON)).toBe(true);
  });
  it('erkennt einen Punkt klar ausserhalb (Warschau)', () => {
    expect(pointInPolygon(52.23, 21.01, BELARUS_POLYGON)).toBe(false);
  });
});
