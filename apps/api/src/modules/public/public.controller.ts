import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { ToiletsService } from '../toilets/toilets.service';
import { MeilisearchService } from '../search/meilisearch.service';

@ApiTags('Public API v1')
@ApiHeader({
  name: 'X-Api-Key',
  description: 'API-Key (erstellen unter POST /api-keys)',
  required: true,
})
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class PublicController {
  constructor(
    private readonly toilets: ToiletsService,
    private readonly meili: MeilisearchService,
  ) {}

  @Get('toilets')
  @ApiOperation({
    summary: 'Toiletten in der Nähe',
    description: 'Gibt bis zu 200 aktive, öffentliche Toiletten im angegebenen Radius zurück.',
  })
  @ApiQuery({ name: 'lng', type: Number, description: 'Längengrad (GeoJSON-Reihenfolge)' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Breitengrad' })
  @ApiQuery({
    name: 'radius',
    type: Number,
    required: false,
    description: 'Radius in Metern (max. 5000, Standard: 1000)',
  })
  @ApiQuery({
    name: 'category',
    type: [String],
    required: false,
    description: 'Kategoriefilter (mehrfach möglich)',
  })
  @ApiResponse({ status: 200, description: 'Liste der Toiletten mit Score und Distanz' })
  findNearby(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('radius') radius = '1000',
    @Query('category') category?: string | string[],
  ) {
    const cats = category ? (Array.isArray(category) ? category : [category]) : [];
    return this.toilets.findNearby(+lng, +lat, Math.min(+radius, 5000), { category: cats });
  }

  @Get('toilets/:id')
  @ApiOperation({
    summary: 'Toilette nach ID',
    description: 'Gibt eine Toilette mit Score und Fotos zurück.',
  })
  @ApiResponse({ status: 200, description: 'Toilettendetail' })
  @ApiResponse({ status: 404, description: 'Nicht gefunden' })
  findOne(@Param('id') id: string) {
    return this.toilets.findByIdOrFail(id);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Volltextsuche',
    description: 'Suche nach Toiletten per Name oder Adresse (Meilisearch).',
  })
  @ApiQuery({ name: 'q', type: String, description: 'Suchbegriff' })
  @ApiQuery({ name: 'category', type: [String], required: false })
  @ApiResponse({ status: 200, description: 'Suchergebnisse' })
  async search(@Query('q') q = '', @Query('category') category?: string | string[]) {
    const cats = category ? (Array.isArray(category) ? category : [category]) : undefined;
    const docs = await this.meili.search(q, cats);
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
