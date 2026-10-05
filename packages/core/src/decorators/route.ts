import { addRoute } from '../metadata';
import { normalizePath } from '../path';
import type { RouteMethod } from '../types';

function methodDecorator(method: RouteMethod) {
  return (path = ''): MethodDecorator =>
    (target, propertyKey) => {
      addRoute(target, { method, path: normalizePath(path), propertyKey });
    };
}

export const Get = methodDecorator('GET');
export const Post = methodDecorator('POST');
export const Put = methodDecorator('PUT');
export const Patch = methodDecorator('PATCH');
export const Delete = methodDecorator('DELETE');
export const Options = methodDecorator('OPTIONS');
export const Head = methodDecorator('HEAD');
/** 匹配该路径上所有方法。 */
export const All = methodDecorator('ALL');

/** 需要 Hono 之外的动词时用它。 */
export function Route(method: RouteMethod, path = ''): MethodDecorator {
  return methodDecorator(method)(path);
}
