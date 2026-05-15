import { Body, Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RatingsService, RatingInputSchema } from './ratings.service';

@ApiTags('ratings')
@Controller('toilets/:toiletId/ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  upsert(
    @Param('toiletId') toiletId: string,
    @Body() body: unknown,
    @Request() req: any,
  ) {
    const input = RatingInputSchema.parse(body);
    return this.ratings.upsert(toiletId, req.user.userId, input);
  }
}
