import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

const MagicLinkDto = z.object({
  email: z.string().email(),
  platform: z.enum(['web', 'mobile']).default('web'),
});

const REFRESH_COOKIE = 'klo_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/auth',
  maxAge: 7 * 24 * 3600,
  secure: process.env.NODE_ENV === 'production',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  // GET /auth/me
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  me(@CurrentUser() user: { userId: string }) {
    return this.users.findByIdOrFail(user.userId);
  }

  // 1) Link anfordern — gibt sessionId für Cross-Device-Polling zurück
  @Post('magic-link')
  @HttpCode(202)
  async requestMagicLink(@Body() body: unknown) {
    const { email, platform } = MagicLinkDto.parse(body);
    const { sessionId } = await this.auth.requestMagicLink(email, platform);
    return { message: 'Magic Link wurde versendet', sessionId };
  }

  // 1b) Cross-Device-Session pollen — Laptop fragt alle ~3 s, ob Handy den Link bestätigt hat
  @Get('poll')
  @HttpCode(200)
  async poll(@Query('sessionId') sessionId: string) {
    if (!sessionId) throw new BadRequestException('sessionId fehlt');
    const accessToken = await this.auth.pollSession(sessionId);
    if (!accessToken) return { pending: true };
    return { accessToken };
  }

  // 2) Link bestätigen → Tokens ausgeben
  @Get('verify')
  async verify(
    @Query('token') token: string,
    @Query('mobile') mobile: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (!token) throw new UnauthorizedException('Kein Token angegeben');
    const { accessToken, refreshToken } = await this.auth.verifyMagicLink(token);
    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    // Mobile clients can't rely on HTTP-only cookies — include refreshToken in body
    if (mobile === 'true') return { accessToken, refreshToken };
    return { accessToken };
  }

  // 3) Access-Token erneuern
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const bodyToken = (body as Record<string, unknown>)?.refreshToken as string | undefined;
    const oldRefresh = bodyToken ?? (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    if (!oldRefresh) throw new UnauthorizedException('Kein Refresh-Token');
    const { accessToken, refreshToken } = await this.auth.rotate(oldRefresh);
    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    return { accessToken, refreshToken };
  }

  // 4) Logout
  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth(REFRESH_COOKIE)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    await this.auth.logout(token);
    reply.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  }
}
