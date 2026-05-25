import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { z } from 'zod';

export const PartnerApplySchema = z.object({
  name: z.string().min(2).max(120),
  type: z
    .enum(['municipality', 'restaurant', 'mall', 'transport', 'hotel', 'other'])
    .default('other'),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  description: z.string().max(1000).optional(),
});
export type PartnerApply = z.infer<typeof PartnerApplySchema>;

const SELECT_PARTNER = {
  id: true,
  name: true,
  type: true,
  website: true,
  contactEmail: true,
  logoKey: true,
  description: true,
  verified: true,
  createdAt: true,
  toilets: {
    where: { status: 'active' as const, visibility: { not: 'private' as const } },
    select: {
      id: true,
      name: true,
      category: true,
      latitude: true,
      longitude: true,
      verified: true,
    },
    take: 50,
  },
};

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(data: PartnerApply) {
    return this.prisma.partner.create({
      data: { ...data, verified: false },
      select: { id: true, name: true, type: true, verified: true, createdAt: true },
    });
  }

  async list(verifiedOnly = true) {
    return this.prisma.partner.findMany({
      where: verifiedOnly ? { verified: true } : {},
      select: SELECT_PARTNER,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.partner.findUnique({ where: { id }, select: SELECT_PARTNER });
    if (!p) throw new NotFoundException('Partner nicht gefunden');
    return p;
  }

  async verify(id: string, actorRole: string) {
    if (!['admin', 'moderator'].includes(actorRole)) throw new ForbiddenException();
    const p = await this.prisma.partner.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    return this.prisma.partner.update({
      where: { id },
      data: { verified: true },
      select: { id: true, name: true, verified: true },
    });
  }

  async assignToToilet(partnerId: string, toiletId: string, actorRole: string) {
    if (!['admin', 'moderator'].includes(actorRole)) throw new ForbiddenException();
    return this.prisma.toilet.update({
      where: { id: toiletId },
      data: { partnerId },
      select: { id: true, name: true, partnerId: true },
    });
  }
}
