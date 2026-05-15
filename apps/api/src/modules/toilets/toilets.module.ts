import { Module } from '@nestjs/common';
import { ToiletsService } from './toilets.service';
import { ToiletsController } from './toilets.controller';

@Module({
  providers: [ToiletsService],
  controllers: [ToiletsController],
  exports: [ToiletsService],
})
export class ToiletsModule {}
