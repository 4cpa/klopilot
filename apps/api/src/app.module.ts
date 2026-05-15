import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ToiletsModule } from './modules/toilets/toilets.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { MediaModule } from './modules/media/media.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // .env liegt im Repo-Root, zwei Ebenen über apps/api
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 60 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ToiletsModule,
    RatingsModule,
    MediaModule,
    SearchModule,
  ],
})
export class AppModule {}
