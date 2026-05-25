import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';

const MAGIC_TTL = 15 * 60; // 15 Minuten
const REFRESH_TTL = 7 * 24 * 3600; // 7 Tage

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  // ── Magic Link ────────────────────────────────────────────────────────────

  async requestMagicLink(email: string, platform: 'web' | 'mobile' = 'web') {
    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`magic:${token}`, email, 'EX', MAGIC_TTL);
    await this.mail.sendMagicLink(email, token, platform);
    this.logger.log(`Magic link angefordert für ${email} (${platform})`);
  }

  async verifyMagicLink(token: string) {
    const email = await this.redis.get(`magic:${token}`);
    if (!email) {
      throw new UnauthorizedException('Link abgelaufen oder ungültig');
    }
    // Einmaliger Gebrauch — sofort löschen
    await this.redis.del(`magic:${token}`);

    const user = await this.users.findOrCreate(email);
    return this.issueTokenPair(user.id);
  }

  // ── Token-Verwaltung ──────────────────────────────────────────────────────

  async issueTokenPair(userId: string) {
    const accessToken = this.jwt.sign({ sub: userId }, { expiresIn: '15m' });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.set(`refresh:${refreshHash}`, userId, 'EX', REFRESH_TTL);

    return { accessToken, refreshToken };
  }

  async rotate(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const userId = await this.redis.get(`refresh:${hash}`);
    if (!userId) {
      throw new UnauthorizedException('Refresh-Token ungültig oder abgelaufen');
    }
    // Altes Token sofort invalidieren (Rotation)
    await this.redis.del(`refresh:${hash}`);
    return this.issueTokenPair(userId);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.del(`refresh:${hash}`);
  }

  // ── JWT-Validierung für Passport ──────────────────────────────────────────

  validatePayload(payload: { sub: string }) {
    return { userId: payload.sub };
  }
}
