import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch,
  Post, Query, UseGuards,
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
  @ApiQuery({ name: 'lng',      type: Number })
  @ApiQuery({ name: 'lat',      type: Number })
  @ApiQuery({ name: 'radius',   type: Number,   required: false })
  @ApiQuery({ name: 'category', type: [String], required: false })
  findNearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius = '1000',
    @Query('category') category?: string | string[],
  ) {
    const cats = category
      ? Array.isArray(category) ? category : [category]
      : [];
    return this.toilets.findNearby(+lng, +lat, Math.min(+radius, 5000), {
      category: cats,
    });
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
  create(
    @Body() body: unknown,
    @CurrentUser() user: { userId: string },
  ) {
    const data = ToiletInputSchema.parse(body);
    return this.toilets.create(data, user.userId);
  }

  // PATCH /toilets/:id
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { userId: string },
  ) {
    const data = ToiletUpdateSchema.parse(body);
    return this.toilets.update(id, data, user.userId);
  }

  // DELETE /toilets/:id  (Soft-Delete → status = hidden)
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.toilets.remove(id, user.userId);
  }
}
