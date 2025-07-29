import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import '@hestjs/scalar'; // 导入scalar扩展
import { ValidationInterceptor } from '@hestjs/validation';
import { cors } from 'hono/cors';
import { AppController } from './app.controller';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    const app = await HestFactory.create(AppModule);
    app.hono().use(cors()); // 使用 Hono 的 CORS 中间件
    // app.hono().use('*', log()); // 使用 Hono 的日志中间件

    // 全局拦截器 - 验证拦截器应该在响应拦截器之前
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 设置OpenAPI规范端点 - 基于注解生成
    app.useScalarWithControllers(
      [AppController], // 传入需要生成文档的控制器
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
      fetch: app.hono().fetch,
      reusePort: true, // 启用端口复用
    });
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
