import { Hono } from "hono";
import { Container } from "../container/container";
import type { ExceptionFilter } from "../exceptions/exception-filter";
import type { Interceptor } from "../interceptors/interceptor";
import type { HestApplication } from "../interfaces/application";

/**
 * HestJS 应用实例
 *
 * 设计约定：
 * - 底层 Hono 实例由调用方创建并传入，通过 `getHonoInstance()` 取回，
 *   因此可以直接使用 Hono 的全部原生能力（中间件、路由、onError 等）。
 * - 拦截器与异常过滤器是「面向方法」的横切能力：它们能拿到
 *   `getClass()` / `getHandler()`，因此可以基于 controller 方法上的
 *   参数装饰器元数据工作（例如 `@Body(UserDto)` 的 DTO 校验）。
 *   这是 Hono 中间件无法替代的部分——中间件只知道路径，不知道即将
 *   执行的是哪个方法。
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
  getHonoInstance(): Hono {
    return this.app;
  }

  /**
   * 获取 DI 容器
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * 注册全局异常过滤器（按注册顺序匹配）
   */
  useGlobalFilters(...filters: ExceptionFilter[]): void {
    this.globalFilters.push(...filters);
  }

  /**
   * 注册全局拦截器（按注册顺序执行，后注册的更靠近方法调用）
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
