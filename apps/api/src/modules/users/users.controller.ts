import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Rangliste (Top-20 nach Punkten)' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  leaderboard(@Query('limit') limit = '20') {
    return this.users.getLeaderboard(Math.min(+limit, 50));
  }

  @Get('me/stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eigene Gamification-Stats' })
  myStats(@CurrentUser() user: { userId: string }) {
    return this.users.getStats(user.userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Stats eines Nutzers' })
  stats(@Param('id') id: string) {
    return this.users.getStats(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Öffentliches Profil eines Nutzers (handle, role)' })
  async publicProfile(@Param('id') id: string) {
    return this.users.getPublicProfile(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.users.findByIdOrFail(id);
  }
}
