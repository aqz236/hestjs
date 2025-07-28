import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import { ValidationInterceptor } from '@hestjs/validation';
import { cors } from 'hono/cors';
import { logger as log } from 'hono/logger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    const app = await HestFactory.create(AppModule);
    app.hono().use(cors()); // 使用 Hono 的 CORS 中间件
    app.hono().use('*', log()); // 使用 Hono 的日志中间件

    // 全局拦截器 - 验证拦截器应该在响应拦截器之前
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    const server = Bun.serve({
      port: 3002,
      fetch: app.hono().fetch,
      reusePort: true, // 启用端口复用
    });

    logger.info(`🎉 Server is running on http://localhost:${server.port}`);
  } catch (error) {
    logger.error(
      '❌ Failed to start application:',
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error) {
      logger.error('Stack trace:', error.stack);
      // eslint-disable-next-line no-console
      console.error(error);
    }
    process.exit(1);
  }
}

bootstrap();
