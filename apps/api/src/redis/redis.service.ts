import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super(config.getOrThrow('REDIS_URL'));
  }

  onModuleInit() {
    // ioredis verbindet lazy — kein explizites connect nötig
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
