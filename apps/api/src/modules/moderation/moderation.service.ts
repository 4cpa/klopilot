import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { z } from 'zod';

export const CreateReportSchema = z.object({
  targetType: z.enum(['toilet', 'rating', 'photo', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().min(5).max(500),
});
export type CreateReportDto = z.infer<typeof CreateReportSchema>;

const PROFANITY_DE = [
  'scheiß',
  'scheiss',
  'scheiße',
  'scheisse',
  'arsch',
  'arschloch',
  'fick',
  'wichser',
  'wichse',
  'hurensohn',
  'hure',
  'nutte',
  'fotze',
  'schwanz',
  'möse',
  'pisser',
  'kacke',
  'kack',
  'dreck',
  'versager',
];
const PROFANITY_EN = [
  'shit',
  'fuck',
  'cunt',
  'asshole',
  'bitch',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'whore',
  'slut',
];
const PROFANITY = [...PROFANITY_DE, ...PROFANITY_EN];

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  containsProfanity(text: string): boolean {
    const lower = text.toLowerCase();
    return PROFANITY.some((w) => lower.includes(w));
  }

  async createReport(reporterId: string, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        reporterId,
      },
      select: { id: true, targetType: true, targetId: true, status: true, createdAt: true },
    });
  }

  async listQueue(status?: string, page = 1, limit = 30) {
    const where = status ? { status: status as never } : { status: 'open' as never };
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
          reporter: { select: { id: true, handle: true, email: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async updateStatus(reportId: string, status: string, actorRole: string) {
    if (!['moderator', 'admin'].includes(actorRole)) throw new ForbiddenException();
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException();
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: status as never },
      select: { id: true, status: true },
    });
  }

  async approvePhoto(photoId: string, actorRole: string) {
    if (!['moderator', 'admin'].includes(actorRole)) throw new ForbiddenException();
    const photo = await this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'approved' },
      select: { id: true, moderationStatus: true },
    });
    this.notifications.notifyPhotoApproved(photoId).catch(() => {});
    return photo;
  }

  async rejectPhoto(photoId: string, actorRole: string) {
    if (!['moderator', 'admin'].includes(actorRole)) throw new ForbiddenException();
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'rejected' },
      select: { id: true, moderationStatus: true },
    });
  }

  async listPendingPhotos(page = 1, limit = 30) {
    const [items, total] = await Promise.all([
      this.prisma.photo.findMany({
        where: { moderationStatus: 'pending' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          s3Key: true,
          moderationStatus: true,
          createdAt: true,
          toilet: { select: { id: true, name: true } },
          user: { select: { id: true, handle: true } },
        },
      }),
      this.prisma.photo.count({ where: { moderationStatus: 'pending' } }),
    ]);
    return { items, total, page, limit };
  }
}
