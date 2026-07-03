/**
 * Integrationstest: AdminDataService gegen echte Postgres-DB
 * Direkte Instanziierung — kein NestJS DI-Container nötig.
 * Voraussetzungen: DATABASE_URL in der Umgebung, Docker Compose läuft.
 */
import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdminDataService } from './admin-data.service';

const prisma = new PrismaClient();
const adminData = new AdminDataService(prisma as never);

let userId: string;
let toiletId: string;

beforeAll(async () => {
  await prisma.$connect();

  const user = await prisma.user.upsert({
    where: { handle: '__integration_data_owner__' },
    update: {},
    create: { handle: '__integration_data_owner__', email: '__integration_data__@klopilot.ch' },
  });
  userId = user.id;

  const toilet = await prisma.toilet.create({
    data: {
      name: '__Integration-Data-Toilet__',
      category: 'public',
      longitude: 7.45,
      latitude: 46.95,
      createdById: userId,
    },
  });
  toiletId = toilet.id;
}, 20_000);

afterAll(async () => {
  await prisma.toilet.delete({ where: { id: toiletId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('AdminDataService', () => {
  it('liefert Kennzahlen inkl. der Test-Toilette', async () => {
    const stats = await adminData.stats();
    expect(stats.totalToilets).toBeGreaterThanOrEqual(1);
    expect(stats.toiletsByStatus.some((r) => r.status === 'active')).toBe(true);
    expect(stats.toiletsByCategory.some((r) => r.category === 'public')).toBe(true);
  });

  it('exportiert Toiletten als CSV inkl. Header und Test-Zeile', async () => {
    const csv = await adminData.exportToiletsCsv();
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'id,name,category,address,longitude,latitude,visibility,status,verified,source,feeChf,createdAt',
    );
    expect(csv).toContain('__Integration-Data-Toilet__');
    expect(csv).toContain(toiletId);
  });
});
