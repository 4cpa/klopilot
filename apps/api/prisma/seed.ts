/**
 * Seed: Basis-Nutzer für lokale Entwicklung anlegen.
 * Toiletten-Daten kommen aus dem OSM-Import (pnpm db:seed-osm).
 *
 * Aufruf: pnpm --filter api db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed startet...');

  // Admin-User für lokale Entwicklung
  const adminUser = await prisma.user.upsert({
    where: { handle: 'admin' },
    update: {},
    create: {
      handle: 'admin',
      email: 'admin@klopilot.ch',
      role: 'admin',
      locale: 'de',
    },
  });

  // Demo-User
  const demoUser = await prisma.user.upsert({
    where: { handle: 'demo' },
    update: {},
    create: {
      handle: 'demo',
      email: 'demo@klopilot.ch',
      role: 'user',
      locale: 'de',
    },
  });

  // System-User für OSM-Importe
  await prisma.user.upsert({
    where: { handle: 'osm-import' },
    update: {},
    create: {
      handle: 'osm-import',
      role: 'anon',
    },
  });

  console.log(`  ✓ Nutzer angelegt: ${adminUser.handle}, ${demoUser.handle}, osm-import`);
  console.log('');
  console.log('  ℹ️  Toiletten-Daten via OSM importieren:');
  console.log('     pnpm --filter api db:seed-osm');
  console.log('');
  console.log('🌸 Seed abgeschlossen.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
