import type { Context, Next } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { logger } from '@hestjs/logger';

/**
 * Hono 异常处理中间件
 */
export const exceptionMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string; error?: string; stack?: string };
    const statusCode = err.status || 500;
    
    const validStatus: StatusCode = (statusCode >= 100 && statusCode < 600) 
      ? statusCode as StatusCode 
      : 500;
    
    const response = {
      statusCode: validStatus,
      timestamp: new Date().toISOString(),
      path: c.req.url,
      message: err.message || 'Internal Server Error',
      error: err.error || 'Exception',
    };

    logger.error(`🔥 HTTP Exception [${validStatus}]: ${err.message}`, {
      requestUrl: c.req.url,
      stack: err.stack,
    });

    c.status(validStatus);
    return c.json(response);
  }
};

/**
 * 响应包装中间件
 */
export const responseMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  
  await next();
  
  // 跳过文档相关的路径
  if (c.req.path === '/openapi.json' || c.req.path === '/docs' || c.req.path.startsWith('/api-docs')) {
    return;
  }
  
  // 只包装JSON响应，且响应状态为2xx
  const contentType = c.res.headers.get('content-type');
  if (contentType?.includes('application/json') && c.res.status >= 200 && c.res.status < 300) {
    try {
      const duration = Date.now() - start;
      
      // 克隆响应以避免消耗原始响应体
      const responseClone = c.res.clone();
      const originalResponse = await responseClone.json();
      
      const wrappedResponse = {
        success: true,
        data: originalResponse,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      };
      
      return c.json(wrappedResponse);
    } catch (error) {
      // 如果无法解析JSON，就保持原响应
      console.warn('Failed to wrap response:', error);
    }
  }
};
