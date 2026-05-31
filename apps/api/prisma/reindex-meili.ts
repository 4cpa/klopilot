/**
 * Meilisearch-Reindex: alle aktiven, öffentlichen Toiletten aus Postgres in den
 * Meili-Index 'toilets' schreiben.
 *
 * Hintergrund: Bulk-Importe (seed-osm) und seed.ts schreiben NICHT in Meili —
 * nur die API beim Anlegen/Ändern einzelner Toiletten. Ohne diesen Reindex
 * veraltet der Suchindex (neue WCs fehlen, gelöschte bleiben) bzw. bleibt nach
 * einem Bulk-Import leer → /search liefert nichts.
 *
 * Aufruf:   pnpm --filter api db:reindex
 * Zusätzlich am Ende von seed-osm automatisch aufgerufen.
 */
import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Meilisearch } = require('meilisearch');

const INDEX = 'toilets';
const BATCH = 10_000;

/**
 * Indexiert alle aktiven, nicht-privaten Toiletten in Meili (idempotent).
 * @returns Anzahl der eingereihten Dokumente.
 */
export async function reindexMeili(prisma: PrismaClient): Promise<number> {
  const host = process.env.MEILI_HOST ?? 'http://localhost:7710';
  const apiKey = process.env.MEILI_KEY ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = new Meilisearch({ host, apiKey });

  // Index + Settings sicherstellen (idempotent) — gleiche Settings wie der
  // MeilisearchService beim Boot.
  await client.createIndex(INDEX, { primaryKey: 'id' }).catch(() => {
    /* existiert bereits */
  });
  const idx = client.index(INDEX);
  await idx.updateSearchableAttributes(['name', 'address']);
  await idx.updateFilterableAttributes(['category']);

  // Voller Resync: zuerst leeren, damit gelöschte/ausgeschlossene Toiletten
  // (z. B. Nicht-EU-Spillover) auch aus dem Suchindex verschwinden, nicht nur
  // aus Postgres. Meili verarbeitet die Tasks der Reihe nach (leeren → neu).
  await idx.deleteAllDocuments();

  let skip = 0;
  let total = 0;
  for (;;) {
    const rows = await prisma.toilet.findMany({
      where: { status: 'active', visibility: { not: 'private' } },
      select: {
        id: true,
        name: true,
        address: true,
        category: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { id: 'asc' },
      take: BATCH,
      skip,
    });
    if (rows.length === 0) break;
    const docs = rows.map((t) => ({
      id: t.id,
      name: t.name ?? '',
      address: t.address ?? '',
      category: t.category,
      _geo: { lat: Number(t.latitude), lng: Number(t.longitude) },
    }));
    await idx.addDocuments(docs);
    total += docs.length;
    skip += rows.length;
    console.log(`  ↪ Meili: ${total} Dokumente eingereiht`);
  }
  return total;
}

// Standalone-Aufruf (pnpm --filter api db:reindex)
if (require.main === module) {
  const prisma = new PrismaClient();
  reindexMeili(prisma)
    .then((n) => console.log(`✅ Meili-Reindex abgeschlossen: ${n} Toiletten eingereiht`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
