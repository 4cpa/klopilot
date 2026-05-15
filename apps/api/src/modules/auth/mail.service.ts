import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'localhost'),
      port: Number(config.get('MAIL_PORT', '1035')),
      secure: false,
      auth: config.get('MAIL_USER')
        ? { user: config.get('MAIL_USER'), pass: config.get('MAIL_PASS') }
        : undefined,
    });
  }

  async sendMagicLink(email: string, token: string) {
    const apiUrl = this.config.get('PUBLIC_API_URL', 'http://localhost:3101');
    const link = `${apiUrl}/auth/verify?token=${token}`;

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM', 'noreply@klopilot.ch'),
      to: email,
      subject: '🚽 Dein klopilot-Login-Link',
      text: `Klick den Link um dich einzuloggen (gültig 15 Minuten):\n\n${link}`,
      html: `
        <p>Hallo!</p>
        <p>Klick den Link um dich bei klopilot.ch einzuloggen:</p>
        <p><a href="${link}" style="font-size:18px;font-weight:bold">➡ Einloggen</a></p>
        <p style="color:#6B7280;font-size:13px">Link ist 15 Minuten gültig. Wenn du das nicht angefragt hast, ignoriere diese Mail.</p>
      `,
    });

    this.logger.log(`Magic Link gesendet an ${email}`);
  }
}
