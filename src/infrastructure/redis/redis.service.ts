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

  async set(key: string, value: string, ttlSeconds = redisConfig.defaultTtlSeconds) {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async increment(key: string, ttlSeconds = redisConfig.defaultTtlSeconds) {
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
      return { count, ttlSeconds };
    }

    let currentTtl = await this.client.ttl(key);

    if (currentTtl < 0) {
      await this.client.expire(key, ttlSeconds);
      currentTtl = ttlSeconds;
    }

    return { count, ttlSeconds: currentTtl };
  }

  getClient() {
    return this.client;
  }
}
