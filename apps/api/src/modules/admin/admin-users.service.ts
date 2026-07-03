import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { z } from 'zod';

export const UpdateRoleSchema = z.object({
  role: z.enum(['anon', 'user', 'verified', 'moderator', 'admin']),
});
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;

export const BanUserSchema = z.object({
  reason: z.string().min(3).max(300),
});
export type BanUserDto = z.infer<typeof BanUserSchema>;

const LIST_SELECT = {
  id: true,
  handle: true,
  email: true,
  role: true,
  status: true,
  bannedAt: true,
  bannedReason: true,
  deletedAt: true,
  verifiedAt: true,
  createdAt: true,
  _count: { select: { toiletsCreated: true, ratings: true, reports: true } },
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, limit = 30, search?: string, role?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (role) where['role'] = role;
    if (status) where['status'] = status;
    if (search) {
      where['OR'] = [
        { handle: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: LIST_SELECT,
      }),
      this.prisma.user.count({ where: where as never }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  private async findActiveOrFail(targetId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('Nutzer nicht gefunden');
    return user;
  }

  async updateRole(targetId: string, dto: UpdateRoleDto, actorId: string) {
    if (targetId === actorId && dto.role !== 'admin') {
      throw new BadRequestException('Die eigene Admin-Rolle kann nicht selbst entzogen werden');
    }
    await this.findActiveOrFail(targetId);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role },
      select: { id: true, role: true },
    });
  }

  async ban(targetId: string, dto: BanUserDto, actorId: string) {
    if (targetId === actorId)
      throw new BadRequestException('Das eigene Konto kann nicht gesperrt werden');
    await this.findActiveOrFail(targetId);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { status: 'banned', bannedAt: new Date(), bannedReason: dto.reason },
      select: { id: true, status: true, bannedAt: true, bannedReason: true },
    });
  }

  async unban(targetId: string) {
    await this.findActiveOrFail(targetId);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { status: 'active', bannedAt: null, bannedReason: null },
      select: { id: true, status: true },
    });
  }

  /** DSGVO-Löschung: Konto wird anonymisiert statt hart gelöscht (Ratings/Fotos bleiben referenziell erhalten). */
  async anonymize(targetId: string, actorId: string) {
    if (targetId === actorId)
      throw new BadRequestException('Das eigene Konto kann nicht gelöscht werden');
    const user = await this.findActiveOrFail(targetId);
    if (user.deletedAt) throw new BadRequestException('Konto ist bereits anonymisiert');

    return this.prisma.user.update({
      where: { id: targetId },
      data: {
        handle: `geloescht-${targetId.slice(0, 8)}`,
        email: null,
        passwordHash: null,
        expoPushToken: null,
        status: 'banned',
        deletedAt: new Date(),
      },
      select: { id: true, handle: true, deletedAt: true },
    });
  }
}
