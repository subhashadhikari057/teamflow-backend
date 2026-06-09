import './env.config';

export const redisConfig = {
  host: process.env.REDIS_HOST?.trim() || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  url: process.env.REDIS_URL?.trim() || '',
  uiUrl: process.env.REDIS_UI_URL?.trim() || '',
} as const;
