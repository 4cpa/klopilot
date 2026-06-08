/**
 * Geografischer Ausschluss von Belarus (BY) und Russland (RU) für den OSM-Seed.
 *
 * Hintergrund: Die Seed-Bounding-Boxes der Ost-Regionen (Polen, Baltikum,
 * Ukraine, Finnland, Nord-Norwegen) ragen über die Landesgrenzen hinaus auf
 * belarusisches bzw. russisches Territorium. Eine reine Bbox-Trennung ist dort
 * nicht möglich (Grenzen verlaufen diagonal), und der OSM-Tag `addr:country`
 * ist nur spärlich gesetzt — deshalb sind an den Grenzgebieten BY/RU-Toiletten
 * durchgerutscht.
 *
 * Lösung: Punkt-in-Polygon-Test gegen vereinfachte Umrisse von Belarus und der
 * westrussischen Grenzfront. Die Polygone folgen der realen Grenze auf wenige
 * Kilometer genau; eng beieinander liegende Grenzstädte (z. B. Narva EE vs.
 * Iwangorod RU, Białystok PL vs. Hrodna BY, Charkiw UA vs. Belgorod RU) sind in
 * osm-region.spec.ts als Regressionsfälle fixiert. Im Zweifel wird zugunsten
 * des Ausschlusses entschieden (Vorgabe: kein Seed auf BY/RU-Gebiet).
 *
 * Polygon-Koordinaten im GeoJSON-Format [lng, lat] (wie im restlichen Projekt).
 */

export type LngLat = [number, number];

// ── Belarus (vollständiges Land) ──────────────────────────────────────────────
// Ring im Uhrzeigersinn ab Südwest-Ecke (BY/PL/UA-Dreiländereck bei Brest).
export const BELARUS_POLYGON: LngLat[] = [
  [23.61, 51.52],
  [23.18, 52.1],
  [23.5, 52.6],
  [23.93, 52.69],
  [23.48, 53.95],
  [24.77, 53.91],
  [25.55, 54.32],
  [26.62, 55.18],
  [27.55, 55.78],
  [28.16, 56.1],
  [30.78, 55.65],
  [31.3, 54.1],
  [31.85, 53.0],
  [31.8, 52.1],
  [31.3, 51.85],
  [30.2, 51.55],
  [28.7, 51.43],
  [27.2, 51.62],
  [25.5, 51.62],
  [24.3, 51.6],
  [23.61, 51.52],
];

// ── Russland (westliche Grenzfront) ───────────────────────────────────────────
// Die Westgrenze (Nord→Süd: Nordnorwegen, Finnland, Estland/Lettland, dann quer
// durch Belarus — dort ohnehin via BELARUS_POLYGON ausgeschlossen — zur
// ukrainisch-russischen Grenze) bildet den linken Rand; rechts/östlich grob bis
// 60°E geschlossen, weit jenseits aller Seed-Bboxen.
export const RUSSIA_WEST_POLYGON: LngLat[] = [
  [31.5, 70.2],
  [31.0, 69.7],
  [30.2, 69.55],
  [28.96, 69.05],
  [29.4, 68.0],
  [30.1, 67.3],
  [30.0, 66.4],
  [29.9, 65.6],
  [30.0, 64.9],
  [30.6, 64.0],
  [31.3, 63.1],
  [31.6, 62.4],
  [30.0, 61.6],
  [28.85, 61.1],
  [27.8, 60.55],
  [28.0, 59.9],
  [28.19, 59.38],
  [27.55, 58.27],
  [27.35, 57.53],
  [27.85, 56.83],
  [28.16, 56.16],
  [31.79, 52.1],
  [33.5, 52.0],
  [34.2, 51.6],
  [35.6, 50.8],
  [36.1, 50.45],
  [36.6, 50.3],
  [37.5, 50.05],
  [38.2, 49.95],
  [39.8, 49.6],
  [40.1, 48.9],
  [40.2, 48.0],
  [39.9, 47.85],
  [38.3, 47.25],
  [47.0, 46.0],
  [60.0, 46.0],
  [60.0, 71.0],
  [31.5, 70.2],
];

// Kaliningrad (RU-Exklave zwischen PL/LT) — kein eigenes Polygon nötig, als Bbox
// [south, west, north, east] geführt.
export const EXCLUDE_BBOXES: Array<[number, number, number, number]> = [[54.2, 19.5, 55.4, 23.0]];

// ISO-3166-1-alpha-2 ausgeschlossener Länder (via OSM addr:country, falls gesetzt).
export const EXCLUDED_COUNTRIES = new Set(['RU', 'BY']);

/**
 * Ray-Casting-Punkt-in-Polygon-Test. `polygon` als Liste von [lng, lat].
 */
export function pointInPolygon(lat: number, lng: number, polygon: LngLat[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * True, wenn die Koordinate auf ausgeschlossenem Gebiet (BY/RU inkl. Kaliningrad)
 * liegt und daher NICHT importiert werden darf. Der `addr:country`-Tag wird als
 * günstiger Vorab-Check genutzt, ist aber nicht maßgeblich (oft nicht gesetzt).
 */
export function isExcludedLocation(
  lat: number,
  lng: number,
  tags: Record<string, string> = {},
): boolean {
  const cc = (tags['addr:country'] ?? '').trim().toUpperCase();
  if (cc.length === 2 && EXCLUDED_COUNTRIES.has(cc)) return true;
  if (EXCLUDE_BBOXES.some(([s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e)) {
    return true;
  }
  return pointInPolygon(lat, lng, BELARUS_POLYGON) || pointInPolygon(lat, lng, RUSSIA_WEST_POLYGON);
}
