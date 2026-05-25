/**
 * Integrationstest: RatingsService gegen echte Postgres-DB
 * Direkte Instanziierung — kein NestJS DI-Container nötig.
 * Voraussetzungen: DATABASE_URL in der Umgebung, Docker Compose läuft.
 */
import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RatingsService } from './ratings.service';

// PrismaService ist ein PrismaClient-Subclass — direkt nutzbar
const prisma = new PrismaClient();
const ratingsService = new RatingsService(
  prisma as any,
  { containsProfanity: () => false } as any,
  { notifyToiletOwnerOnRating: () => Promise.resolve() } as any,
);

let toiletId: string;
let userId: string;

beforeAll(async () => {
  await prisma.$connect();

  const user = await prisma.user.upsert({
    where: { handle: '__integration_rater__' },
    update: {},
    create: { handle: '__integration_rater__', email: '__integration__@klopilot.ch', role: 'user' },
  });
  userId = user.id;

  const toilet = await prisma.toilet.create({
    data: {
      name: '__Integration-Toilet__',
      category: 'public',
      longitude: 7.4474,
      latitude: 46.9481,
      createdById: userId,
    },
  });
  toiletId = toilet.id;
  await prisma.$executeRaw`
    UPDATE toilets SET geom = ST_SetSRID(ST_MakePoint(7.4474, 46.9481), 4326)::geography
    WHERE id = ${toiletId}::uuid
  `;
}, 20_000);

afterAll(async () => {
  await prisma.rating.deleteMany({ where: { toiletId } });
  await prisma.toilet.delete({ where: { id: toiletId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('RatingsService.upsert', () => {
  it('erstellt eine neue Bewertung und gibt Score zurück', async () => {
    const { rating, score } = await ratingsService.upsert(toiletId, userId, {
      scores: {
        cleanliness: { flowers: 5, flies: 0 },
        hygiene: { flowers: 4, flies: 0 },
      },
      language: 'de',
    });
    expect(rating.toiletId).toBe(toiletId);
    expect(rating.flowersCleanliness).toBe(5);
    expect(score.net).toBeGreaterThan(0);
    expect(score.count).toBe(1);
  });

  it('überschreibt die bestehende Bewertung (Upsert)', async () => {
    const { rating } = await ratingsService.upsert(toiletId, userId, {
      scores: { cleanliness: { flowers: 2, flies: 0 } },
      language: 'de',
    });
    expect(rating.flowersCleanliness).toBe(2);
    const count = await prisma.rating.count({ where: { toiletId, userId } });
    expect(count).toBe(1);
  });

  it('wirft NotFoundException für unbekannte Toilette', async () => {
    await expect(
      ratingsService.upsert('00000000-0000-0000-0000-000000000000', userId, {
        scores: {},
        language: 'de',
      }),
    ).rejects.toThrow('Toilette nicht gefunden');
  });
});

describe('RatingsService.findMine', () => {
  it('gibt die eigene Bewertung zurück', async () => {
    const rating = await ratingsService.findMine(toiletId, userId);
    expect(rating.userId).toBe(userId);
    expect(rating.toiletId).toBe(toiletId);
  });
});

describe('RatingsService.remove', () => {
  it('löscht die eigene Bewertung', async () => {
    await ratingsService.remove(toiletId, userId);
    const count = await prisma.rating.count({ where: { toiletId, userId } });
    expect(count).toBe(0);
  });

  it('wirft NotFoundException wenn keine Bewertung vorhanden', async () => {
    await expect(ratingsService.remove(toiletId, userId)).rejects.toThrow(
      'Keine Bewertung vorhanden',
    );
  });
});
