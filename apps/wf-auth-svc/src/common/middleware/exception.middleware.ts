import { createLogger } from '@hestjs/core';
import type { Context, Next } from 'hono';

const logger = createLogger('ExceptionMiddleware');

/**
 * Hono 异常处理中间件
 * 替代原来的全局异常过滤器
 */
export const exceptionMiddleware = async (c: Context, next: Next) => {
  logger.info('HestJS ExceptionMiddleware');
  try {
    await next();
  } catch (error: any) {
    const status = error.status || 500;
    const response = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: c.req.url,
      message: error.message || 'Internal Server Error',
      error: error.error || 'Exception',
    };

    logger.error(`🔥 HTTP Exception [${status}]: ${error.message}`, {
      requestUrl: c.req.url,
      stack: error.stack,
    });

    return c.json(response, status);
  }
};

export const middlewareTest = async (c: Context, next: Next) => {
  logger.info('middlewareTest!!!');
  try {
    await next();
  } catch (error: any) {
    const status = error.status || 500;
    const response = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: c.req.url,
      message: error.message || 'Internal Server Error',
      error: error.error || 'Exception',
    };

    logger.error(`🔥 HTTP Exception [${status}]: ${error.message}`, {
      requestUrl: c.req.url,
      stack: error.stack,
    });

    return c.json(response, status);
  }
};
