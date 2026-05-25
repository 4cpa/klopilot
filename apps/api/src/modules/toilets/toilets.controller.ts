import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ToiletsService, ToiletInputSchema, ToiletUpdateSchema } from './toilets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('toilets')
@Controller('toilets')
export class ToiletsController {
  constructor(private readonly toilets: ToiletsService) {}

  // GET /toilets?lng=&lat=&radius=&category=
  @Get()
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'radius', type: Number, required: false })
  @ApiQuery({ name: 'category', type: [String], required: false })
  findNearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius = '1000',
    @Query('category') category?: string | string[],
  ) {
    const cats = category ? (Array.isArray(category) ? category : [category]) : [];
    return this.toilets.findNearby(+lng, +lat, Math.min(+radius, 5000), {
      category: cats,
    });
  }

  // GET /toilets/private  — eigene + eingeladene Privat-Toiletten
  @Get('private')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findPrivate(@CurrentUser() user: { userId: string }) {
    return this.toilets.findPrivate(user.userId);
  }

  // GET /toilets/mine  — alle eigenen Toiletten (unabhängig von Sichtbarkeit)
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findMine(@CurrentUser() user: { userId: string }) {
    return this.toilets.findMine(user.userId);
  }

  // GET /toilets/:id/invites
  @Get(':id/invites')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  listInvites(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.toilets.listInvites(id, user.userId);
  }

  // POST /toilets/:id/invites  { email }
  @Post(':id/invites')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  invite(
    @Param('id') id: string,
    @Body() body: { email: string },
    @CurrentUser() user: { userId: string },
  ) {
    return this.toilets.inviteByEmail(id, user.userId, body.email);
  }

  // DELETE /toilets/:id/invites/:inviteeId
  @Delete(':id/invites/:inviteeId')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removeInvite(
    @Param('id') id: string,
    @Param('inviteeId') inviteeId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.toilets.removeInvite(id, user.userId, inviteeId);
  }

  // GET /toilets/:id
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('__uid') uid?: string, // optionaler userId-Hint für private Toiletten ohne JWT
  ) {
    return this.toilets.findByIdOrFail(id, uid);
  }

  // POST /toilets
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@Body() body: unknown, @CurrentUser() user: { userId: string }) {
    const data = ToiletInputSchema.parse(body);
    return this.toilets.create(data, user.userId);
  }

  // PATCH /toilets/:id
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: { userId: string }) {
    const data = ToiletUpdateSchema.parse(body);
    return this.toilets.update(id, data, user.userId);
  }

  // PATCH /toilets/:id/verify
  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  verify(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.toilets.setVerified(id, true, user.userId);
  }

  // PATCH /toilets/:id/unverify
  @Patch(':id/unverify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  unverify(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.toilets.setVerified(id, false, user.userId);
  }

  // DELETE /toilets/:id  (Soft-Delete → status = hidden)
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.toilets.remove(id, user.userId);
  }
}
