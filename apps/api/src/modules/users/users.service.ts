import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

// ── Gamification ──────────────────────────────────────────────────────────────

const POINTS = {
  toiletCreated: 10,
  ratingGiven: 5,
  photoApproved: 5,
  toiletVerified: 20,
} as const;

export interface Badge {
  id: string;
  emoji: string;
  name: string;
}

function computeBadges(toilets: number, ratings: number, photos: number, points: number): Badge[] {
  const badges: Badge[] = [];
  if (toilets >= 1) badges.push({ id: 'pioneer', emoji: '🚽', name: 'Pionier' });
  if (ratings >= 1) badges.push({ id: 'rater', emoji: '🌸', name: 'Bewerter' });
  if (photos >= 1) badges.push({ id: 'photog', emoji: '📸', name: 'Fotograf' });
  if (toilets >= 5) badges.push({ id: 'explorer', emoji: '🗺️', name: 'Entdecker' });
  if (ratings >= 10) badges.push({ id: 'regular', emoji: '⭐', name: 'Stammgast' });
  if (toilets >= 10) badges.push({ id: 'cartog', emoji: '🧭', name: 'Kartograf' });
  if (ratings >= 50) badges.push({ id: 'expert', emoji: '🏅', name: 'Experte' });
  if (points >= 100) badges.push({ id: 'klopilot', emoji: '🏆', name: 'Klopilot' });
  return badges;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Nutzer nicht gefunden');
    return user;
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, handle: true, role: true },
    });
    if (!user) throw new NotFoundException('Nutzer nicht gefunden');
    return user;
  }

  findByHandle(handle: string) {
    return this.prisma.user.findUnique({ where: { handle } });
  }

  async findOrCreate(email: string) {
    const existing = await this.findByEmail(email);
    if (existing) return existing;
    const handle = `u${crypto.randomBytes(4).toString('hex')}`;
    return this.prisma.user.create({
      data: { email, handle, role: 'user' },
    });
  }

  // ── Stats & Gamification ─────────────────────────────────────────────────

  async getStats(userId: string) {
    const [toiletsCreated, ratingsGiven, photosApproved, verifiedToilets] = await Promise.all([
      this.prisma.toilet.count({ where: { createdById: userId, status: 'active' } }),
      this.prisma.rating.count({ where: { userId } }),
      this.prisma.photo.count({ where: { userId, moderationStatus: 'approved' } }),
      this.prisma.toilet.count({ where: { createdById: userId, verified: true } }),
    ]);

    const points =
      toiletsCreated * POINTS.toiletCreated +
      ratingsGiven * POINTS.ratingGiven +
      photosApproved * POINTS.photoApproved +
      verifiedToilets * POINTS.toiletVerified;

    return {
      points,
      toiletsCreated,
      ratingsGiven,
      photosApproved,
      verifiedToilets,
      badges: computeBadges(toiletsCreated, ratingsGiven, photosApproved, points),
    };
  }

  async getLeaderboard(limit = 20) {
    // Aggregation via Prisma groupBy — kein N+1
    const [toiletCounts, ratingCounts, photoCounts, verifiedCounts] = await Promise.all([
      this.prisma.toilet.groupBy({
        by: ['createdById'],
        where: { status: 'active' },
        _count: { _all: true },
      }),
      this.prisma.rating.groupBy({ by: ['userId'], _count: { _all: true } }),
      this.prisma.photo.groupBy({
        by: ['userId'],
        where: { moderationStatus: 'approved' },
        _count: { _all: true },
      }),
      this.prisma.toilet.groupBy({
        by: ['createdById'],
        where: { verified: true },
        _count: { _all: true },
      }),
    ]);

    const tc = new Map(toiletCounts.map((r) => [r.createdById, r._count._all]));
    const rc = new Map(ratingCounts.map((r) => [r.userId, r._count._all]));
    const pc = new Map(photoCounts.map((r) => [r.userId, r._count._all]));
    const vc = new Map(verifiedCounts.map((r) => [r.createdById, r._count._all]));

    const allUserIds = [...new Set([...tc.keys(), ...rc.keys(), ...pc.keys()])];
    const pointsMap = new Map(
      allUserIds.map((id) => {
        const t = tc.get(id) ?? 0;
        const r = rc.get(id) ?? 0;
        const p = pc.get(id) ?? 0;
        const v = vc.get(id) ?? 0;
        return [
          id,
          t * POINTS.toiletCreated +
            r * POINTS.ratingGiven +
            p * POINTS.photoApproved +
            v * POINTS.toiletVerified,
        ];
      }),
    );

    const topIds = [...pointsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const users = await this.prisma.user.findMany({
      where: { id: { in: topIds } },
      select: { id: true, handle: true },
    });

    return users
      .map((u) => ({
        id: u.id,
        handle: u.handle,
        points: pointsMap.get(u.id) ?? 0,
        badges: computeBadges(
          tc.get(u.id) ?? 0,
          rc.get(u.id) ?? 0,
          pc.get(u.id) ?? 0,
          pointsMap.get(u.id) ?? 0,
        ),
      }))
      .sort((a, b) => b.points - a.points)
      .map((u, i) => ({ rank: i + 1, ...u }));
  }
}
