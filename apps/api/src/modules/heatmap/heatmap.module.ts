import { Module } from '@nestjs/common';
import { HeatmapController } from './heatmap.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HeatmapController],
})
export class HeatmapModule {}
