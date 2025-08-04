import type { Context, Env } from "hono";

/**
 * 应用上下文 - 兼容 Hono Context，提供类型安全
 */
export type HestContext<E extends Env = Env> = Context<E>;

/**
 * 应用实例接口
 */
export interface HestApplication {
  /**
   * 获取底层 Hono 实例
   */
  hono(): any;
}

/**
 * HTTP 适配器接口
 */
export interface HttpAdapter {
  listen(port: number, callback?: () => void): void;
  close(): void;
  getType(): string;
  getInstance(): any;
}
