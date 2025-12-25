import type {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
} from '@hestjs/core';
import { createLogger } from '@hestjs/core';

const logger = createLogger('HttpExceptionFilter');

/**
 * 自定义 HTTP 异常过滤器
 */
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.getContext();
    const request = host.getRequest();

    const status = exception.status;
    const response = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
      error: exception.error || 'Http Exception',
    };

    logger.error(`🔥 HTTP Exception [${status}]: ${exception.message}`, {
      requestUrl: request.url,
      stack: exception.stack,
    });

    return ctx.json(response, status);
  }
}
