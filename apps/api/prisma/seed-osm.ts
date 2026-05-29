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

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// ── Bounding-Boxes ────────────────────────────────────────────────────────────
// Format: [south, west, north, east]
const REGIONS: Array<{ name: string; bbox: [number, number, number, number] }> = [
  { name: 'Schweiz', bbox: [45.8, 5.9, 47.8, 10.5] },
  { name: 'Österreich', bbox: [46.3, 10.0, 48.0, 17.2] },
  { name: 'Deutschland-SW', bbox: [47.5, 7.5, 48.5, 9.5] },
  { name: 'Frankreich-E', bbox: [46.0, 6.0, 48.8, 8.2] },
  { name: 'Italien-N', bbox: [43.5, 6.6, 46.8, 14.0] },
];

// ── Transport-Schlüsselwörter (6 Sprachen) ────────────────────────────────────
const TRANSPORT_KEYWORDS = [
  // Deutsch
  'bahnhof',
  'hauptbahnhof',
  'hbf',
  'flughafen',
  'busbahnhof',
  'zentralbahnhof',
  // Französisch
  'gare',
  'aéroport',
  'gare centrale',
  'gare routière',
  // Italienisch
  'stazione',
  'aeroporto',
  'stazione centrale',
  // Englisch
  'station',
  'airport',
  'bus terminal',
  'railway',
  'transit',
  // Weitere
  'bahnsteig',
  'perron',
  'terminal',
];

// ── OSM-Tag → unsere Kategorie ────────────────────────────────────────────────
function mapCategory(
  tags: Record<string, string>,
): 'public' | 'nette_toilette' | 'gastronomy' | 'transport' | 'mall' | 'event' {
  const name = (tags['name'] ?? tags['description'] ?? '').toLowerCase();
  const loc = (tags['location'] ?? '').toLowerCase();
  const op = (tags['operator:type'] ?? tags['operator'] ?? '').toLowerCase();
  const acc = (tags['access'] ?? '').toLowerCase();

  // Transport: Tags + Name-basiert (alle Sprachen)
  const isTransport =
    !!tags['public_transport'] ||
    !!tags['railway'] ||
    TRANSPORT_KEYWORDS.some((kw) => loc.includes(kw) || name.includes(kw));
  if (isTransport) return 'transport';

  // Mall / Einkaufszentrum
  if (
    loc.includes('mall') ||
    loc.includes('shopping') ||
    !!tags['shop'] ||
    name.includes('einkaufszentrum') ||
    name.includes('center') ||
    name.includes('centre commercial') ||
    name.includes('centro commerciale')
  )
    return 'mall';

  // Nette Toilette Projekt (vor Gastronomie prüfen!)
  if (
    tags['nette_toilette'] === 'yes' ||
    tags['toilets:scheme'] === 'nette_toilette' ||
    op.includes('nette toilette') ||
    name.includes('nette toilette')
  )
    return 'nette_toilette';

  // Gastronomie: Restaurants/Cafés die ihre Toilette öffnen
  if (
    acc === 'customers' ||
    loc.includes('restaurant') ||
    loc.includes('cafe') ||
    loc.includes('bar') ||
    tags['amenity'] === 'restaurant' ||
    tags['amenity'] === 'cafe' ||
    tags['amenity'] === 'bar'
  )
    return 'gastronomy';

  // Öffentlich (Gemeinde/Stadt)
  if (
    op.includes('gemeinde') ||
    op.includes('stadt') ||
    op.includes('canton') ||
    op.includes('municipality') ||
    op.includes('mairie') ||
    op.includes('commune') ||
    op.includes('ville') ||
    op.includes('città') ||
    op.includes('comune')
  )
    return 'public';

  return 'public';
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

// ── Gebühr aus OSM-Tags ───────────────────────────────────────────────────────
function mapFee(tags: Record<string, string>): number | undefined {
  if (tags['fee'] === 'no') return 0;
  if (tags['fee'] === 'yes' || tags['fee:conditional']) {
    const amount = tags['charge'] ?? tags['fee:amount'];
    if (amount) {
      const n = parseFloat(amount.replace(/[^0-9.]/g, ''));
      if (!isNaN(n)) return n;
    }
    return 0.5; // Fallback: 50 Rappen
  }
  return undefined; // unbekannt
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
  counters: { imported: number; skipped: number },
  forceCat?: 'public' | 'nette_toilette' | 'gastronomy' | 'transport' | 'mall' | 'event',
) {
  const tags = item.tags;

  // Privat / gesperrt → überspringen
  if (tags['access'] === 'private' || tags['access'] === 'no') {
    counters.skipped++;
    return;
  }

  const city = tags['addr:city'] ?? tags['addr:municipality'] ?? '';
  const name =
    tags['name'] ??
    tags['description'] ??
    (city ? `Öffentliche Toilette ${city}` : 'Öffentliche Toilette');

  const category = forceCat ?? mapCategory(tags);
  const address = buildAddress(tags);
  const feeChf = mapFee(tags);
  const accessibility = mapAccessibility(tags);

  if (DRY_RUN) {
    const eurokey = accessibility?.euro_key ? ' [EUROKEY]' : '';
    const wc = accessibility?.wheelchair ? ' [WC]' : '';
    console.log(
      `    [DRY] ${item.osmId}: ${name} (${category})${eurokey}${wc} @ ${item.lat},${item.lng}`,
    );
    counters.imported++;
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

  counters.imported++;
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

  const counters = { imported: 0, skipped: 0 };

  // ── Phase 1: Standard-Import (alle amenity=toilets) ──────────────────────────
  console.log('\n── Phase 1: Standard-Toiletten ──────────────────────');
  for (const region of REGIONS) {
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

  // ── Phase 2: Eurokey-Toiletten (CH + AT + DE-SW) ──────────────────────────────
  console.log('\n── Phase 2: Eurokey-Toiletten ───────────────────────');
  const EUROKEY_REGIONS = [
    { name: 'CH-Eurokey', bbox: [45.8, 5.9, 47.8, 10.5] as [number, number, number, number] },
    { name: 'AT-Eurokey', bbox: [46.3, 10.0, 48.0, 17.2] as [number, number, number, number] },
    { name: 'DE-SW-Eurokey', bbox: [47.5, 7.5, 48.5, 9.5] as [number, number, number, number] },
    { name: 'FR-E-Eurokey', bbox: [46.0, 6.0, 48.8, 8.2] as [number, number, number, number] },
    { name: 'IT-N-Eurokey', bbox: [43.5, 6.6, 46.8, 14.0] as [number, number, number, number] },
  ];
  const EUROKEY_FILTER =
    'node["amenity"="toilets"]["centralkey"="eurokey"]({BBOX});' +
    'way["amenity"="toilets"]["centralkey"="eurokey"]({BBOX});' +
    'node["amenity"="toilets"]["key:eurokey"="yes"]({BBOX});';

  for (const region of EUROKEY_REGIONS) {
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

  for (const region of [
    { name: 'CH-NetteToi', bbox: [45.8, 5.9, 47.8, 10.5] as [number, number, number, number] },
    { name: 'DE-NetteToi', bbox: [47.5, 7.5, 48.5, 9.5] as [number, number, number, number] },
    { name: 'AT-NetteToi', bbox: [46.3, 10.0, 48.0, 17.2] as [number, number, number, number] },
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

  for (const region of REGIONS) {
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
  console.log('\n── Phase 5: Stationen/Airports (Bereichsabfrage) ────');
  const STATION_AREA_QUERY = `
[out:json][timeout:90];
(
  node["railway"="station"]({BBOX});
  way["railway"="station"]({BBOX});
  node["aeroway"="terminal"]({BBOX});
  way["aeroway"="terminal"]({BBOX});
  node["public_transport"="station"]({BBOX});
  way["public_transport"="station"]({BBOX});
)->.transport;
node["amenity"="toilets"](around.transport:250)({BBOX});
out center body;`.trim();

  for (const region of REGIONS) {
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
node["amenity"="toilets"](around.malls:200)({BBOX});
out center body;`.trim();

  for (const region of REGIONS) {
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

  console.log(`\n✅ OSM-Import abgeschlossen`);
  console.log(`   Importiert/aktualisiert: ${counters.imported}`);
  console.log(`   Übersprungen (privat):   ${counters.skipped}`);

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
