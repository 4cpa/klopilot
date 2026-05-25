import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RatingsService, RatingInputSchema } from './ratings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ratings')
@Controller('toilets/:toiletId/ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  // PUT /toilets/:toiletId/ratings  (upsert — eine pro User)
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  upsert(
    @Param('toiletId') toiletId: string,
    @Body() body: unknown,
    @CurrentUser() user: { userId: string },
  ) {
    const input = RatingInputSchema.parse(body);
    return this.ratings.upsert(toiletId, user.userId, input);
  }

  // GET /toilets/:toiletId/ratings?page=&limit=
  @Get()
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findByToilet(
    @Param('toiletId') toiletId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.ratings.findByToilet(toiletId, +page, Math.min(+limit, 100));
  }

  // GET /toilets/:toiletId/ratings/mine
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findMine(@Param('toiletId') toiletId: string, @CurrentUser() user: { userId: string }) {
    return this.ratings.findMine(toiletId, user.userId);
  }

  // DELETE /toilets/:toiletId/ratings/mine
  @Delete('mine')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('toiletId') toiletId: string, @CurrentUser() user: { userId: string }) {
    return this.ratings.remove(toiletId, user.userId);
  }
}
