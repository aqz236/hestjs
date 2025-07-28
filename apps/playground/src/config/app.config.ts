/**
 * 应用配置
 */
export const appConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  reusePort: true,
} as const;

export type AppConfig = typeof appConfig;
