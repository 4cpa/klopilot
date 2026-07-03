import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminUsersService, UpdateRoleSchema, BanUserSchema } from './admin-users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('q') q: string | undefined,
    @Query('role') role: string | undefined,
    @Query('status') status: string | undefined,
  ) {
    return this.adminUsers.list(page, limit, q, role, status);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: { userId: string },
  ) {
    const dto = UpdateRoleSchema.parse(body);
    return this.adminUsers.updateRole(id, dto, user.userId);
  }

  @Patch(':id/ban')
  ban(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: { userId: string }) {
    const dto = BanUserSchema.parse(body);
    return this.adminUsers.ban(id, dto, user.userId);
  }

  @Patch(':id/unban')
  unban(@Param('id') id: string) {
    return this.adminUsers.unban(id);
  }

  @Delete(':id')
  anonymize(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.adminUsers.anonymize(id, user.userId);
  }
}
