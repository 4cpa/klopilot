import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from './s3.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async uploadPhoto(
    fileBuffer: Buffer,
    mimeType: string,
    toiletId: string,
    userId: string,
    ratingId?: string,
  ) {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(`Nicht unterstütztes Bildformat: ${mimeType}`);
    }
    if (fileBuffer.byteLength > MAX_BYTES) {
      throw new BadRequestException('Bild zu groß (max 10 MB)');
    }

    // Toilet muss existieren und aktiv sein
    const toilet = await this.prisma.toilet.findUnique({ where: { id: toiletId } });
    if (!toilet || toilet.status !== 'active') {
      throw new NotFoundException('Toilette nicht gefunden oder inaktiv');
    }

    // EXIF entfernen + Resize + WebP-Re-Encode via sharp
    // sharp liest nur Pixel — alle Metadaten (GPS, Kamera, etc.) werden verworfen
    const processed = await sharp(fileBuffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const s3Key = `toilets/${toiletId}/${Date.now()}-${userId}.webp`;
    const url = await this.s3.put(s3Key, processed);

    const photo = await this.prisma.photo.create({
      data: {
        toiletId,
        userId,
        ratingId: ratingId ?? null,
        s3Key,
        moderationStatus: 'pending',
      },
    });

    return { ...photo, url, size: processed.length };
  }

  async deletePhoto(photoId: string, requestingUserId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      include: { user: { select: { role: true } } },
    });
    if (!photo) throw new NotFoundException('Foto nicht gefunden');

    const isOwner = photo.userId === requestingUserId;
    const isPrivileged = ['moderator', 'admin'].includes(photo.user.role);
    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException('Keine Berechtigung');
    }

    await this.s3.delete(photo.s3Key);
    await this.prisma.photo.delete({ where: { id: photoId } });
  }

  async approvePhoto(photoId: string) {
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'approved' },
    });
  }

  async rejectPhoto(photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Foto nicht gefunden');
    await this.s3.delete(photo.s3Key);
    return this.prisma.photo.update({
      where: { id: photoId },
      data: { moderationStatus: 'rejected' },
    });
  }

  photoUrl(s3Key: string, publicUrl: string) {
    return `${publicUrl}/${s3Key}`;
  }
}
