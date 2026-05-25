import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';

const MAGIC_TTL = 15 * 60; // 15 Minuten
const REFRESH_TTL = 7 * 24 * 3600; // 7 Tage
const SESSION_TTL = 5 * 60; // 5 Minuten — Zeitfenster für Polling-Client

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
    // sessionId identifiziert die wartende Browser-Session (Cross-Device-Polling)
    const sessionId = crypto.randomBytes(16).toString('hex');
    await this.redis.set(`magic:${token}`, JSON.stringify({ email, sessionId }), 'EX', MAGIC_TTL);
    await this.mail.sendMagicLink(email, token, platform);
    this.logger.log(`Magic link angefordert für ${email} (${platform})`);
    return { sessionId };
  }

  async verifyMagicLink(token: string) {
    const raw = await this.redis.get(`magic:${token}`);
    if (!raw) {
      throw new UnauthorizedException('Link abgelaufen oder ungültig');
    }
    // Einmaliger Gebrauch — sofort löschen
    await this.redis.del(`magic:${token}`);

    let email: string;
    let sessionId: string | undefined;
    try {
      const parsed = JSON.parse(raw) as { email: string; sessionId?: string };
      email = parsed.email;
      sessionId = parsed.sessionId;
    } catch {
      // Rückwärtskompatibilität: raw war früher der E-Mail-String direkt
      email = raw;
    }

    const user = await this.users.findOrCreate(email);
    const tokens = await this.issueTokenPair(user.id);

    // Cross-Device: Access-Token kurz in Redis hinterlegen — Polling-Client holt ihn ab
    if (sessionId) {
      await this.redis.set(`session:${sessionId}`, tokens.accessToken, 'EX', SESSION_TTL);
    }

    return tokens;
  }

  /** Gibt den Access-Token zurück, sobald die Magic-Link-Verifizierung abgeschlossen ist.
   *  Löscht den Eintrag nach einmaligem Abruf (einmal abholen reicht). */
  async pollSession(sessionId: string): Promise<string | null> {
    const accessToken = await this.redis.get(`session:${sessionId}`);
    if (accessToken) {
      await this.redis.del(`session:${sessionId}`);
    }
    return accessToken ?? null;
  }

  // ── Token-Verwaltung ──────────────────────────────────────────────────────

  async issueTokenPair(userId: string) {
    // role in Payload einbetten damit Guards es ohne DB-Lookup lesen können
    const user = await this.users.findById(userId);
    const role = user?.role ?? 'user';
    const accessToken = this.jwt.sign({ sub: userId, role }, { expiresIn: '15m' });

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

  validatePayload(payload: { sub: string; role?: string }) {
    return { userId: payload.sub, role: payload.role ?? 'user' };
  }
}
