import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { z } from 'zod';

const ScoreSchema = z.object({
  flowers: z.number().int().min(0).max(5).default(0),
  flies: z.number().int().min(0).max(5).default(0),
}).refine(
  (s) => !(s.flowers > 0 && s.flies > 0),
  { message: 'Blümchen und Fliegen dürfen nicht gleichzeitig > 0 sein' },
);

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

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(toiletId: string, userId: string, input: RatingInput) {
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
    return this.prisma.rating.upsert({
      where: { toiletId_userId: { toiletId, userId } },
      create: { toiletId, userId, ...data },
      update: data,
    });
  }

  aggregate(toiletId: string) {
    return this.prisma.rating.aggregate({
      where: { toiletId },
      _count: true,
      _avg: {
        flowersAccessibility: true,
        fliesAccessibility: true,
        flowersCleanliness: true,
        fliesCleanliness: true,
        flowersHygiene: true,
        fliesHygiene: true,
      },
    });
  }
}
