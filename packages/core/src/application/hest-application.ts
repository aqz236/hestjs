import { Hono } from "hono";
import { Container } from "../container/container";
import type { HestApplication } from "../interfaces/application";

/**
 * HestJS 应用实例
 */
export class HestApplicationInstance implements HestApplication {
  private readonly app: Hono;
  private readonly container: Container;

  constructor(app: Hono, container: Container) {
    this.app = app;
    this.container = container;
  }

  /**
   * 获取 DI 容器
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * 获取底层 Hono 实例 (内部使用)
   * @internal
   */
  getHonoInstance(): Hono {
    return this.app;
  }
}
