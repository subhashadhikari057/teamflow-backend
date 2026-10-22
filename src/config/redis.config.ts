import './env.config';

export const redisConfig = {
  host: process.env.REDIS_HOST?.trim() || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  url: process.env.REDIS_URL?.trim() || '',
  uiUrl: process.env.REDIS_UI_URL?.trim() || '',
  defaultTtlSeconds: Number(process.env.REDIS_DEFAULT_TTL_SECONDS) || 900,
} as const;
