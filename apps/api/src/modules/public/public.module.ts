import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ToiletsModule } from '../toilets/toilets.module';
import { SearchModule } from '../search/search.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ToiletsModule, SearchModule, ApiKeysModule],
  controllers: [PublicController],
})
export class PublicModule {}
