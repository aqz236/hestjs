import 'reflect-metadata';
import type { MiddlewareHandler } from 'hono';
import { METADATA_KEYS } from '../utils/constants';

/**
 * 可注册的中间件类型（即 Hono 的 MiddlewareHandler）
 */
export type HestMiddleware = MiddlewareHandler;

/**
 * 方法级中间件的元数据键
 *
 * 与参数装饰器（@Body / @Param）采用同一约定：以「基键_方法名」区分，
 * 这样同一个类上不同方法的中间件互不干扰。
 */
export function middlewareMetadataKey(methodName: string): string {
  return `${METADATA_KEYS.MIDDLEWARE.toString()}_${methodName}`;
}

/**
 * 中间件装饰器
 *
 * 可用于控制器类或控制器方法：
 *
 * ```typescript
 * @Controller('/users')
 * @UseMiddleware(requestIdMiddleware)          // 类级：该控制器所有路由先执行
 * export class UsersController {
 *   @Get('/:id')
 *   @UseMiddleware(authMiddleware)            // 方法级：紧随类级之后
 *   findOne(@Param('id') id: string) {}
 * }
 * ```
 *
 * 执行顺序为 **类级 → 方法级 → 拦截器 → controller 方法**，
 * 因此中间件里 `await next()` 之后的代码会在拦截器与控制器之后执行。
 */
export function UseMiddleware(
  ...middlewares: HestMiddleware[]
): ClassDecorator & MethodDecorator {
  return ((target: any, propertyKey?: string | symbol) => {
    const isMethodLevel = propertyKey !== undefined;
    const classRef = isMethodLevel ? target.constructor : target;
    const key = isMethodLevel
      ? middlewareMetadataKey(String(propertyKey))
      : METADATA_KEYS.MIDDLEWARE;

    const existing: HestMiddleware[] = Reflect.getMetadata(key, classRef) ?? [];

    Reflect.defineMetadata(key, [...existing, ...middlewares], classRef);
  }) as ClassDecorator & MethodDecorator;
}
