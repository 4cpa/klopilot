import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const CSV_COLUMNS = [
  'id',
  'name',
  'category',
  'address',
  'longitude',
  'latitude',
  'visibility',
  'status',
  'verified',
  'source',
  'feeChf',
  'createdAt',
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

@Injectable()
export class AdminDataService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      toiletsByStatus,
      toiletsByCategory,
      usersByRole,
      ratingsCount,
      openReports,
      pendingPhotos,
    ] = await Promise.all([
      this.prisma.toilet.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.toilet.groupBy({ by: ['category'], _count: { _all: true } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.rating.count(),
      this.prisma.report.count({ where: { status: 'open' } }),
      this.prisma.photo.count({ where: { moderationStatus: 'pending' } }),
    ]);

    return {
      totalToilets: toiletsByStatus.reduce((sum, r) => sum + r._count._all, 0),
      totalUsers: usersByRole.reduce((sum, r) => sum + r._count._all, 0),
      ratingsCount,
      openReports,
      pendingPhotos,
      toiletsByStatus: toiletsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      toiletsByCategory: toiletsByCategory.map((r) => ({
        category: r.category,
        count: r._count._all,
      })),
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count._all })),
    };
  }

  async exportToiletsCsv(): Promise<string> {
    const rows = await this.prisma.toilet.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        longitude: true,
        latitude: true,
        visibility: true,
        status: true,
        verified: true,
        source: true,
        feeChf: true,
        createdAt: true,
      },
    });

    const lines = [CSV_COLUMNS.join(',')];
    for (const row of rows) {
      lines.push(
        CSV_COLUMNS.map((col) => csvEscape((row as Record<string, unknown>)[col])).join(','),
      );
    }
    return lines.join('\n');
  }
}
