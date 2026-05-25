import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ModerationService, CreateReportSchema } from './moderation.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ModerationController {
  constructor(private readonly mod: ModerationService) {}

  // ── Reports ───────────────────────────────────────────────────────────────

  @Post('reports')
  report(@Body() body: unknown, @CurrentUser() user: { userId: string }) {
    const dto = CreateReportSchema.parse(body);
    return this.mod.createReport(user.userId, dto);
  }

  @Get('moderation/queue')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  queue(
    @Query('status') status: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.mod.listQueue(status, page, limit);
  }

  @Patch('moderation/queue/:id')
  updateReport(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.mod.updateStatus(id, status, user.role);
  }

  // ── Photo queue ───────────────────────────────────────────────────────────

  @Get('moderation/photos')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  pendingPhotos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @CurrentUser() _user: { userId: string },
  ) {
    return this.mod.listPendingPhotos(page, limit);
  }

  @Patch('moderation/photos/:id/approve')
  approvePhoto(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
    return this.mod.approvePhoto(id, user.role);
  }

  @Patch('moderation/photos/:id/reject')
  rejectPhoto(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
    return this.mod.rejectPhoto(id, user.role);
  }
}
