import { Hono } from "hono";
import { Container } from "../container/container";
import type { ExceptionFilter } from "../exceptions/exception-filter";
import type { Interceptor } from "../interceptors/interceptor";
import type { HestApplication } from "../interfaces/application";

/**
 * HestJS 应用实例
 */
export class HestApplicationInstance implements HestApplication {
  private readonly app: Hono;
  private readonly container: Container;
  private globalFilters: ExceptionFilter[] = [];
  private globalInterceptors: Interceptor[] = [];

  constructor(app: Hono, container: Container) {
    this.app = app;
    this.container = container;
  }

  /**
   * 获取底层 Hono 实例
   */
  hono(): Hono {
    return this.app;
  }

  /**
   * 获取 DI 容器
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * 使用全局异常过滤器
   */
  useGlobalFilters(...filters: ExceptionFilter[]): void {
    this.globalFilters.push(...filters);
  }

  /**
   * 使用全局拦截器
   */
  useGlobalInterceptors(...interceptors: Interceptor[]): void {
    this.globalInterceptors.push(...interceptors);
  }

  /**
   * 获取全局异常过滤器
   */
  getGlobalFilters(): ExceptionFilter[] {
    return this.globalFilters;
  }

  /**
   * 获取全局拦截器
   */
  getGlobalInterceptors(): Interceptor[] {
    return this.globalInterceptors;
  }
}
