import { HestFactory } from '@hestjs/core';
import { logger } from '@hestjs/logger';
import '@hestjs/scalar'; // 导入 scalar 扩展（注册 useScalar / useSwagger）
import { ValidationInterceptor } from '@hestjs/validation';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  try {
    logger.info('🚀 Starting HestJS application...');

    // HestJS 不再自己创建 Hono 实例，由调用方传入，
    // 因此可以直接使用 Hono 的全部原生能力。
    const hono = new Hono();

    const app = await HestFactory.create(hono, AppModule);

    // 原生 Hono 中间件
    app.getHonoInstance().use(cors());
    // app.getHonoInstance().use('*', log());

    // 全局拦截器：验证拦截器必须在响应拦截器之前，
    // 这样 DTO 校验失败时不会被响应包装吞掉。
    app.useGlobalInterceptors(new ValidationInterceptor());
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // OpenAPI 规范端点 + Scalar UI，控制器由容器自动发现
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
        theme: 'elysia',
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
      fetch: app.getHonoInstance().fetch,
      reusePort: true, // 启用端口复用
    });
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
