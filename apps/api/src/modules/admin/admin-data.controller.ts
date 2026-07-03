import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';
import { AdminDataService } from './admin-data.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

@ApiTags('admin-data')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('admin/data')
export class AdminDataController {
  constructor(private readonly adminData: AdminDataService) {}

  @Get('stats')
  stats() {
    return this.adminData.stats();
  }

  @Get('export/toilets.csv')
  async exportToilets(@Res({ passthrough: true }) reply: FastifyReply) {
    const csv = await this.adminData.exportToiletsCsv();
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="klopilot-toiletten-export.csv"');
    return csv;
  }
}
