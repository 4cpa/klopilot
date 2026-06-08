/**
 * Entfernt bereits importierte OSM-Toiletten, die auf ausgeschlossenem Gebiet
 * (Belarus / Russland, s. ../src/common/utils/osm-region.ts) liegen.
 *
 * Hintergrund: Der Seed (seed-osm.ts) überspringt BY/RU-Spillover an den
 * Bbox-Rändern beim Import — aber bereits in der DB liegende Altdaten werden
 * durch einen erneuten Seed-Lauf NICHT entfernt (upsert legt nur an/aktualisiert).
 * Dieses Skript räumt sie nachträglich auf und baut danach den Suchindex neu.
 *
 * Sicherheit:
 *   - Standard ist DRY-RUN (zeigt nur an, löscht nicht). Erst --apply löscht.
 *   - Es werden ausschliesslich Quell-OSM-Toiletten (source='osm') gelöscht;
 *     manuelle Nutzereinträge bleiben unangetastet und werden nur gemeldet.
 *
 * Aufruf (im laufenden API-Container, via sudo docker exec klopilot-api):
 *   node apps/api/dist/scripts/prune-osm-excluded.js            # Dry-Run
 *   node apps/api/dist/scripts/prune-osm-excluded.js --apply    # tatsächlich löschen
 */
import { PrismaClient } from '@prisma/client';
import { isExcludedLocation } from '../src/common/utils/osm-region';
import { reindexMeili } from './reindex-meili';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const BATCH = 10_000;

async function main() {
  console.log(`🧹 Prune BY/RU-Toiletten — Modus: ${APPLY ? 'APPLY (löschen)' : 'DRY-RUN'}`);

  const osmHits: string[] = [];
  let nonOsmHits = 0;
  let scanned = 0;
  let skip = 0;

  for (;;) {
    const rows = await prisma.toilet.findMany({
      select: { id: true, latitude: true, longitude: true, source: true, name: true },
      orderBy: { id: 'asc' },
      take: BATCH,
      skip,
    });
    if (rows.length === 0) break;
    for (const t of rows) {
      scanned++;
      const lat = Number(t.latitude);
      const lng = Number(t.longitude);
      if (!isExcludedLocation(lat, lng)) continue;
      if (t.source === 'osm') {
        osmHits.push(t.id);
      } else {
        nonOsmHits++;
        console.warn(
          `  ⚠ Nicht-OSM-Eintrag auf BY/RU-Gebiet (bleibt): ${t.id} "${t.name}" @ ${lat},${lng}`,
        );
      }
    }
    skip += rows.length;
  }

  console.log(`\n   Geprüft:               ${scanned}`);
  console.log(`   BY/RU-Treffer (OSM):   ${osmHits.length}`);
  console.log(`   BY/RU-Treffer (manuell, nicht gelöscht): ${nonOsmHits}`);

  if (!APPLY) {
    console.log('\n(DRY-RUN — nichts gelöscht. Mit --apply ausführen.)');
    return;
  }
  if (osmHits.length === 0) {
    console.log('\n✅ Nichts zu löschen.');
    return;
  }

  let deleted = 0;
  for (let i = 0; i < osmHits.length; i += BATCH) {
    const chunk = osmHits.slice(i, i + BATCH);
    const res = await prisma.toilet.deleteMany({ where: { id: { in: chunk } } });
    deleted += res.count;
  }
  console.log(`\n🗑️  ${deleted} OSM-Toiletten gelöscht.`);

  console.log('\n── Meilisearch-Reindex ──────────────────────────────');
  const n = await reindexMeili(prisma);
  console.log(`  ✓ ${n} Toiletten in Meili eingereiht`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
