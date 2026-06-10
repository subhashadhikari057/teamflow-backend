import './env.config';

export const appConfig = {
  apiPrefix: 'api',
  docs: {
    adminPath: 'api-docs',
    mobilePath: 'mobile-docs',
  },
  port: Number(process.env.PORT) || 5001,
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL?.trim() || 'http://localhost:3000',
} as const;
