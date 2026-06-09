import './env.config';

export const databaseConfig = {
  host: process.env.DB_HOST?.trim() || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  name: process.env.DB_NAME?.trim() || '',
  user: process.env.DB_USER?.trim() || '',
  password: process.env.DB_PASSWORD?.trim() || '',
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
} as const;
