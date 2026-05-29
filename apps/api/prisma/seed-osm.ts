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

// ── OSM-Tag → unsere Kategorie ────────────────────────────────────────────────
function mapCategory(
  tags: Record<string, string>,
): 'public' | 'nette_toilette' | 'gastronomy' | 'transport' | 'mall' | 'event' {
  const loc = (tags['location'] ?? '').toLowerCase();
  const op = (tags['operator:type'] ?? tags['operator'] ?? '').toLowerCase();
  const acc = (tags['access'] ?? '').toLowerCase();

  if (
    loc.includes('station') ||
    loc.includes('airport') ||
    loc.includes('railway') ||
    tags['public_transport'] ||
    tags['railway']
  )
    return 'transport';
  if (loc.includes('mall') || loc.includes('shop') || tags['shop']) return 'mall';
  if (
    acc === 'customers' ||
    loc.includes('restaurant') ||
    loc.includes('cafe') ||
    tags['amenity'] === 'restaurant' ||
    tags['amenity'] === 'cafe'
  )
    return 'gastronomy';
  if (
    op.includes('gemeinde') ||
    op.includes('stadt') ||
    op.includes('canton') ||
    op.includes('municipality') ||
    op.includes('mairie') ||
    op.includes('commune')
  )
    return 'public';
  if (tags['nette_toilette'] === 'yes' || tags['toilets:scheme'] === 'nette_toilette')
    return 'nette_toilette';
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
function mapAccessibility(tags: Record<string, string>) {
  const wheelchair = tags['toilets:wheelchair'] ?? tags['wheelchair'];
  return wheelchair === 'yes' || wheelchair === 'designated' ? { wheelchair: true } : undefined;
}

// ── Overpass-Abfrage ──────────────────────────────────────────────────────────
async function queryOverpass(
  bbox: [number, number, number, number],
): Promise<Array<{ osmId: string; lat: number; lng: number; tags: Record<string, string> }>> {
  const [s, w, n, e] = bbox;
  const query = `[out:json][timeout:60];(node[amenity=toilets](${s},${w},${n},${e});way[amenity=toilets](${s},${w},${n},${e}););out center body;`;

  // Mehrere Overpass-Instanzen als Fallback
  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  const HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'klopilot/1.0 seed-osm-import (admin@4cpa.ch)',
  };

  console.log(`  → Overpass-Anfrage für bbox ${bbox.join(',')} …`);
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

// ── Hilfsfunktion: Schlafe ────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Hauptlogik ────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚽 klopilot OSM-Import gestartet');
  if (DRY_RUN) console.log('  (DRY RUN — keine Datenbankänderungen)');

  // System-User für OSM-Importe (wird angelegt falls nicht vorhanden)
  let systemUser = await prisma.user.findFirst({ where: { handle: 'osm-import' } });
  if (!systemUser && !DRY_RUN) {
    systemUser = await prisma.user.create({
      data: { handle: 'osm-import', role: 'anon' },
    });
    console.log('  ✓ System-User "osm-import" angelegt');
  }
  const systemUserId = systemUser?.id ?? '00000000-0000-0000-0000-000000000000';

  // Beispieldaten löschen (source = 'user' und kein osmId und erstellt von system/test-usern)
  if (!DRY_RUN) {
    const deleted = await prisma.toilet.deleteMany({
      where: { source: 'user', osmId: null, createdBy: { handle: { in: ['seed', 'osm-import'] } } },
    });
    if (deleted.count > 0) console.log(`  🗑️  ${deleted.count} Beispiel-Toiletten entfernt`);
  }

  let totalImported = 0;
  let totalSkipped = 0;

  for (const region of REGIONS) {
    console.log(`\n📍 Region: ${region.name}`);
    try {
      const items = await queryOverpass(region.bbox);
      console.log(`  ${items.length} Toiletten gefunden`);

      for (const item of items) {
        const tags = item.tags;

        // Toiletten ohne Namen werden nach Kategorie + Stadt benannt
        const city = tags['addr:city'] ?? tags['addr:municipality'] ?? '';
        const name =
          tags['name'] ??
          tags['description'] ??
          (city ? `Öffentliche Toilette ${city}` : 'Öffentliche Toilette');

        // Privat / nur für Kunden → überspringen (keine Kunden-/Privat-Toiletten importieren)
        if (tags['access'] === 'private' || tags['access'] === 'no') {
          totalSkipped++;
          continue;
        }

        const category = mapCategory(tags);
        const address = buildAddress(tags);
        const feeChf = mapFee(tags);
        const accessibility = mapAccessibility(tags);

        if (DRY_RUN) {
          console.log(`    [DRY] ${item.osmId}: ${name} (${category}) @ ${item.lat},${item.lng}`);
          totalImported++;
          continue;
        }

        // Upsert via osmId — verhindert Duplikate bei Mehrfach-Import
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
            // Nur nicht-nutzerseitig veränderte Felder aktualisieren
            name: name.slice(0, 120),
            address,
            feeChf: feeChf !== undefined ? feeChf : undefined,
            accessibility: accessibility ?? undefined,
          },
        });

        // PostGIS geom setzen
        await prisma.$executeRaw`
          UPDATE toilets
          SET    geom = ST_SetSRID(ST_MakePoint(${item.lng}, ${item.lat}), 4326)::geography
          WHERE  id   = ${toilet.id}::uuid
            AND  geom IS NULL
        `;

        totalImported++;
      }

      // Höfliche Pause zwischen Regionen (Overpass Rate-Limit)
      await sleep(2000);
    } catch (err) {
      console.error(`  ❌ Fehler bei Region ${region.name}:`, (err as Error).message);
    }
  }

  console.log(`\n✅ OSM-Import abgeschlossen`);
  console.log(`   Importiert: ${totalImported}`);
  console.log(`   Übersprungen: ${totalSkipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
