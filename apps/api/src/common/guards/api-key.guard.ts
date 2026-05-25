import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '@/modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['x-api-key'];
    if (!key || typeof key !== 'string') throw new UnauthorizedException('X-Api-Key fehlt');
    const valid = await this.apiKeys.validate(key);
    if (!valid) throw new UnauthorizedException('Ungültiger oder gesperrter API-Key');
    return true;
  }
}
