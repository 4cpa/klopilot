import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly svc: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Neuen API-Key erstellen' })
  create(@Body() body: { name: string }, @CurrentUser() user: { userId: string }) {
    return this.svc.create(user.userId, body.name ?? 'Mein Key');
  }

  @Get()
  @ApiOperation({ summary: 'Eigene API-Keys auflisten' })
  list(@CurrentUser() user: { userId: string }) {
    return this.svc.listMine(user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'API-Key widerrufen' })
  revoke(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.svc.revoke(id, user.userId);
  }
}
