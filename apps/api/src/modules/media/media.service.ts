import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as sharp from 'sharp';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async processAndStore(
    fileBuffer: Buffer,
    toiletId: string,
    userId: string,
    ratingId?: string,
  ) {
    // EXIF entfernen + Re-Encode zu WebP (max 1600px) via sharp
    const processed = await sharp(fileBuffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const s3Key = `toilets/${toiletId}/${Date.now()}-${userId}.webp`;

    // TODO P1: Upload zu MinIO via S3-API (@aws-sdk/client-s3)
    // Platzhalter bis S3-Client installiert ist
    const photo = await this.prisma.photo.create({
      data: { toiletId, userId, ratingId, s3Key, moderationStatus: 'pending' },
    });

    return { ...photo, size: processed.length };
  }
}
