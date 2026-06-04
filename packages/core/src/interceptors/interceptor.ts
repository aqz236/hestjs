import { createLogger } from "@hestjs/logger";
import type { Context } from "hono";
import { Injectable } from "../decorators/injectable";

const log = createLogger("HestInterceptor");

/**
 * 可观察对象接口（简化版）
 */
export interface Observable<T> {
  subscribe(observer: (value: T) => void): void;
}

/**
 * 执行上下文接口
 */
export interface ExecutionContext {
  getClass(): any;
  getHandler(): any;
  getArgs(): any[];
  getArgByIndex<T = any>(index: number): T;
  switchToHttp(): HttpArgumentsHost;
}

/**
 * HTTP 参数宿主接口
 */
export interface HttpArgumentsHost {
  getRequest(): any;
  getResponse(): any;
  getNext?(): any;
}

/**
 * 调用处理器接口
 */
export interface CallHandler<T = any> {
  handle(): Observable<T> | Promise<T>;
}

/**
 * 拦截器接口
 */
export interface Interceptor<T = any, R = any> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<R> | Promise<Observable<R>> | Promise<R>;
}

/**
 * 默认执行上下文实现
 */
export class DefaultExecutionContext implements ExecutionContext {
  constructor(
    private readonly classRef: any,
    private readonly handler: any,
    private readonly args: any[],
    private readonly httpContext: Context
  ) {}

  getClass(): any {
    return this.classRef;
  }

  getHandler(): any {
    return this.handler;
  }

  getArgs(): any[] {
    return this.args;
  }

  getArgByIndex<T = any>(index: number): T {
    return this.args[index];
  }

  switchToHttp(): HttpArgumentsHost {
    return {
      getRequest: () => this.httpContext.req,
      getResponse: () => this.httpContext,
    };
  }
}

/**
 * 默认调用处理器实现
 */
export class DefaultCallHandler<T = any> implements CallHandler<T> {
  constructor(private readonly handler: () => Promise<T> | T) {}

  async handle(): Promise<T> {
    return await this.handler();
  }
}

/**
 * 简单的 Observable 实现
 */
export class SimpleObservable<T> implements Observable<T> {
  constructor(private readonly promise: Promise<T>) {}

  subscribe(observer: (value: T) => void): void {
    this.promise.then(observer).catch(console.error);
  }

  static from<T>(promise: Promise<T>): SimpleObservable<T> {
    return new SimpleObservable(promise);
  }
}

/**
 * 响应拦截器示例
 */
@Injectable()
export class ResponseInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const start = Date.now();
    const result = await next.handle();
    const duration = Date.now() - start;

    // 包装响应
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    };
  }
}

/**
 * 日志拦截器示例
 */
@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    try {
      const result = await next.handle();
      const duration = Date.now() - startTime;
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(
        `📝 [${new Date().toISOString()}] ${request.method} ${request.url} - ${duration}ms - ERROR:`,
        error
      );
      throw error;
    }
  }
}
