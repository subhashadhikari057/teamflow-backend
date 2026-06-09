import './env.config';

export const appConfig = {
  apiPrefix: 'api',
  docs: {
    adminPath: 'api-docs',
    mobilePath: 'mobile-docs',
  },
  port: Number(process.env.PORT) || 3000,
} as const;
