import { defineController } from '../metadata';
import { normalizePath } from '../path';
import type { Constructor } from '../types';

/**
 * 标记一个路由控制器。路径会与方法上的 HTTP 装饰器拼接。
 *
 * ```ts
 * @Controller('/users')
 * class UserController {
 *   @Get('/:id')
 *   findOne(c: Context) { ... }
 * }
 * ```
 */
export function Controller(path = ''): ClassDecorator {
  return (target) => {
    defineController(target as unknown as Constructor, normalizePath(path));
  };
}
