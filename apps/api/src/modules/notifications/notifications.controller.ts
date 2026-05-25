import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Patch('token')
  async registerToken(@Request() req: any, @Body() body: { token: string }) {
    await this.svc.registerToken(req.user.sub, body.token);
    return { ok: true };
  }
}
