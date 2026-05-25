import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { NotificationsService } from '../notifications/notifications.service';
import { computeScore } from '../../common/utils/score.util';
import { z } from 'zod';

// ── Schemas ──────────────────────────────────────────────────────────────────

export const ToiletInputSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum([
    'public',
    'nette_toilette',
    'gastronomy',
    'transport',
    'mall',
    'event',
    'private',
  ]),
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ToiletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly meili: MeilisearchService,
    private readonly notifications: NotificationsService,
  ) {}

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
      include: {
        partner: { select: { id: true, name: true, type: true, logoKey: true } },
        _count: { select: { ratings: true } },
      },
    });

    // Distanz-Map + Score-Map (kein N+1)
    const distMap = new Map(geoRows.map((r) => [r.id, Math.round(r.distance)]));
    const scoreMap = await this.ratingsService.computeScoreMap(ids);

    return toilets
      .sort((a, b) => (distMap.get(a.id) ?? 0) - (distMap.get(b.id) ?? 0))
      .map((t) => ({
        ...t,
        distanceM: distMap.get(t.id) ?? 0,
        score: scoreMap.get(t.id) ?? { flowers: 0, flies: 0, net: 0, count: 0 },
      }));
  }

  // ── Detail (mit Score) ────────────────────────────────────────────────────

  async findByIdOrFail(id: string, requestingUserId?: string) {
    const toilet = await this.prisma.toilet.findUnique({
      where: { id },
      include: {
        ratings: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { handle: true } } },
        },
        photos: { where: { moderationStatus: 'approved' }, take: 10 },
        partner: { select: { id: true, name: true, type: true, logoKey: true } },
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

  // Koordinaten auf ~100 m runden (3 Dezimalstellen ≈ 111 m)
  private fuzzyCoords(lng: number, lat: number) {
    return {
      longitude: Math.round(lng * 1000) / 1000,
      latitude: Math.round(lat * 1000) / 1000,
    };
  }

  async create(data: ToiletInput, createdById: string) {
    const isPrivate = data.visibility === 'private' || data.category === 'private';
    const coords = isPrivate
      ? this.fuzzyCoords(data.longitude, data.latitude)
      : { longitude: data.longitude, latitude: data.latitude };

    const toilet = await this.prisma.toilet.create({
      data: {
        ...data,
        ...coords,
        visibility: isPrivate ? 'private' : (data.visibility ?? 'public'),
        feeChf: data.feeChf != null ? new Prisma.Decimal(data.feeChf) : undefined,
        openingHours: (data.openingHours as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        accessibility: (data.accessibility as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdById,
      },
    });
    // PostGIS geom setzen — Pflicht für ST_DWithin-Suche
    await this.prisma.$executeRaw`
      UPDATE toilets
      SET    geom = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography
      WHERE  id   = ${toilet.id}::uuid
    `;
    this.meili.indexToilet({
      id: toilet.id,
      name: toilet.name,
      address: data.address ?? '',
      category: toilet.category,
      _geo: { lat: data.latitude, lng: data.longitude },
    });
    return toilet;
  }

  // ── Aktualisieren ─────────────────────────────────────────────────────────

  async update(id: string, data: ToiletUpdate, userId: string) {
    await this.assertCanEdit(id, userId);
    const updated = await this.prisma.toilet.update({
      where: { id },
      data: {
        ...data,
        feeChf: data.feeChf != null ? new Prisma.Decimal(data.feeChf) : undefined,
        openingHours: data.openingHours as Prisma.InputJsonValue | undefined,
        accessibility: data.accessibility as Prisma.InputJsonValue | undefined,
      },
    });
    this.meili.indexToilet({
      id: updated.id,
      name: updated.name,
      address: data.address ?? (updated as any).address ?? '',
      category: updated.category,
      _geo: { lat: Number((updated as any).latitude), lng: Number((updated as any).longitude) },
    });
    return updated;
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

  // ── Eigene Toiletten ─────────────────────────────────────────────────────

  async findMine(userId: string) {
    return this.prisma.toilet.findMany({
      where: { createdById: userId, status: { not: 'removed' } },
      select: {
        id: true,
        name: true,
        category: true,
        visibility: true,
        verified: true,
        latitude: true,
        longitude: true,
        address: true,
        feeChf: true,
        openingHours: true,
        accessibility: true,
        createdAt: true,
        _count: { select: { ratings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Privat-Toiletten ──────────────────────────────────────────────────────

  async findPrivate(userId: string) {
    const [owned, invited] = await Promise.all([
      this.prisma.toilet.findMany({
        where: { createdById: userId, visibility: 'private' },
        include: { _count: { select: { invites: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.privateInvite.findMany({
        where: { inviteeUserId: userId },
        include: { toilet: { include: { _count: { select: { invites: true } } } } },
      }),
    ]);
    const invitedToilets = invited.map((i) => i.toilet);
    const seen = new Set(owned.map((t) => t.id));
    return [...owned, ...invitedToilets.filter((t) => !seen.has(t.id))];
  }

  async listInvites(toiletId: string, userId: string) {
    await this.assertCanEdit(toiletId, userId);
    return this.prisma.privateInvite.findMany({
      where: { toiletId },
      select: { invitee: { select: { id: true, handle: true, email: true } }, grantedAt: true },
    });
  }

  async inviteByEmail(toiletId: string, ownerUserId: string, email: string) {
    await this.assertCanEdit(toiletId, ownerUserId);
    const toilet = await this.prisma.toilet.findUnique({ where: { id: toiletId } });
    if (toilet?.visibility !== 'private') throw new ForbiddenException('Nur für private Toiletten');
    const invitee = await this.prisma.user.findUnique({ where: { email } });
    if (!invitee) throw new NotFoundException('Kein Konto mit dieser E-Mail gefunden');
    const result = await this.prisma.privateInvite.upsert({
      where: { toiletId_inviteeUserId: { toiletId, inviteeUserId: invitee.id } },
      create: { toiletId, inviteeUserId: invitee.id, grantedById: ownerUserId },
      update: {},
    });
    this.notifications
      .sendToUser(
        invitee.id,
        '🔒 Einladung erhalten',
        `Du hast Zugang zur privaten Toilette «${toilet!.name}» erhalten.`,
        { screen: 'toilet', toiletId },
      )
      .catch(() => {});
    return result;
  }

  async removeInvite(toiletId: string, ownerUserId: string, inviteeUserId: string) {
    await this.assertCanEdit(toiletId, ownerUserId);
    await this.prisma.privateInvite.deleteMany({
      where: { toiletId, inviteeUserId },
    });
  }

  // ── Verifizierung (Moderator/Admin) ──────────────────────────────────────

  async setVerified(id: string, verified: boolean, actorUserId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorUserId } });
    if (!actor || !['moderator', 'admin'].includes(actor.role)) {
      throw new ForbiddenException('Keine Berechtigung');
    }
    const toilet = await this.prisma.toilet.findUnique({ where: { id } });
    if (!toilet) throw new NotFoundException('Toilette nicht gefunden');
    const updated = await this.prisma.toilet.update({ where: { id }, data: { verified } });
    if (verified && toilet.createdById !== actorUserId) {
      this.notifications
        .sendToUser(
          toilet.createdById,
          '✓ Toilette verifiziert',
          `Deine Toilette «${toilet.name}» wurde offiziell verifiziert.`,
          { screen: 'toilet', toiletId: id },
        )
        .catch(() => {});
    }
    return updated;
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
