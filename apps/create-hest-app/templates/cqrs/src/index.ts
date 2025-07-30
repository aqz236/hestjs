import { HestFactory, logger } from '@hestjs/core';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as log } from 'hono/logger';
import { AppModule } from './app.module';
import { exceptionMiddleware, responseMiddleware } from './common/middleware';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // 创建 Hono 实例
    const hono = new Hono();
    hono.use(cors()); // 使用 Hono 的 CORS 中间件
    hono.use('*', log()); // 使用 Hono 的日志中间件
    hono.use('*', exceptionMiddleware); // 异常处理中间件
    hono.use('*', responseMiddleware); // 响应包装中间件

    await HestFactory.create(hono, AppModule);

    const server = Bun.serve({
      port: 3002,
      fetch: hono.fetch,
      reusePort: true, // 启用端口复用
    });

    logger.info(`🎉 Server is running on http://localhost:${server.port}`);
  } catch (error) {
    // 使用新的简化语法直接传递错误对象
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
