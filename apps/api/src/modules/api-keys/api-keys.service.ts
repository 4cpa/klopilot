import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string) {
    const key = `klp_${randomBytes(24).toString('hex')}`;
    return this.prisma.apiKey.create({
      data: { key, name, userId },
      select: { id: true, key: true, name: true, createdAt: true },
    });
  }

  async listMine(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revoked: false },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, userId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException();
    if (key.userId !== userId) throw new ForbiddenException();
    return this.prisma.apiKey.update({ where: { id }, data: { revoked: true } });
  }

  async validate(rawKey: string): Promise<boolean> {
    const key = await this.prisma.apiKey.findUnique({ where: { key: rawKey } });
    if (!key || key.revoked) return false;
    // lastUsedAt asynchron aktualisieren — kein await
    this.prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
    return true;
  }
}
