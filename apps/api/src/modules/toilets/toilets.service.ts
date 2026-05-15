import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Rating, Visibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { z } from 'zod';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const ToiletInputSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(['public', 'nette_toilette', 'gastronomy', 'transport', 'mall', 'event', 'private']),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  address: z.string().max(300).optional(),
  feeChf: z.number().min(0).optional(),
  openingHours: z.record(z.unknown()).optional(),
  accessibility: z.record(z.unknown()).optional(),
  visibility: z.enum(['public', 'nette_toilette', 'private']).default('public'),
});

export const ToiletUpdateSchema = ToiletInputSchema.partial();

export type ToiletInput = z.infer<typeof ToiletInputSchema>;
export type ToiletUpdate = z.infer<typeof ToiletUpdateSchema>;

// ── Score helper ──────────────────────────────────────────────────────────────

const CRITERIA = [
  ['flowersAccessibility', 'fliesAccessibility'],
  ['flowersCleanliness',   'fliesCleanliness'],
  ['flowersHygiene',       'fliesHygiene'],
  ['flowersStyle',         'fliesStyle'],
  ['flowersAmenities',     'fliesAmenities'],
  ['flowersSafety',        'fliesSafety'],
  ['flowersInclusivity',   'fliesInclusivity'],
  ['flowersCost',          'fliesCost'],
  ['flowersWait',          'fliesWait'],
  ['flowersKids',          'fliesKids'],
] as const;

function r1(n: number) { return Math.round(n * 10) / 10; }

function computeScore(ratings: Rating[]) {
  if (!ratings.length) return { flowers: 0, flies: 0, net: 0, count: 0 };

  let sumFlowers = 0, sumFlies = 0, activePairs = 0, netSum = 0;

  for (const [fk, lk] of CRITERIA) {
    const avgF = ratings.reduce((s, r) => s + r[fk], 0) / ratings.length;
    const avgL = ratings.reduce((s, r) => s + r[lk], 0) / ratings.length;
    sumFlowers += avgF;
    sumFlies += avgL;
    if (avgF > 0 || avgL > 0) { netSum += avgF - avgL; activePairs++; }
  }

  return {
    flowers: r1(sumFlowers / CRITERIA.length),
    flies:   r1(sumFlies   / CRITERIA.length),
    net:     r1(activePairs ? netSum / activePairs : 0),
    count:   ratings.length,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ToiletsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Geo-Suche via PostGIS ST_DWithin ────────────────────────────────────────

  async findNearby(
    lng: number,
    lat: number,
    radiusM: number,
    filters: { category?: string[]; minScore?: number } = {},
  ) {
    // Schritt 1: IDs + Distanz per PostGIS — sicher über tagged-template-literals
    const geoRows = await this.prisma.$queryRaw<{ id: string; distance: number }[]>`
      SELECT id,
             ST_Distance(
               geom,
               ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
             ) AS distance
      FROM   toilets
      WHERE  geom IS NOT NULL
        AND  ST_DWithin(
               geom,
               ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
               ${radiusM}
             )
        AND  status    = 'active'
        AND  visibility <> 'private'
      ORDER  BY distance
      LIMIT  200
    `;

    if (!geoRows.length) return [];

    // Schritt 2: Prisma ORM für Typsicherheit + Includes
    const ids = geoRows.map((r) => r.id);
    const where: Prisma.ToiletWhereInput = {
      id: { in: ids },
    };
    if (filters.category?.length) {
      where.category = { in: filters.category as any };
    }

    const toilets = await this.prisma.toilet.findMany({
      where,
      include: { _count: { select: { ratings: true } } },
    });

    // Distanz-Map + sortieren
    const distMap = new Map(geoRows.map((r) => [r.id, Math.round(r.distance)]));
    return toilets
      .sort((a, b) => (distMap.get(a.id) ?? 0) - (distMap.get(b.id) ?? 0))
      .map((t) => ({ ...t, distanceM: distMap.get(t.id) ?? 0 }));
  }

  // ── Detail (mit Score) ────────────────────────────────────────────────────

  async findByIdOrFail(id: string, requestingUserId?: string) {
    const toilet = await this.prisma.toilet.findUnique({
      where: { id },
      include: {
        ratings: { take: 50, orderBy: { createdAt: 'desc' } },
        photos: { where: { moderationStatus: 'approved' }, take: 10 },
        _count: { select: { ratings: true } },
      },
    });
    if (!toilet) throw new NotFoundException('Toilette nicht gefunden');

    // Private Toiletten nur für Berechtigte
    if (toilet.visibility === Visibility.private) {
      const allowed = await this.canSeePrivate(id, requestingUserId);
      if (!allowed) throw new NotFoundException('Toilette nicht gefunden');
    }

    const score = computeScore(toilet.ratings);
    return { ...toilet, score };
  }

  // ── Erstellen ─────────────────────────────────────────────────────────────

  create(data: ToiletInput, createdById: string) {
    return this.prisma.toilet.create({
      data: {
        ...data,
        feeChf: data.feeChf != null ? new Prisma.Decimal(data.feeChf) : undefined,
        openingHours: data.openingHours as Prisma.InputJsonValue ?? Prisma.JsonNull,
        accessibility: data.accessibility as Prisma.InputJsonValue ?? Prisma.JsonNull,
        createdById,
      },
    });
  }

  // ── Aktualisieren ─────────────────────────────────────────────────────────

  async update(id: string, data: ToiletUpdate, userId: string) {
    await this.assertCanEdit(id, userId);
    return this.prisma.toilet.update({
      where: { id },
      data: {
        ...data,
        feeChf: data.feeChf != null ? new Prisma.Decimal(data.feeChf) : undefined,
        openingHours: data.openingHours as Prisma.InputJsonValue | undefined,
        accessibility: data.accessibility as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // ── Soft-Delete ───────────────────────────────────────────────────────────

  async remove(id: string, userId: string) {
    await this.assertCanEdit(id, userId);
    return this.prisma.toilet.update({
      where: { id },
      data: { status: 'hidden' },
    });
  }

  // ── Berechtigungsprüfungen ────────────────────────────────────────────────

  private async assertCanEdit(toiletId: string, userId: string) {
    const [toilet, user] = await Promise.all([
      this.prisma.toilet.findUnique({ where: { id: toiletId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!toilet) throw new NotFoundException('Toilette nicht gefunden');
    const isOwner = toilet.createdById === userId;
    const isPrivileged = user?.role === 'moderator' || user?.role === 'admin';
    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException('Keine Berechtigung');
    }
    return toilet;
  }

  private async canSeePrivate(toiletId: string, userId?: string) {
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'moderator' || user?.role === 'admin') return true;
    const toilet = await this.prisma.toilet.findUnique({ where: { id: toiletId } });
    if (toilet?.createdById === userId || toilet?.ownerId === userId) return true;
    const invite = await this.prisma.privateInvite.findUnique({
      where: { toiletId_inviteeUserId: { toiletId, inviteeUserId: userId } },
    });
    return !!invite;
  }
}
