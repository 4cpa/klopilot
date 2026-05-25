import {
  Controller,
  Delete,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { MediaService } from './media.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /**
   * POST /media/upload?toiletId=&ratingId=
   * Content-Type: multipart/form-data  (field name: "file")
   *
   * EXIF wird zwingend entfernt (sharp Re-Encode → WebP).
   * Status nach Upload immer "pending" (Auto-Moderation folgt in P2).
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'toiletId', type: String })
  @ApiQuery({ name: 'ratingId', type: String, required: false })
  async upload(
    @Req() req: FastifyRequest,
    @CurrentUser() user: { userId: string },
    @Query('toiletId') toiletId: string,
    @Query('ratingId') ratingId?: string,
  ) {
    if (!toiletId) throw new BadRequestException('toiletId fehlt');

    // @fastify/multipart: ein File-Part lesen
    const data = await (req as any).file();
    if (!data) throw new BadRequestException('Kein Datei-Part gefunden');

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return this.media.uploadPhoto(buffer, data.mimetype, toiletId, user.userId, ratingId);
  }

  /**
   * DELETE /media/:photoId
   * Eigentümer oder Moderator/Admin dürfen löschen.
   */
  @Delete(':photoId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('photoId') photoId: string, @CurrentUser() user: { userId: string }) {
    return this.media.deletePhoto(photoId, user.userId);
  }
}
