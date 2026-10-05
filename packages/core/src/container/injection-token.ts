/**
 * 注入令牌类型
 */
export type InjectionToken<T = any> =
  | string
  | symbol
  | Function
  | (abstract new (...args: any[]) => T);

/**
 * 预定义的注入令牌
 */
export const INJECTION_TOKENS = {
  HTTP_ADAPTER: Symbol("HttpAdapter"),
  APPLICATION: Symbol("HestApplication"),
  LOGGER: Symbol("Logger"),
  CONFIG: Symbol("Config"),
} as const;
