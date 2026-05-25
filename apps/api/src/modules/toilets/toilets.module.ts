import { Module } from '@nestjs/common';
import { ToiletsService } from './toilets.service';
import { ToiletsController } from './toilets.controller';
import { RatingsModule } from '../ratings/ratings.module';
import { SearchModule } from '../search/search.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RatingsModule, SearchModule, NotificationsModule],
  providers: [ToiletsService],
  controllers: [ToiletsController],
  exports: [ToiletsService],
})
export class ToiletsModule {}
