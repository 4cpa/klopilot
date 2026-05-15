import {
  Body, Controller, Get, Param, Post, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ToiletsService, ToiletInputSchema } from './toilets.service';

@ApiTags('toilets')
@Controller('toilets')
export class ToiletsController {
  constructor(private readonly toilets: ToiletsService) {}

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
    const categories = category
      ? Array.isArray(category) ? category : [category]
      : [];
    return this.toilets.findNearby(+lng, +lat, Math.min(+radius, 5000), {
      category: categories,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toilets.findByIdOrFail(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@Body() body: unknown, @Request() req: any) {
    const data = ToiletInputSchema.parse(body);
    return this.toilets.create(data, req.user.userId);
  }
}
