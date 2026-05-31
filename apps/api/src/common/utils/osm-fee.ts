/**
 * OSM-Tag → klopilot-Gebühr (feeChf).
 *
 * Bewusst als eigenes, seiteneffektfreies Modul (importierbar/testbar), während
 * `seed-osm.ts` beim Import den eigentlichen Overpass-Import startet.
 *
 * DB-Spalte feeChf ist numeric(6,2) → Betrag muss < 10000 sein. OSM-Werte sind
 * uneinheitlich ("0,50 €", "1.00/2.00", "200 CZK", "1500 HUF"). Wir nehmen den
 * ERSTEN Betrag und verwerfen unplausible Werte (Fremdwährung/Artefakte), damit
 * kein numeric-overflow den Import abbricht.
 */
export const MAX_PLAUSIBLE_FEE = 20;

export function mapFee(tags: Record<string, string>): number | undefined {
  if (tags['fee'] === 'no') return 0;
  if (tags['fee'] === 'yes' || tags['fee:conditional']) {
    const amount = tags['charge'] ?? tags['fee:amount'];
    if (amount) {
      // Komma→Punkt, dann ersten Zahlenwert extrahieren (keine Ziffern-Verkettung)
      const match = amount.replace(',', '.').match(/\d+(?:\.\d+)?/);
      if (match) {
        const n = parseFloat(match[0]);
        // Plausibel (≤ 20) → übernehmen; sonst Fremdwährung/Artefakt → Fallback
        if (!isNaN(n) && n >= 0 && n <= MAX_PLAUSIBLE_FEE) return n;
      }
    }
    return 0.5; // Fallback: 50 Rappen
  }
  return undefined; // unbekannt
}
