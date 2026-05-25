import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { MeilisearchService } from './meilisearch.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly meili: MeilisearchService) {}

  @Get()
  @ApiQuery({ name: 'q', type: String })
  @ApiQuery({ name: 'category', type: String, isArray: true, required: false })
  async search(@Query('q') q: string, @Query('category') category: string | string[] | undefined) {
    const cats = category ? (Array.isArray(category) ? category : [category]) : undefined;
    const docs = await this.meili.search(q ?? '', cats);
    const results = docs.map((d) => ({
      id: d.id,
      name: d.name,
      address: d.address ?? '',
      category: d.category,
      latitude: d._geo.lat,
      longitude: d._geo.lng,
      visibility: 'public' as const,
      status: 'active' as const,
    }));
    return { q, results };
  }
}
