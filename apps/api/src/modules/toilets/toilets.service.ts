import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { z } from 'zod';

export const ToiletInputSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(['public', 'nette_toilette', 'gastronomy', 'transport', 'mall', 'event', 'private']),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  address: z.string().optional(),
  feeChf: z.number().min(0).optional(),
  openingHours: z.record(z.unknown()).optional(),
  accessibility: z.record(z.unknown()).optional(),
  visibility: z.enum(['public', 'nette_toilette', 'private']).default('public'),
});

export type ToiletInput = z.infer<typeof ToiletInputSchema>;

@Injectable()
export class ToiletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findNearby(lng: number, lat: number, radiusM: number, filters: {
    category?: string[];
    minScore?: number;
  } = {}) {
    // ST_DWithin via raw query — Prisma hat keinen nativen geography-Typ
    const radiusDeg = radiusM / 111_320;
    const where: Prisma.ToiletWhereInput = {
      status: 'active',
      visibility: { not: Visibility.private },
      longitude: { gte: lng - radiusDeg, lte: lng + radiusDeg },
      latitude: { gte: lat - radiusDeg, lte: lat + radiusDeg },
    };
    if (filters.category?.length) {
      where.category = { in: filters.category as any };
    }
    return this.prisma.toilet.findMany({
      where,
      include: { _count: { select: { ratings: true } } },
      take: 200,
    });
  }

  async findByIdOrFail(id: string) {
    const toilet = await this.prisma.toilet.findUnique({
      where: { id },
      include: {
        ratings: { take: 20, orderBy: { createdAt: 'desc' } },
        photos: { where: { moderationStatus: 'approved' }, take: 10 },
        _count: { select: { ratings: true } },
      },
    });
    if (!toilet) throw new NotFoundException('Toilette nicht gefunden');
    return toilet;
  }

  create(data: ToiletInput, createdById: string) {
    return this.prisma.toilet.create({
      data: {
        ...data,
        feeChf: data.feeChf != null ? new Prisma.Decimal(data.feeChf) : undefined,
        openingHours: data.openingHours as Prisma.InputJsonValue,
        accessibility: data.accessibility as Prisma.InputJsonValue,
        createdById,
      },
    });
  }
}
