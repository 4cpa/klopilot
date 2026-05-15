import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

const MagicLinkDto = z.object({ email: z.string().email() });

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Post('magic-link')
  async requestMagicLink(@Body() body: unknown) {
    const { email } = MagicLinkDto.parse(body);
    // TODO P1: send magic link email via Mailhog
    return { message: 'Magic Link wurde versendet', email };
  }

  @Get('oauth/:provider')
  oauthRedirect(@Param('provider') provider: string) {
    // TODO P1: redirect to OAuth provider
    return { provider };
  }
}
