import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ToiletsModule } from './modules/toilets/toilets.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { MediaModule } from './modules/media/media.module';
import { SearchModule } from './modules/search/search.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { PublicModule } from './modules/public/public.module';
import { HeatmapModule } from './modules/heatmap/heatmap.module';
import { PartnersModule } from './modules/partners/partners.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ToiletsModule,
    RatingsModule,
    MediaModule,
    SearchModule,
    ModerationModule,
    NotificationsModule,
    ApiKeysModule,
    PublicModule,
    HeatmapModule,
    PartnersModule,
  ],
})
export class AppModule {}
