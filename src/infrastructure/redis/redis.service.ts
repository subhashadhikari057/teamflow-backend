import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { redisConfig } from '../../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private readonly client: RedisClientType = createClient({
    url: redisConfig.url,
    socket: {
      host: redisConfig.host,
      port: redisConfig.port,
    },
  });

  constructor() {
    this.client.on('error', (error) => {
      this.logger.error(`Redis client error: ${error.message}`);
    });
  }

  async onModuleInit() {
    if (this.client.isOpen) {
      return;
    }

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (!this.client.isOpen) {
      return;
    }

    await this.client.quit();
  }

  getClient() {
    return this.client;
  }
}
