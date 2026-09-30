import { HestFactory, logger } from '@hestjs/core';
import { ValidationInterceptor } from '@hestjs/validation';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as log } from 'hono/logger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // Hono 实例由调用方创建并传入
    const hono = new Hono();
    const app = await HestFactory.create(hono, AppModule);

    app.getHonoInstance().use(cors()); // 使用 Hono 的 CORS 中间件
    app.getHonoInstance().use('*', log()); // 使用 Hono 的日志中间件

    // 全局拦截器 - 验证拦截器应该在响应拦截器之前
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    const server = Bun.serve({
      port: 3002,
      fetch: app.getHonoInstance().fetch,
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
