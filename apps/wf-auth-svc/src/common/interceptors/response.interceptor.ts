import type { CallHandler, ExecutionContext, Interceptor } from '@hestjs/core';
import { createLogger } from '@hestjs/core';

const logger = createLogger('ResponseInterceptor');

/**
 * 响应转换拦截器
 */
export class ResponseInterceptor implements Interceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<{
    success: boolean;
    data: unknown;
    duration: string;
  }> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    const result = await next.handle();

    const duration = Date.now() - startTime;
    logger.info(
      `🚀 Response: ${request.method} ${request.url} - ${duration}ms`,
    );

    return {
      success: true,
      data: result,
      duration: `${duration}ms`,
    };
  }
}
