import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('media')
@Controller('media')
export class MediaController {
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  upload() {
    // TODO P1: Multipart via @fastify/multipart
    return { message: 'Upload-Endpunkt — kommt in P1 Schritt 5' };
  }
}
