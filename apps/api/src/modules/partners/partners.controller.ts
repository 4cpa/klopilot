import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PartnersService, PartnerApplySchema } from './partners.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly svc: PartnersService) {}

  // GET /partners  — alle verifizierten Partner
  @Get()
  @ApiOperation({ summary: 'Verifizierte Partner auflisten' })
  @ApiQuery({
    name: 'all',
    type: Boolean,
    required: false,
    description: 'Auch unverifizierte (Admin)',
  })
  list(@Query('all') all?: string) {
    return this.svc.list(all !== 'true');
  }

  // GET /partners/:id
  @Get(':id')
  @ApiOperation({ summary: 'Partner-Detail mit Toiletten' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  // POST /partners  — Partner-Antrag (öffentlich)
  @Post()
  @ApiOperation({ summary: 'Partner-Antrag stellen' })
  apply(@Body() body: unknown) {
    const data = PartnerApplySchema.parse(body);
    return this.svc.apply(data);
  }

  // PATCH /partners/:id/verify  — Admin verifiziert Partner
  @Patch(':id/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partner verifizieren (Admin/Mod)' })
  verify(@Param('id') id: string, @CurrentUser() user: { role: string }) {
    return this.svc.verify(id, user.role);
  }

  // PATCH /partners/:id/toilets/:toiletId  — Toilette einem Partner zuweisen
  @Patch(':id/toilets/:toiletId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toilette einem Partner zuweisen (Admin/Mod)' })
  assign(
    @Param('id') id: string,
    @Param('toiletId') toiletId: string,
    @CurrentUser() user: { role: string },
  ) {
    return this.svc.assignToToilet(id, toiletId, user.role);
  }
}
