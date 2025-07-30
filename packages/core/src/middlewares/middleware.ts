import "reflect-metadata";
import type { MiddlewareMetadata } from "../interfaces/metadata";
import { METADATA_KEYS } from "../utils/constants";

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(
      key: any,
      value: any,
      target: any,
      propertyKey?: string | symbol
    ): void;
    function getMetadata(
      key: any,
      target: any,
      propertyKey?: string | symbol
    ): any;
  }
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  req: any,
  res: any,
  next: () => void
) => void | Promise<void>;

/**
 * 中间件接口
 */
export interface MiddlewareConsumer {
  apply(...middleware: (MiddlewareFunction | any)[]): MiddlewareConsumer;
  forRoutes(...routes: (string | any)[]): MiddlewareConsumer;
  exclude(...routes: (string | any)[]): MiddlewareConsumer;
}

/**
 * 中间件装饰器
 * @param path 中间件应用的路径
 */
export function Middleware(path?: string) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    const metadata: MiddlewareMetadata = {
      path: path || "*",
    };

    if (propertyKey) {
      // 方法级中间件
      Reflect.defineMetadata(
        METADATA_KEYS.MIDDLEWARE,
        metadata,
        target,
        propertyKey
      );
    } else {
      // 类级中间件
      Reflect.defineMetadata(METADATA_KEYS.MIDDLEWARE, metadata, target);
    }

    return descriptor;
  };
}

/**
 * 内置 CORS 中间件
 */
export class CorsMiddleware {
  constructor(private options: any = {}) {}

  use(req: any, res: any, next: () => void) {
    const origin = this.options.origin || "*";
    const methods = this.options.methods || [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ];
    const headers = this.options.allowedHeaders || [
      "Content-Type",
      "Authorization",
    ];

    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", methods.join(", "));
    res.header("Access-Control-Allow-Headers", headers.join(", "));

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  }
}

/**
 * 内置日志中间件
 */
export class LoggerMiddleware {
  use(req: any, res: any, next: () => void) {
    // const start = Date.now();
    // const { method, url } = req;

    // 拦截响应结束
    const originalEnd = res.end;
    res.end = function (chunk: any, encoding: any) {
      // const duration = Date.now() - start;
      // console.log(`📤 ${method} ${url} - ${res.statusCode} - ${duration}ms`);
      originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}
