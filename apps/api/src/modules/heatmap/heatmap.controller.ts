import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';

interface Cell {
  lng: number;
  lat: number;
  cellW: number;
  cellH: number;
  count: number;
}

@ApiTags('heatmap')
@Controller('heatmap')
export class HeatmapController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Toiletten-Dichte-Raster für Heatmap ("Toiletten-Wüsten")' })
  @ApiQuery({ name: 'minLng', type: Number })
  @ApiQuery({ name: 'minLat', type: Number })
  @ApiQuery({ name: 'maxLng', type: Number })
  @ApiQuery({ name: 'maxLat', type: Number })
  @ApiQuery({
    name: 'grid',
    type: Number,
    required: false,
    description: 'Rastergrösse (Standard: 8)',
  })
  async heatmap(
    @Query('minLng') minLng: string,
    @Query('minLat') minLat: string,
    @Query('maxLng') maxLng: string,
    @Query('maxLat') maxLat: string,
    @Query('grid') grid = '8',
  ): Promise<{ cells: Cell[] }> {
    const mn_lng = parseFloat(minLng);
    const mn_lat = parseFloat(minLat);
    const mx_lng = parseFloat(maxLng);
    const mx_lat = parseFloat(maxLat);
    const g = Math.min(Math.max(parseInt(grid, 10), 4), 16);

    if (isNaN(mn_lng) || isNaN(mn_lat) || isNaN(mx_lng) || isNaN(mx_lat)) {
      return { cells: [] };
    }

    const cellW = (mx_lng - mn_lng) / g;
    const cellH = (mx_lat - mn_lat) / g;

    // Toiletten im Bereich abfragen (kein PostGIS nötig — einfache numerische Spalten)
    const toilets = await this.prisma.toilet.findMany({
      where: {
        longitude: { gte: mn_lng, lte: mx_lng },
        latitude: { gte: mn_lat, lte: mx_lat },
        status: 'active',
        visibility: { not: 'private' },
      },
      select: { longitude: true, latitude: true },
    });

    // Zellen zählen
    const countGrid = new Map<string, number>();
    for (const t of toilets) {
      const col = Math.min(Math.floor((t.longitude - mn_lng) / cellW), g - 1);
      const row = Math.min(Math.floor((t.latitude - mn_lat) / cellH), g - 1);
      const key = `${col}:${row}`;
      countGrid.set(key, (countGrid.get(key) ?? 0) + 1);
    }

    // Alle Zellen ausgeben (auch leere)
    const cells: Cell[] = [];
    for (let col = 0; col < g; col++) {
      for (let row = 0; row < g; row++) {
        const count = countGrid.get(`${col}:${row}`) ?? 0;
        cells.push({
          lng: mn_lng + col * cellW + cellW / 2,
          lat: mn_lat + row * cellH + cellH / 2,
          cellW,
          cellH,
          count,
        });
      }
    }

    return { cells };
  }
}
