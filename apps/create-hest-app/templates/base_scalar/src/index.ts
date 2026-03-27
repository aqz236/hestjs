import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import '@hestjs/scalar'; // 导入scalar扩展
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppModule } from './app.module';
import { exceptionMiddleware, responseMiddleware } from './common/middleware';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // 创建 Hono 实例
    const hono = new Hono();
    hono.use(cors()); // 使用 Hono 的 CORS 中间件
    hono.use('*', exceptionMiddleware); // 使用异常处理中间件替代全局过滤器
    hono.use('*', responseMiddleware); // 使用响应包装中间件替代拦截器
    // hono.use('*', log()); // 使用 Hono 的日志中间件

    const app = await HestFactory.create(hono, AppModule);

    // 设置OpenAPI规范端点
    app.useSwagger(
      {
        info: {
          title: 'HestJS Demo API',
          version: '1.0.0',
          description:
            'A demonstration of HestJS framework capabilities with Scalar API documentation',
        },
        servers: [
          {
            url: 'http://localhost:3002',
            description: 'Development server',
          },
        ],
      },
      {
        path: '/docs',
        theme: 'elysia', // 使用elysia主题
        enableMarkdown: true,
        markdownPath: '/api-docs.md',
      },
    );

    logger.info('📚 API Documentation available at:');
    logger.info('  • Scalar UI: http://localhost:3002/docs');
    logger.info('  • OpenAPI JSON: http://localhost:3002/openapi.json');
    logger.info('  • Markdown (for LLMs): http://localhost:3002/api-docs.md');

    Bun.serve({
      port: 3002,
      fetch: hono.fetch,
      reusePort: true, // 启用端口复用
    });

    logger.info(`🎉 Server is running on http://localhost:3002`);
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
