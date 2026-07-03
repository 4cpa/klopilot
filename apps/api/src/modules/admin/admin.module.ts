import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminDataService } from './admin-data.service';
import { AdminDataController } from './admin-data.controller';

@Module({
  providers: [AdminUsersService, AdminDataService],
  controllers: [AdminUsersController, AdminDataController],
})
export class AdminModule {}
