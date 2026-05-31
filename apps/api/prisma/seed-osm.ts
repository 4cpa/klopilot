/**
 * OSM-Import: Öffentliche Toiletten aus OpenStreetMap via Overpass API
 *
 * Quellen:
 *   - OpenStreetMap (openstreetmap.org) — lizenziert unter ODbL
 *   - Overpass API (overpass-api.de) — kostenlos, kein API-Key nötig
 *
 * Regionen: Schweiz + angrenzende Gebiete (D/A/F/I je ~30 km)
 *
 * Aufruf:
 *   pnpm --filter api db:seed-osm
 *   pnpm --filter api db:seed-osm -- --dry-run    # nur anzeigen, nicht schreiben
 */

import { PrismaClient } from '@prisma/client';
import { type OsmCategory, resolveCategory } from '../src/common/utils/osm-category';
import { mapFee } from '../src/common/utils/osm-fee';
import { reindexMeili } from './reindex-meili';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// --only=Name1,Name2 → nur passende Regionen importieren (Substring, case-insensitive).
// Damit lässt sich gezielt eine Region nachimportieren (z. B. --only=Griechenland),
// ohne den ganzen Europa-Lauf. Die globalen Phasen 2/3/7/8 (Eurokey/Nette/HBf/Coop)
// werden dann übersprungen.
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '')
  .replace('--only=', '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const regionMatches = (name: string) =>
  ONLY.length === 0 || ONLY.some((o) => name.toLowerCase().includes(o));

// ── Bounding-Boxes ────────────────────────────────────────────────────────────
// Format: [south, west, north, east]
const REGIONS: Array<{ name: string; bbox: [number, number, number, number] }> = [
  // ── Schweiz ──────────────────────────────────────────────────────────────────
  { name: 'Schweiz', bbox: [45.8, 5.9, 47.8, 10.5] },

  // ── Österreich (komplett, inkl. Vorarlberg ab 9.5°E) ─────────────────────────
  { name: 'Österreich', bbox: [46.3, 9.5, 48.8, 17.2] as [number, number, number, number] },

  // ── Deutschland (2 Teile für Overpass-Timeout) ────────────────────────────────
  // Süd: Bayern, BW, Saarland, RLP, Thüringen → München, Stuttgart, Nürnberg, Freiburg
  { name: 'Deutschland-S', bbox: [47.2, 5.8, 51.0, 15.1] as [number, number, number, number] },
  // Nord: NRW, Hessen, Niedersachsen, Hamburg, Bremen, SH, MV, Berlin, BB, Sachsen, LSA
  { name: 'Deutschland-N', bbox: [51.0, 5.8, 55.1, 15.1] as [number, number, number, number] },

  // ── Frankreich (3 Teile) ──────────────────────────────────────────────────────
  // Nord-Ost: Elsass, Lothringen, Bourgogne-FC → direkt angrenzend an CH/DE
  { name: 'Frankreich-NE', bbox: [46.0, 5.5, 49.5, 8.5] as [number, number, number, number] },
  // Nord-West: Île-de-France (Paris), Normandie, Bretagne, Hauts-de-France
  { name: 'Frankreich-NW', bbox: [46.0, -5.5, 51.5, 5.5] as [number, number, number, number] },
  // Süd: Nouvelle-Aquitaine, Occitanie, PACA, Auvergne-RA → Lyon, Marseille, Bordeaux, Toulouse
  { name: 'Frankreich-S', bbox: [41.3, -5.5, 46.0, 9.6] as [number, number, number, number] },

  // ── Italien (3 Teile) ────────────────────────────────────────────────────────
  // Nord: Piemonte, Lombardei, Veneto, Ligurien, Friaul, Trentino, Emilia-Romagna
  { name: 'Italien-N', bbox: [43.5, 6.6, 46.8, 14.0] },
  // Mitte: Toskana, Latium (Roma), Umbrien, Marken, Abruzzen, Molise
  { name: 'Italien-M', bbox: [40.5, 11.0, 43.5, 15.8] as [number, number, number, number] },
  // Süd + Inseln: Kampanien (Napoli), Kalabrien, Apulien, Basilikata, Sizilien, Sardinien
  { name: 'Italien-S', bbox: [35.0, 7.5, 40.5, 18.6] as [number, number, number, number] },

  // ── Benelux ───────────────────────────────────────────────────────────────────
  { name: 'Luxemburg', bbox: [49.4, 5.7, 50.2, 6.6] as [number, number, number, number] },
  { name: 'Belgien', bbox: [49.5, 2.5, 51.6, 6.5] as [number, number, number, number] },
  { name: 'Niederlande', bbox: [50.7, 3.3, 53.6, 7.3] as [number, number, number, number] },

  // ── Iberische Halbinsel ───────────────────────────────────────────────────────
  // Portugal: Lissabon, Porto, Faro
  { name: 'Portugal', bbox: [36.8, -9.6, 42.2, -6.2] as [number, number, number, number] },
  // Spanien-N: Galicia, Asturien, Kantabrien, País Vasco, Navarra, Aragón, Katalonien, Kastilien-León
  { name: 'Spanien-N', bbox: [40.0, -9.5, 43.9, 4.4] as [number, number, number, number] },
  // Spanien-S: Andalusien, Extremadura, Kastilien-La Mancha, Valencia, Murcia, Balearen
  { name: 'Spanien-S', bbox: [35.9, -9.5, 40.0, 4.4] as [number, number, number, number] },

  // ── Skandinavien ──────────────────────────────────────────────────────────────
  // Dänemark (inkl. Bornholm): Kopenhagen, Aarhus, Odense
  { name: 'Dänemark', bbox: [54.5, 8.0, 57.9, 15.3] as [number, number, number, number] },
  // Schweden-S: Stockholm, Göteborg, Malmö, Uppsala
  { name: 'Schweden-S', bbox: [55.3, 10.5, 62.5, 24.2] as [number, number, number, number] },
  // Schweden-N: Sundsvall, Umeå, Luleå, Kiruna
  { name: 'Schweden-N', bbox: [62.5, 10.5, 69.1, 24.2] as [number, number, number, number] },
  // Norwegen-S: Oslo, Bergen, Stavanger, Trondheim
  { name: 'Norwegen-S', bbox: [57.5, 4.5, 63.0, 16.0] as [number, number, number, number] },
  // Norwegen-N: Bodø, Tromsø, Nordkapp
  { name: 'Norwegen-N', bbox: [63.0, 4.5, 71.2, 31.5] as [number, number, number, number] },
  // Finnland-S: Helsinki, Tampere, Turku, Jyväskylä
  { name: 'Finnland-S', bbox: [59.5, 19.5, 65.5, 31.6] as [number, number, number, number] },
  // Finnland-N: Oulu, Rovaniemi, Lappland
  { name: 'Finnland-N', bbox: [65.5, 19.5, 70.5, 31.6] as [number, number, number, number] },

  // ── Britische Inseln ──────────────────────────────────────────────────────────
  // England + Wales: London, Manchester, Birmingham, Leeds, Bristol, Cardiff
  { name: 'England-Wales', bbox: [49.9, -5.8, 53.5, 2.0] as [number, number, number, number] },
  // Schottland + Nordirland: Edinburgh, Glasgow, Aberdeen, Belfast
  { name: 'Schottland-NI', bbox: [53.5, -8.2, 60.9, -0.7] as [number, number, number, number] },
  // Irland (Republik): Dublin, Cork, Galway, Limerick
  { name: 'Irland', bbox: [51.4, -10.5, 55.4, -5.8] as [number, number, number, number] },

  // ── Inselstaaten & -territorien ───────────────────────────────────────────────
  // Island: Reykjavik, Akureyri
  { name: 'Island', bbox: [63.2, -24.6, 66.6, -13.3] as [number, number, number, number] },
  // Malta: Valletta, Sliema
  { name: 'Malta', bbox: [35.7, 14.1, 36.1, 14.7] as [number, number, number, number] },
  // Zypern: Nikosia, Limassol, Larnaka
  { name: 'Zypern', bbox: [34.5, 32.2, 35.7, 34.1] as [number, number, number, number] },
  // Färöer-Inseln: Tórshavn
  { name: 'Färöer', bbox: [61.3, -7.7, 62.4, -6.3] as [number, number, number, number] },
  // Kanarische Inseln (ES): Las Palmas, Santa Cruz de Tenerife
  { name: 'Kanaren', bbox: [27.6, -18.2, 29.5, -13.4] as [number, number, number, number] },
  // Madeira (PT): Funchal
  { name: 'Madeira', bbox: [32.6, -17.3, 33.1, -16.3] as [number, number, number, number] },
  // Azoren (PT): Ponta Delgada
  { name: 'Azoren', bbox: [36.9, -31.3, 39.9, -24.8] as [number, number, number, number] },
  // Korsika (FR): Ajaccio, Bastia
  { name: 'Korsika', bbox: [41.3, 8.5, 43.1, 9.6] as [number, number, number, number] },

  // ── Griechenland (Festland + Inseln: Athen, Thessaloniki, Kreta, Rhodos …) ───
  // Festland/Peloponnes + Ägäis bis Dodekanes; Kreta im Süden (ab ~34.8°N).
  {
    name: 'Griechenland-Festland',
    bbox: [37.0, 19.3, 41.8, 26.6] as [number, number, number, number],
  },
  {
    name: 'Griechenland-Süd/Inseln',
    bbox: [34.7, 22.0, 39.4, 28.4] as [number, number, number, number],
  },
];

// Aktive Regionen unter Berücksichtigung von --only (Phasen 1/4/5/6).
const ACTIVE_REGIONS = REGIONS.filter((r) => regionMatches(r.name));

// ── Nicht-europäische Treffer ausschliessen ──────────────────────────────────
// Rechteckige Import-Bboxen ragen an den Rändern in Nachbarländer (z. B. der
// Südrand der Italien-Bbox nach Tunesien). Solche Toiletten werden übersprungen.
// EU-Aussengebiete (Kanaren, Zypern, …) bleiben bewusst erhalten.
const EXCLUDE_BBOXES: Array<[number, number, number, number]> = [
  // [south, west, north, east]
  [30.0, 7.5, 37.4, 11.6], // Tunesien (Südrand Italien-S); Lampedusa/Pantelleria (lng>12) bleiben
  // Türkisches Festland (Ostrand der Griechenland-Süd-Bbox). Sorgfältig so
  // gewählt, dass die grossen griechischen Inseln draussen bleiben:
  [38.0, 26.85, 39.5, 28.5], // Izmir/Manisa — Lesbos/Chios (lng<26.85) bleiben
  [36.6, 27.2, 38.0, 28.6], // Muğla/Bodrum/Marmaris — Kos/Samos (lng<27.2), Rhodos (lat<36.6) bleiben
];
// ISO-3166-1-alpha-2 nicht-europäischer Länder (via OSM addr:country)
const NON_EU_COUNTRIES = new Set([
  'TN',
  'MA',
  'DZ',
  'LY',
  'EG',
  'TR',
  'SY',
  'LB',
  'IL',
  'PS',
  'JO',
  'IQ',
  'SA',
]);
function isNonEuropeanLocation(lat: number, lng: number, tags: Record<string, string>): boolean {
  const cc = (tags['addr:country'] ?? '').trim().toUpperCase();
  if (cc.length === 2 && NON_EU_COUNTRIES.has(cc)) return true;
  return EXCLUDE_BBOXES.some(([s, w, n, e]) => lat >= s && lat <= n && lng >= w && lng <= e);
}

// ── Adresse aus OSM-Tags ──────────────────────────────────────────────────────
function buildAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];
  if (tags['addr:street']) {
    parts.push(
      tags['addr:street'] + (tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''),
    );
  }
  if (tags['addr:postcode'] && tags['addr:city']) {
    parts.push(tags['addr:postcode'] + ' ' + tags['addr:city']);
  } else if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

// ── Zugänglichkeit aus OSM-Tags ───────────────────────────────────────────────
function mapAccessibility(tags: Record<string, string>): Record<string, boolean> | undefined {
  const result: Record<string, boolean> = {};

  // Rollstuhlgerecht
  const wheelchair = tags['toilets:wheelchair'] ?? tags['wheelchair'];
  if (wheelchair === 'yes' || wheelchair === 'designated') result.wheelchair = true;

  // Eurokey (europäischer Behindertenausweis-Schlüssel)
  if (tags['centralkey'] === 'eurokey' || tags['key:eurokey'] === 'yes') result.euro_key = true;

  // Wickeltisch
  if (tags['changing_table'] === 'yes' || tags['diaper'] === 'yes') result.baby_changing = true;

  // Geschlechtsneutral / unisex
  if (tags['unisex'] === 'yes' || tags['toilets:unisex'] === 'yes') result.gender_neutral = true;

  // Stufenlos
  if (tags['wheelchair'] === 'yes' || tags['step_free'] === 'yes') result.step_free = true;

  // Dusche
  if (tags['shower'] === 'yes') result.shower = true;

  return Object.keys(result).length > 0 ? result : undefined;
}

// ── Overpass-Abfrage ──────────────────────────────────────────────────────────
async function queryOverpass(
  bbox: [number, number, number, number],
  extraFilter = '',
  /** Vollständige Overpass-QL Query (ersetzt bbox-Platzhalter {BBOX}) */
  fullQuery = false,
): Promise<Array<{ osmId: string; lat: number; lng: number; tags: Record<string, string> }>> {
  const [s, w, n, e] = bbox;
  const bboxStr = `${s},${w},${n},${e}`;
  const query = fullQuery
    ? extraFilter.replace(/\{BBOX\}/g, bboxStr)
    : extraFilter
      ? `[out:json][timeout:60];(${extraFilter.replace(/\{BBOX\}/g, bboxStr)});out center body;`
      : `[out:json][timeout:60];(node[amenity=toilets](${bboxStr});way[amenity=toilets](${bboxStr}););out center body;`;

  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];
  const HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'klopilot/1.0 seed-osm-import (admin@4cpa.ch)',
  };

  let res: Response | null = null;
  for (const endpoint of ENDPOINTS) {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: HEADERS,
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) break;
    console.log(`  ⚠ ${endpoint} → ${res.status}, versuche nächste Instanz…`);
    await sleep(3000);
  }
  if (!res || !res.ok) throw new Error(`Alle Overpass-Instanzen fehlgeschlagen`);

  const json = (await res.json()) as {
    elements: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  return json.elements
    .filter((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      return lat !== undefined && lon !== undefined;
    })
    .map((el) => ({
      osmId: `${el.type}/${el.id}`,
      lat: el.lat ?? el.center!.lat,
      lng: el.lon ?? el.center!.lon,
      tags: el.tags ?? {},
    }));
}

// ── Einzelne Toilette upserten ────────────────────────────────────────────────
async function upsertToilet(
  item: { osmId: string; lat: number; lng: number; tags: Record<string, string> },
  systemUserId: string,
  counters: { imported: number; skipped: number; failed: number },
  forceCat?: OsmCategory,
) {
  const tags = item.tags;

  // Privat / gesperrt → überspringen
  if (tags['access'] === 'private' || tags['access'] === 'no') {
    counters.skipped++;
    return;
  }

  // Ausserhalb Europas (Bbox-Ränder ragen in Nachbarländer) → überspringen
  if (isNonEuropeanLocation(item.lat, item.lng, tags)) {
    counters.skipped++;
    return;
  }

  try {
    await persistToilet(item, systemUserId, forceCat);
    counters.imported++;
  } catch (err) {
    // Einzelner Datensatz darf den restlichen Regions-Import nicht abbrechen
    counters.failed++;
    if (counters.failed <= 20) {
      console.warn(`  ⚠ Überspringe ${item.osmId}: ${(err as Error).message.split('\n')[0]}`);
    }
  }
}

// Eigentliches Persistieren (wirft bei DB-Fehlern → vom Aufrufer abgefangen)
async function persistToilet(
  item: { osmId: string; lat: number; lng: number; tags: Record<string, string> },
  systemUserId: string,
  forceCat?: OsmCategory,
) {
  const tags = item.tags;

  const city = tags['addr:city'] ?? tags['addr:municipality'] ?? '';
  const name =
    tags['name'] ??
    tags['description'] ??
    (city ? `Öffentliche Toilette ${city}` : 'Öffentliche Toilette');

  const category = resolveCategory(tags, forceCat);
  const address = buildAddress(tags);
  const feeChf = mapFee(tags);
  const accessibility = mapAccessibility(tags);

  if (DRY_RUN) {
    const eurokey = accessibility?.euro_key ? ' [EUROKEY]' : '';
    const wc = accessibility?.wheelchair ? ' [WC]' : '';
    console.log(
      `    [DRY] ${item.osmId}: ${name} (${category})${eurokey}${wc} @ ${item.lat},${item.lng}`,
    );
    return;
  }

  const toilet = await prisma.toilet.upsert({
    where: { osmId: item.osmId },
    create: {
      name: name.slice(0, 120),
      category,
      longitude: item.lng,
      latitude: item.lat,
      address,
      feeChf: feeChf !== undefined ? feeChf : undefined,
      accessibility: accessibility ?? undefined,
      source: 'osm',
      osmId: item.osmId,
      isAvailable: true,
      visibility: category === 'nette_toilette' ? 'nette_toilette' : 'public',
      createdById: systemUserId,
    },
    update: {
      name: name.slice(0, 120),
      category, // OSM-Quelle: Kategorie darf aktualisiert werden (kein manueller Nutzer-Eintrag)
      address,
      feeChf: feeChf !== undefined ? feeChf : undefined,
      accessibility: accessibility ?? undefined,
    },
  });

  // PostGIS geom setzen (nur wenn noch nicht gesetzt)
  await prisma.$executeRaw`
    UPDATE toilets
    SET    geom = ST_SetSRID(ST_MakePoint(${item.lng}, ${item.lat}), 4326)::geography
    WHERE  id   = ${toilet.id}::uuid
      AND  geom IS NULL
  `;
}

// ── Hilfsfunktion: Schlafe ────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Hauptlogik ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚽 klopilot OSM-Import gestartet');
  if (DRY_RUN) console.log('  (DRY RUN — keine Datenbankänderungen)');

  // System-User
  let systemUser = await prisma.user.findFirst({ where: { handle: 'osm-import' } });
  if (!systemUser && !DRY_RUN) {
    systemUser = await prisma.user.create({
      data: { handle: 'osm-import', role: 'anon' },
    });
    console.log('  ✓ System-User "osm-import" angelegt');
  }
  const systemUserId = systemUser?.id ?? '00000000-0000-0000-0000-000000000000';

  // Alte Seed-Daten entfernen
  if (!DRY_RUN) {
    const deleted = await prisma.toilet.deleteMany({
      where: { source: 'user', osmId: null, createdBy: { handle: { in: ['seed', 'osm-import'] } } },
    });
    if (deleted.count > 0) console.log(`  🗑️  ${deleted.count} Beispiel-Toiletten entfernt`);
  }

  const counters = { imported: 0, skipped: 0, failed: 0 };

  // ── Phase 1: Standard-Import (alle amenity=toilets) ──────────────────────────
  console.log('\n── Phase 1: Standard-Toiletten ──────────────────────');
  for (const region of ACTIVE_REGIONS) {
    console.log(`\n📍 Region: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox);
      console.log(`  ${items.length} Toiletten gefunden`);
      for (const item of items) {
        await upsertToilet(item, systemUserId, counters);
      }
      await sleep(2500);
    } catch (err) {
      console.error(`  ❌ Fehler bei Region ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 2: Eurokey-Toiletten (alle 19 Länder) ────────────────────────────────
  console.log('\n── Phase 2: Eurokey-Toiletten ───────────────────────');
  const EUROKEY_REGIONS = [
    { name: 'CH-Eurokey', bbox: [45.8, 5.9, 47.8, 10.5] as [number, number, number, number] },
    { name: 'AT-Eurokey', bbox: [46.3, 9.5, 48.8, 17.2] as [number, number, number, number] },
    { name: 'DE-S-Eurokey', bbox: [47.2, 5.8, 51.0, 15.1] as [number, number, number, number] },
    { name: 'DE-N-Eurokey', bbox: [51.0, 5.8, 55.1, 15.1] as [number, number, number, number] },
    { name: 'FR-Eurokey', bbox: [41.3, -5.5, 51.5, 9.6] as [number, number, number, number] },
    { name: 'IT-Eurokey', bbox: [35.0, 6.6, 46.8, 18.6] as [number, number, number, number] },
    { name: 'NL-Eurokey', bbox: [50.7, 3.3, 53.6, 7.3] as [number, number, number, number] },
    { name: 'BE-Eurokey', bbox: [49.5, 2.5, 51.6, 6.5] as [number, number, number, number] },
    { name: 'LU-Eurokey', bbox: [49.4, 5.7, 50.2, 6.6] as [number, number, number, number] },
    { name: 'DK-Eurokey', bbox: [54.5, 8.0, 57.9, 15.3] as [number, number, number, number] },
    { name: 'SE-Eurokey', bbox: [55.3, 10.5, 69.1, 24.2] as [number, number, number, number] },
    { name: 'NO-Eurokey', bbox: [57.5, 4.5, 71.2, 31.5] as [number, number, number, number] },
    { name: 'FI-Eurokey', bbox: [59.5, 19.5, 70.5, 31.6] as [number, number, number, number] },
    { name: 'UK-Eurokey', bbox: [49.9, -8.2, 60.9, 2.0] as [number, number, number, number] },
  ];
  const EUROKEY_FILTER =
    'node["amenity"="toilets"]["centralkey"="eurokey"]({BBOX});' +
    'way["amenity"="toilets"]["centralkey"="eurokey"]({BBOX});' +
    'node["amenity"="toilets"]["key:eurokey"="yes"]({BBOX});';

  for (const region of ONLY.length ? [] : EUROKEY_REGIONS) {
    console.log(`\n♿ Eurokey-Region: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox, EUROKEY_FILTER);
      console.log(`  ${items.length} Eurokey-Toiletten gefunden`);
      for (const item of items) {
        // euro_key wird via mapAccessibility gesetzt
        await upsertToilet(item, systemUserId, counters);
      }
      await sleep(2000);
    } catch (err) {
      console.error(`  ❌ Fehler bei ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 3: Nette Toilette Projekt ───────────────────────────────────────────
  console.log('\n── Phase 3: Nette Toilette Projekt ──────────────────');
  const NETTE_FILTER =
    'node[~"^(toilets:scheme|nette_toilette)$"~"nette_toilette|yes"]({BBOX});' +
    'way[~"^(toilets:scheme|nette_toilette)$"~"nette_toilette|yes"]({BBOX});' +
    'node["amenity"]["operator"~"nette.toilette",i]({BBOX});';

  for (const region of ONLY.length
    ? []
    : [
        { name: 'CH-NetteToi', bbox: [45.8, 5.9, 47.8, 10.5] as [number, number, number, number] },
        {
          name: 'DE-S-NetteToi',
          bbox: [47.2, 5.8, 51.0, 15.1] as [number, number, number, number],
        },
        {
          name: 'DE-N-NetteToi',
          bbox: [51.0, 5.8, 55.1, 15.1] as [number, number, number, number],
        },
        { name: 'AT-NetteToi', bbox: [46.3, 9.5, 48.8, 17.2] as [number, number, number, number] },
        { name: 'NL-NetteToi', bbox: [50.7, 3.3, 53.6, 7.3] as [number, number, number, number] },
        { name: 'BE-NetteToi', bbox: [49.5, 2.5, 51.6, 6.5] as [number, number, number, number] },
        { name: 'LU-NetteToi', bbox: [49.4, 5.7, 50.2, 6.6] as [number, number, number, number] },
        { name: 'FR-NetteToi', bbox: [41.3, -5.5, 51.5, 9.6] as [number, number, number, number] },
      ]) {
    console.log(`\n🤝 Nette Toilette Region: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox, NETTE_FILTER);
      console.log(`  ${items.length} Nette-Toilette-Einträge gefunden`);
      for (const item of items) {
        await upsertToilet(item, systemUserId, counters, 'nette_toilette');
      }
      await sleep(2000);
    } catch (err) {
      console.error(`  ❌ Fehler bei ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 4: Bahnhofs-Toiletten (explizit via location-Tag) ──────────────────
  console.log('\n── Phase 4: Bahnhofs-Toiletten ──────────────────────');
  const STATION_FILTER =
    'node["amenity"="toilets"]["public_transport"]({BBOX});' +
    'node["amenity"="toilets"]["railway"]({BBOX});' +
    'way["amenity"="toilets"]["public_transport"]({BBOX});' +
    'node["amenity"="toilets"][~"^location$"~"station|airport|railway|transit",i]({BBOX});' +
    'way["amenity"="toilets"][~"^location$"~"station|airport|railway|transit",i]({BBOX});';

  for (const region of ACTIVE_REGIONS) {
    console.log(`\n🚉 Bahnhofs-Region: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox, STATION_FILTER);
      console.log(`  ${items.length} Bahnhofs-Toiletten gefunden`);
      for (const item of items) {
        await upsertToilet(item, systemUserId, counters, 'transport');
      }
      await sleep(2000);
    } catch (err) {
      console.error(`  ❌ Fehler bei ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 5: Bahnhofs-/Flughafen-Toiletten via Bereichsabfrage ───────────────
  // Radius 500m (statt 250m), KEIN BBox-Filter auf den Toiletten-Nodes damit
  // Toiletten an Grenzen nicht verschwinden. Relations (für grosse HBf) einbezogen.
  console.log('\n── Phase 5: Stationen/Airports (Bereichsabfrage, r=500m) ────');
  const STATION_AREA_QUERY = `
[out:json][timeout:120];
(
  node["railway"="station"]({BBOX});
  way["railway"="station"]({BBOX});
  node["aeroway"="terminal"]({BBOX});
  way["aeroway"="terminal"]({BBOX});
  node["public_transport"="station"]({BBOX});
  way["public_transport"="station"]({BBOX});
)->.transport;
(
  node["amenity"="toilets"](around.transport:500);
  way["amenity"="toilets"](around.transport:500);
);
out center body;`.trim();

  for (const region of ACTIVE_REGIONS) {
    console.log(`\n🚉 Station-Bereich: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox, STATION_AREA_QUERY, true);
      console.log(`  ${items.length} Stationstoiletten (Bereich) gefunden`);
      for (const item of items) {
        await upsertToilet(item, systemUserId, counters, 'transport');
      }
      await sleep(3000);
    } catch (err) {
      console.error(`  ❌ Fehler bei ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 6: Einkaufszentren via Bereichsabfrage ──────────────────────────────
  console.log('\n── Phase 6: Einkaufszentren (Bereichsabfrage) ───────');
  const MALL_AREA_QUERY = `
[out:json][timeout:90];
(
  node["shop"="mall"]({BBOX});
  way["shop"="mall"]({BBOX});
  node["shop"="department_store"]({BBOX});
  way["shop"="department_store"]({BBOX});
  node["shop"="supermarket"]["name"~"Coop|Migros|Globus|Manor|Breuninger|Galeria|Kaufhof",i]({BBOX});
  way["shop"="supermarket"]["name"~"Coop City|Migros City|Globus",i]({BBOX});
)->.malls;
(
  node["amenity"="toilets"](around.malls:200)({BBOX});
  way["amenity"="toilets"](around.malls:200)({BBOX});
);
out center body;`.trim();

  for (const region of ACTIVE_REGIONS) {
    console.log(`\n🏬 Mall-Bereich: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox, MALL_AREA_QUERY, true);
      console.log(`  ${items.length} Mall-Toiletten (Bereich) gefunden`);
      for (const item of items) {
        await upsertToilet(item, systemUserId, counters, 'mall');
      }
      await sleep(3000);
    } catch (err) {
      console.error(`  ❌ Fehler bei ${region.name}:`, (err as Error).message);
    }
  }

  // ── Phase 7: Grosse Hauptbahnhöfe (direkte Named-Query, kein BBox-Zwang) ──────
  // Für die grössten Fernbahnhöfe D-A-CH + FR + IT deren Toiletten-Nodes oft
  // innerhalb eines komplexen Way/Relation-Bahnhofspolygons liegen und durch die
  // BBox-Filterung in Phase 5 nicht gefunden werden.
  console.log('\n── Phase 7: Grosse Hauptbahnhöfe (Named) ─────────────');
  const MAJOR_STATIONS: Array<{ name: string; lat: number; lng: number; r: number }> = [
    // Schweiz
    { name: 'Zürich HB', lat: 47.3782, lng: 8.5403, r: 600 },
    { name: 'Bern HB', lat: 46.949, lng: 7.4391, r: 500 },
    { name: 'Basel SBB', lat: 47.5476, lng: 7.5892, r: 500 },
    { name: 'Genève Cornavin', lat: 46.21, lng: 6.1426, r: 500 },
    { name: 'Lausanne', lat: 46.5169, lng: 6.6297, r: 500 },
    { name: 'Luzern', lat: 47.0505, lng: 8.3101, r: 500 },
    { name: 'St. Gallen', lat: 47.4232, lng: 9.3697, r: 400 },
    { name: 'Winterthur', lat: 47.5003, lng: 8.7241, r: 400 },
    { name: 'Olten', lat: 47.3521, lng: 7.9077, r: 400 },
    { name: 'Biel/Bienne', lat: 47.1374, lng: 7.2463, r: 400 },
    // Österreich
    { name: 'Wien HB', lat: 48.1851, lng: 16.3762, r: 600 },
    { name: 'Wien Westbahnhof', lat: 48.1969, lng: 16.3381, r: 500 },
    { name: 'Wien Meidling', lat: 48.173, lng: 16.3327, r: 400 },
    { name: 'Graz HB', lat: 47.0726, lng: 15.4136, r: 500 },
    { name: 'Salzburg HB', lat: 47.8131, lng: 13.0455, r: 500 },
    { name: 'Linz HB', lat: 48.2902, lng: 14.2918, r: 500 },
    { name: 'Innsbruck HB', lat: 47.2638, lng: 11.4005, r: 500 },
    // Deutschland
    { name: 'München HB', lat: 48.1402, lng: 11.5599, r: 700 },
    { name: 'Berlin HBf', lat: 52.5251, lng: 13.3694, r: 700 },
    { name: 'Hamburg HB', lat: 53.553, lng: 10.0067, r: 600 },
    { name: 'Frankfurt HB', lat: 50.1069, lng: 8.6636, r: 600 },
    { name: 'Köln HB', lat: 50.943, lng: 6.9582, r: 500 },
    { name: 'Stuttgart HB', lat: 48.7841, lng: 9.1824, r: 500 },
    { name: 'Düsseldorf HB', lat: 51.2201, lng: 6.7941, r: 500 },
    { name: 'Leipzig HB', lat: 51.3454, lng: 12.3821, r: 500 },
    { name: 'Nürnberg HB', lat: 49.4456, lng: 11.0826, r: 500 },
    { name: 'Hannover HB', lat: 52.3769, lng: 9.7419, r: 500 },
    { name: 'Dresden HB', lat: 51.0407, lng: 13.7323, r: 500 },
    { name: 'Freiburg i.Br. HB', lat: 47.9969, lng: 7.8411, r: 400 },
    { name: 'Heidelberg HB', lat: 49.4035, lng: 8.6757, r: 400 },
    { name: 'Mannheim HB', lat: 49.4803, lng: 8.4697, r: 400 },
    { name: 'Karlsruhe HB', lat: 48.9936, lng: 8.4023, r: 400 },
    { name: 'Konstanz', lat: 47.6607, lng: 9.179, r: 400 },
    // Frankreich
    { name: 'Paris Gare du Nord', lat: 48.8809, lng: 2.3553, r: 600 },
    { name: 'Paris Gare de Lyon', lat: 48.8448, lng: 2.374, r: 500 },
    { name: 'Paris Gare St-Laz.', lat: 48.8762, lng: 2.325, r: 500 },
    { name: 'Lyon Part-Dieu', lat: 45.7603, lng: 4.8593, r: 500 },
    { name: 'Marseille St-Ch.', lat: 43.3027, lng: 5.3812, r: 500 },
    { name: 'Bordeaux St-Jean', lat: 44.8252, lng: -0.5567, r: 500 },
    { name: 'Toulouse Matabiau', lat: 43.6116, lng: 1.4537, r: 400 },
    { name: 'Strasbourg', lat: 48.5852, lng: 7.7352, r: 400 },
    { name: 'Mulhouse', lat: 47.7404, lng: 7.342, r: 400 },
    // Italien-N
    { name: 'Milano Centrale', lat: 45.4862, lng: 9.2046, r: 700 },
    { name: 'Torino Porta Nuova', lat: 45.0607, lng: 7.6778, r: 500 },
    { name: 'Venezia S. Lucia', lat: 45.4414, lng: 12.3211, r: 500 },
    { name: 'Bologna Centrale', lat: 44.5064, lng: 11.3428, r: 500 },
    { name: 'Genova Piazza Pr.', lat: 44.4113, lng: 8.927, r: 400 },
    // Italien-M/S
    { name: 'Roma Termini', lat: 41.9009, lng: 12.5007, r: 700 },
    { name: 'Firenze S.M.N.', lat: 43.7758, lng: 11.2478, r: 500 },
    { name: 'Napoli Centrale', lat: 40.8527, lng: 14.2718, r: 600 },
    { name: 'Palermo Centrale', lat: 38.1125, lng: 13.3439, r: 500 },
    // Spanien
    { name: 'Madrid Atocha', lat: 40.4067, lng: -3.6896, r: 700 },
    { name: 'Madrid Chamartín', lat: 40.4727, lng: -3.6823, r: 500 },
    { name: 'Barcelona Sants', lat: 41.3791, lng: 2.1403, r: 600 },
    { name: 'Barcelona Passeig Gr.', lat: 41.3949, lng: 2.1837, r: 400 },
    { name: 'Valencia Joaquín S.', lat: 39.4657, lng: -0.3773, r: 500 },
    { name: 'Sevilla Santa Justa', lat: 37.3783, lng: -5.9759, r: 500 },
    { name: 'Bilbao Abando', lat: 43.2567, lng: -2.9287, r: 400 },
    { name: 'Málaga M.-Picasso', lat: 36.7121, lng: -4.43, r: 400 },
    { name: 'Zaragoza Delicias', lat: 41.6559, lng: -0.909, r: 400 },
    // Portugal
    { name: 'Lisboa Oriente', lat: 38.768, lng: -9.0989, r: 500 },
    { name: 'Lisboa S. Apolónia', lat: 38.7134, lng: -9.1222, r: 400 },
    { name: 'Porto Campanhã', lat: 41.1484, lng: -8.5858, r: 500 },
    { name: 'Porto S. Bento', lat: 41.1458, lng: -8.6104, r: 400 },
    // Dänemark
    { name: 'København H', lat: 55.6729, lng: 12.5653, r: 600 },
    { name: 'Aarhus', lat: 56.1503, lng: 10.2044, r: 400 },
    { name: 'Odense', lat: 55.4013, lng: 10.3836, r: 400 },
    // Schweden
    { name: 'Stockholm C', lat: 59.3308, lng: 18.0579, r: 600 },
    { name: 'Göteborg C', lat: 57.7089, lng: 11.9736, r: 500 },
    { name: 'Malmö C', lat: 55.61, lng: 13.0017, r: 400 },
    { name: 'Uppsala C', lat: 59.8581, lng: 17.6452, r: 400 },
    { name: 'Linköping C', lat: 58.4162, lng: 15.6254, r: 400 },
    // Norwegen
    { name: 'Oslo S', lat: 59.9109, lng: 10.7525, r: 600 },
    { name: 'Bergen', lat: 60.391, lng: 5.3331, r: 500 },
    { name: 'Stavanger', lat: 58.9697, lng: 5.7326, r: 400 },
    { name: 'Trondheim S', lat: 63.4363, lng: 10.3981, r: 400 },
    // Finnland
    { name: 'Helsinki', lat: 60.1713, lng: 24.9413, r: 600 },
    { name: 'Tampere', lat: 61.4975, lng: 23.7726, r: 400 },
    { name: 'Turku', lat: 60.4548, lng: 22.2679, r: 400 },
    { name: 'Oulu', lat: 65.0125, lng: 25.4736, r: 400 },
    // England
    { name: "London King's Cross", lat: 51.5308, lng: -0.1238, r: 600 },
    { name: 'London Euston', lat: 51.5284, lng: -0.1331, r: 500 },
    { name: 'London Paddington', lat: 51.5154, lng: -0.1755, r: 500 },
    { name: 'London Victoria', lat: 51.4965, lng: -0.1441, r: 500 },
    { name: 'London Waterloo', lat: 51.5031, lng: -0.1128, r: 600 },
    { name: 'London St Pancras', lat: 51.5321, lng: -0.1231, r: 400 },
    { name: 'Manchester Piccadilly', lat: 53.4773, lng: -2.2309, r: 500 },
    { name: 'Birmingham New St', lat: 52.4775, lng: -1.8998, r: 500 },
    { name: 'Leeds', lat: 53.7953, lng: -1.5491, r: 400 },
    { name: 'Bristol Temple Meads', lat: 51.449, lng: -2.5813, r: 400 },
    { name: 'Liverpool Lime St', lat: 53.4075, lng: -2.9779, r: 400 },
    // Schottland
    { name: 'Edinburgh Waverley', lat: 55.9519, lng: -3.1896, r: 500 },
    { name: 'Glasgow Central', lat: 55.8582, lng: -4.2575, r: 500 },
    { name: 'Aberdeen', lat: 57.1437, lng: -2.0981, r: 400 },
    // Wales
    { name: 'Cardiff Central', lat: 51.476, lng: -3.1791, r: 400 },
    // Nordirland
    { name: 'Belfast Central', lat: 54.5973, lng: -5.9301, r: 400 },
    // Irland
    { name: 'Dublin Heuston', lat: 53.3464, lng: -6.2939, r: 500 },
    { name: 'Dublin Connolly', lat: 53.3523, lng: -6.2448, r: 400 },
    { name: 'Cork Kent', lat: 51.9016, lng: -8.4638, r: 400 },
    // Island (kein Bahnnetz — Busbahnhof Reykjavik)
    { name: 'Reykjavik BSÍ', lat: 64.1413, lng: -21.9502, r: 400 },
    // Niederlande
    { name: 'Amsterdam Centraal', lat: 52.3791, lng: 4.9003, r: 700 },
    { name: 'Rotterdam Centraal', lat: 51.9249, lng: 4.469, r: 600 },
    { name: 'Den Haag Centraal', lat: 52.0799, lng: 4.3248, r: 500 },
    { name: 'Utrecht Centraal', lat: 52.0892, lng: 5.1101, r: 600 },
    { name: 'Eindhoven Centraal', lat: 51.4432, lng: 5.4796, r: 500 },
    { name: 'Amsterdam Schiphol', lat: 52.3086, lng: 4.7639, r: 800 },
    // Belgien
    { name: 'Bruxelles-Midi/Zuid', lat: 50.8357, lng: 4.3356, r: 700 },
    { name: 'Bruxelles-Central', lat: 50.8455, lng: 4.3571, r: 500 },
    { name: 'Bruxelles-Nord/Brussel-Noord', lat: 50.8594, lng: 4.3605, r: 500 },
    { name: 'Antwerpen Centraal', lat: 51.2172, lng: 4.4213, r: 600 },
    { name: 'Gent-Sint-Pieters', lat: 51.0359, lng: 3.7101, r: 500 },
    { name: 'Liège-Guillemins', lat: 50.6244, lng: 5.5666, r: 500 },
    { name: 'Brussels Airport', lat: 50.901, lng: 4.4844, r: 700 },
    // Luxemburg
    { name: 'Luxembourg Gare', lat: 49.5996, lng: 6.1357, r: 500 },
    { name: 'Luxembourg Aéroport', lat: 49.6234, lng: 6.2044, r: 600 },
    // Malta (kein Bahnnetz — Busbahnhof + Valletta Fährhafen)
    { name: 'Valletta Bus Terminal', lat: 35.899, lng: 14.509, r: 400 },
    { name: 'Malta International Airport', lat: 35.8574, lng: 14.4775, r: 600 },
    // Zypern (kein Bahnnetz — Busbahnhof Nikosia + Flughafen)
    { name: 'Nicosia Central Bus Station', lat: 35.1676, lng: 33.3736, r: 400 },
    { name: 'Larnaca Airport', lat: 34.8752, lng: 33.6249, r: 600 },
    { name: 'Paphos Airport', lat: 34.718, lng: 32.4857, r: 600 },
    { name: 'Limassol Port', lat: 34.668, lng: 33.0472, r: 500 },
  ];

  // Baue eine Overpass-Abfrage für jeden Bahnhof: alle Toiletten in r Metern
  for (const station of ONLY.length ? [] : MAJOR_STATIONS) {
    const r = station.r;
    const query = `
[out:json][timeout:30];
(
  node["amenity"="toilets"](around:${r},${station.lat},${station.lng});
  way["amenity"="toilets"](around:${r},${station.lat},${station.lng});
);
out center body;`.trim();
    try {
      const bbox: [number, number, number, number] = [
        station.lat - 0.01,
        station.lng - 0.01,
        station.lat + 0.01,
        station.lng + 0.01,
      ];
      const items = await queryOverpass(bbox, query, true);
      if (items.length > 0) {
        process.stdout.write(`  🚉 ${station.name}: ${items.length} Toiletten`);
        for (const item of items) {
          await upsertToilet(item, systemUserId, counters, 'transport');
        }
        process.stdout.write('\n');
      }
      await sleep(1500);
    } catch (err) {
      console.error(`  ❌ ${station.name}:`, (err as Error).message);
      await sleep(3000);
    }
  }

  // ── Phase 8: Coop/Migros CH (Schweizer Grossverteiler) ──────────────────────
  // Schweiz-spezifisch → bei --only übersprungen.
  if (!ONLY.length) {
    console.log('\n── Phase 8: Coop/Migros CH ───────────────────────────');
    const CH_BBOX: [number, number, number, number] = [45.8, 5.9, 47.8, 10.5];

    // 8a: Toiletten die explizit Coop/Migros als Operator nennen.
    // Reine Statement-Liste (wie EUROKEY_FILTER) — queryOverpass kapselt sie selbst
    // in [out:json];(…);out center body;. KEINE eigenen Klammern / kein out hier,
    // sonst entsteht doppeltes "out" → Overpass-400.
    const COOP_MIGROS_OP_FILTER =
      'node["amenity"="toilets"]["operator"~"^(Coop|Migros)",i]({BBOX});' +
      'way["amenity"="toilets"]["operator"~"^(Coop|Migros)",i]({BBOX});';
    try {
      const cmOpItems = await queryOverpass(CH_BBOX, COOP_MIGROS_OP_FILTER);
      console.log(`  8a Operator-Tag: ${cmOpItems.length} Treffer`);
      for (const item of cmOpItems) {
        await upsertToilet(item, systemUserId, counters, 'mall');
      }
      await sleep(2000);
    } catch (err) {
      console.error('  ❌ Phase 8a:', (err as Error).message);
      await sleep(3000);
    }

    // 8b: Toiletten in/um Coop/Migros-Läden (Bereichsabfrage, 150 m)
    const COOP_MIGROS_AREA_QUERY = `
[out:json][timeout:180];
(
  node["shop"~"supermarket|department_store|mall"]["brand"~"^(Coop|Migros)",i]({BBOX});
  way["shop"~"supermarket|department_store|mall"]["brand"~"^(Coop|Migros)",i]({BBOX});
  node["shop"~"supermarket|department_store|mall"]["operator"~"Coop|Migros",i]({BBOX});
  way["shop"~"supermarket|department_store|mall"]["operator"~"Coop|Migros",i]({BBOX});
  node["shop"~"supermarket|department_store|mall"]["name"~"^(Coop|Migros)",i]({BBOX});
  way["shop"~"supermarket|department_store|mall"]["name"~"^(Coop|Migros)",i]({BBOX});
)->.shops;
(
  node["amenity"="toilets"](around.shops:150);
  way["amenity"="toilets"](around.shops:150);
);
out center body;
`;
    try {
      const cmAreaItems = await queryOverpass(CH_BBOX, COOP_MIGROS_AREA_QUERY, true);
      console.log(`  8b Bereichsabfrage 150m: ${cmAreaItems.length} Treffer`);
      for (const item of cmAreaItems) {
        await upsertToilet(item, systemUserId, counters, 'mall');
      }
      await sleep(2000);
    } catch (err) {
      console.error('  ❌ Phase 8b:', (err as Error).message);
      await sleep(3000);
    }

    // 8c: Eurokey-Toiletten in Coop/Migros-Nähe (Schlüsselkiosk-Konzept)
    const COOP_MIGROS_EUROKEY_QUERY = `
[out:json][timeout:120];
(
  node["shop"~"supermarket|department_store|mall"]["brand"~"^(Coop|Migros)",i]({BBOX});
  way["shop"~"supermarket|department_store|mall"]["brand"~"^(Coop|Migros)",i]({BBOX});
  node["shop"~"supermarket|department_store|mall"]["name"~"^(Coop|Migros)",i]({BBOX});
  way["shop"~"supermarket|department_store|mall"]["name"~"^(Coop|Migros)",i]({BBOX});
)->.shops;
(
  node["amenity"="toilets"]["centralkey"="eurokey"](around.shops:200);
  way["amenity"="toilets"]["centralkey"="eurokey"](around.shops:200);
  node["amenity"="toilets"]["access"="key"](around.shops:200);
  way["amenity"="toilets"]["access"="key"](around.shops:200);
);
out center body;
`;
    try {
      const cmEurokeyItems = await queryOverpass(CH_BBOX, COOP_MIGROS_EUROKEY_QUERY, true);
      console.log(`  8c Eurokey-Nähe: ${cmEurokeyItems.length} Treffer`);
      for (const item of cmEurokeyItems) {
        await upsertToilet(item, systemUserId, counters, 'mall');
      }
      await sleep(2000);
    } catch (err) {
      console.error('  ❌ Phase 8c:', (err as Error).message);
      await sleep(3000);
    }
  } // Ende Phase 8 (--only-Gate)

  console.log(`\n✅ OSM-Import abgeschlossen`);
  console.log(`   Importiert/aktualisiert: ${counters.imported}`);
  console.log(`   Übersprungen (privat):   ${counters.skipped}`);
  console.log(`   Fehlgeschlagen:          ${counters.failed}`);

  // Abschluss-Statistik pro Kategorie
  if (!DRY_RUN) {
    const stats = await prisma.toilet.groupBy({
      by: ['category'],
      where: { status: 'active', source: 'osm' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    console.log('\n📊 Kategorie-Verteilung (OSM):');
    stats.forEach((s) => console.log(`   ${s.category}: ${s._count.id}`));

    const eurokey = await prisma.toilet.count({
      where: {
        status: 'active',
        source: 'osm',
        accessibility: { path: ['euro_key'], equals: true },
      },
    });
    const wheelchair = await prisma.toilet.count({
      where: {
        status: 'active',
        source: 'osm',
        accessibility: { path: ['wheelchair'], equals: true },
      },
    });
    console.log(`\n♿ Rollstuhlgerecht: ${wheelchair}`);
    console.log(`🔑 Eurokey: ${eurokey}`);
  }

  // ── Suchindex aktualisieren ──────────────────────────────────────────────
  // Der Bulk-Import schreibt nicht in Meili (nur die API tut das pro Toilette).
  // Ohne diesen Schritt bliebe /search veraltet/leer.
  if (!DRY_RUN) {
    console.log('\n── Meilisearch-Reindex ──────────────────────────────');
    try {
      const n = await reindexMeili(prisma);
      console.log(`  ✓ ${n} Toiletten in Meili eingereiht`);
    } catch (e) {
      console.error('  ❌ Meili-Reindex fehlgeschlagen:', (e as Error).message);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
