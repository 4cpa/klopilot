import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
export class SearchController {
  @Get()
  @ApiQuery({ name: 'q', type: String })
  @ApiQuery({ name: 'lng', type: Number, required: false })
  @ApiQuery({ name: 'lat', type: Number, required: false })
  search(@Query('q') q: string) {
    // TODO P1: Meilisearch-Client anbinden
    return { q, results: [] };
  }
}
