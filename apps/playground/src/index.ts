import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import { ValidationInterceptor } from '@hestjs/validation';
import { cors } from 'hono/cors';
import { logger as log } from 'hono/logger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { appConfig } from './config/app.config';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    const app = await HestFactory.create(AppModule);

    // 配置中间件
    app.hono().use(cors(appConfig.cors)); // 使用 Hono 的 CORS 中间件
    app.hono().use('*', log()); // 使用 Hono 的日志中间件

    // 全局拦截器 - 验证拦截器应该在响应拦截器之前
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    Bun.serve({
      port: appConfig.port,
      fetch: app.hono().fetch,
      reusePort: appConfig.reusePort,
    });

    logger.info(`🚀 Application is running on port ${appConfig.port}`);
    logger.info(`📖 Environment: ${appConfig.nodeEnv}`);
  } catch (error) {
    logger.error('❌ Failed to start application:', String(error));
    process.exit(1);
  }
}

bootstrap();
