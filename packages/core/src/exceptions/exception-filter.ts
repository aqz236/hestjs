import type { Context } from "hono";
import { BaseException } from "./base-exception";
import { HttpException } from "./http-exception";

/**
 * 异常过滤器接口
 */
export interface ExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}

/**
 * 参数宿主接口
 */
export interface ArgumentsHost {
  getContext(): Context;
  getRequest(): any;
  getResponse(): any;
}

/**
 * 默认参数宿主实现
 */
export class DefaultArgumentsHost implements ArgumentsHost {
  constructor(private readonly context: Context) {}

  getContext(): Context {
    return this.context;
  }

  getRequest(): any {
    return this.context.req;
  }

  getResponse(): any {
    return this.context;
  }
}

/**
 * 默认全局异常过滤器
 */
export class DefaultExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.getContext();
    const request = host.getRequest();

    let status = 500;
    let response: any = {
      statusCode: 500,
      message: "Internal server error",
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof BaseException) {
      status = exception.status;
      response = exception.getResponse();
      response.path = request.url;
    } else if (exception instanceof Error) {
      response.message = exception.message;
      response.stack = exception.stack;
    }

    // 记录错误日志
    console.error(`Exception caught: ${exception.message}`, exception.stack);

    return ctx.json(response, status as any);
  }
}

/**
 * HTTP 异常过滤器
 */
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): any {
    const ctx = host.getContext();
    const request = host.getRequest();

    const status = exception.status;
    const response = {
      ...exception.getResponse(),
      path: request.url,
    };

    return ctx.json(response, status as any);
  }
}
