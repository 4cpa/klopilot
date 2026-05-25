import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { computeScore, scoreFromGroup, ZERO_SCORE, Score } from '../../common/utils/score.util';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationsService } from '../notifications/notifications.service';

// ── Schemas ──────────────────────────────────────────────────────────────────

const ScoreSchema = z
  .object({
    flowers: z.number().int().min(0).max(5).default(0),
    flies: z.number().int().min(0).max(5).default(0),
  })
  .refine((s) => !(s.flowers > 0 && s.flies > 0), {
    message: 'Blümchen und Fliegen dürfen nicht gleichzeitig > 0 sein',
  });

export const RatingInputSchema = z.object({
  scores: z.object({
    accessibility: ScoreSchema.optional(),
    cleanliness: ScoreSchema.optional(),
    hygiene: ScoreSchema.optional(),
    style: ScoreSchema.optional(),
    amenities: ScoreSchema.optional(),
    safety: ScoreSchema.optional(),
    inclusivity: ScoreSchema.optional(),
    cost: ScoreSchema.optional(),
    wait: ScoreSchema.optional(),
    kids: ScoreSchema.optional(),
  }),
  comment: z.string().max(2000).optional(),
  language: z.string().default('de'),
});

export type RatingInput = z.infer<typeof RatingInputSchema>;

// ── Prisma groupBy-Typ für Score-Batch ───────────────────────────────────────

const AVG_FIELDS = {
  flowersAccessibility: true,
  fliesAccessibility: true,
  flowersCleanliness: true,
  fliesCleanliness: true,
  flowersHygiene: true,
  fliesHygiene: true,
  flowersStyle: true,
  fliesStyle: true,
  flowersAmenities: true,
  fliesAmenities: true,
  flowersSafety: true,
  fliesSafety: true,
  flowersInclusivity: true,
  fliesInclusivity: true,
  flowersCost: true,
  fliesCost: true,
  flowersWait: true,
  fliesWait: true,
  flowersKids: true,
  fliesKids: true,
} as const;

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Upsert (eine Bewertung pro User pro Toilette) ─────────────────────────

  async upsert(toiletId: string, userId: string, input: RatingInput) {
    const toilet = await this.prisma.toilet.findUnique({ where: { id: toiletId } });
    if (!toilet || toilet.status !== 'active') {
      throw new NotFoundException('Toilette nicht gefunden oder inaktiv');
    }

    if (input.comment && this.moderation.containsProfanity(input.comment)) {
      throw new UnprocessableEntityException('Kommentar enthält unzulässige Ausdrücke');
    }

    const s = input.scores;
    const data = {
      flowersAccessibility: s.accessibility?.flowers ?? 0,
      fliesAccessibility: s.accessibility?.flies ?? 0,
      flowersCleanliness: s.cleanliness?.flowers ?? 0,
      fliesCleanliness: s.cleanliness?.flies ?? 0,
      flowersHygiene: s.hygiene?.flowers ?? 0,
      fliesHygiene: s.hygiene?.flies ?? 0,
      flowersStyle: s.style?.flowers ?? 0,
      fliesStyle: s.style?.flies ?? 0,
      flowersAmenities: s.amenities?.flowers ?? 0,
      fliesAmenities: s.amenities?.flies ?? 0,
      flowersSafety: s.safety?.flowers ?? 0,
      fliesSafety: s.safety?.flies ?? 0,
      flowersInclusivity: s.inclusivity?.flowers ?? 0,
      fliesInclusivity: s.inclusivity?.flies ?? 0,
      flowersCost: s.cost?.flowers ?? 0,
      fliesCost: s.cost?.flies ?? 0,
      flowersWait: s.wait?.flowers ?? 0,
      fliesWait: s.wait?.flies ?? 0,
      flowersKids: s.kids?.flowers ?? 0,
      fliesKids: s.kids?.flies ?? 0,
      comment: input.comment,
      language: input.language,
    };

    const rating = await this.prisma.rating.upsert({
      where: { toiletId_userId: { toiletId, userId } },
      create: { toiletId, userId, ...data },
      update: data,
    });

    const allRatings = await this.prisma.rating.findMany({ where: { toiletId } });
    const score = computeScore(allRatings);

    // Toilet-Ersteller benachrichtigen (fire-and-forget, kein await)
    this.notifications.notifyToiletOwnerOnRating(toiletId, userId).catch(() => {});

    return { rating, score };
  }

  // ── Liste der Bewertungen einer Toilette ──────────────────────────────────

  async findByToilet(toiletId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { toiletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          photos: { where: { moderationStatus: 'approved' }, take: 5 },
        },
      }),
      this.prisma.rating.count({ where: { toiletId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Eigene Bewertung einer Toilette ───────────────────────────────────────

  async findMine(toiletId: string, userId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { toiletId_userId: { toiletId, userId } },
      include: { photos: { where: { moderationStatus: 'approved' } } },
    });
    if (!rating) throw new NotFoundException('Noch keine Bewertung abgegeben');
    return rating;
  }

  // ── Eigene Bewertung löschen ──────────────────────────────────────────────

  async remove(toiletId: string, userId: string) {
    const existing = await this.prisma.rating.findUnique({
      where: { toiletId_userId: { toiletId, userId } },
    });
    if (!existing) throw new NotFoundException('Keine Bewertung vorhanden');
    return this.prisma.rating.delete({
      where: { toiletId_userId: { toiletId, userId } },
    });
  }

  // ── Batch-Score für mehrere Toiletten (List-View, kein N+1) ──────────────

  async computeScoreMap(toiletIds: string[]): Promise<Map<string, Score>> {
    if (!toiletIds.length) return new Map();

    const groups = await this.prisma.rating.groupBy({
      by: ['toiletId'],
      where: { toiletId: { in: toiletIds } },
      _count: { _all: true },
      _avg: AVG_FIELDS,
    });

    return new Map(groups.map((g) => [g.toiletId, scoreFromGroup(g as any)]));
  }
}
