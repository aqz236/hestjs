import 'reflect-metadata';
import { METADATA_KEYS, HttpMethod, ParamType } from '../utils/constants';
import type { RouteMetadata, ParameterMetadata } from '../interfaces/metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(key: any, value: any, target: any, propertyKey?: string | symbol): void;
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
  }
}

/**
 * 创建路由装饰器
 */
function createRouteDecorator(method: HttpMethod) {
  return (path = '') => {
    return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): PropertyDescriptor => {
      const metadata: RouteMetadata = {
        method,
        path: path.startsWith('/') ? path : `/${path}`,
        methodName: String(propertyKey),
      };
      
      const existingRoutes: RouteMetadata[] = Reflect.getMetadata(METADATA_KEYS.ROUTE, target.constructor) || [];
      existingRoutes.push(metadata);
      
      Reflect.defineMetadata(METADATA_KEYS.ROUTE, existingRoutes, target.constructor);
      
      return descriptor || {
        value: target[propertyKey],
        writable: true,
        enumerable: true,
        configurable: true,
      };
    };
  };
}

/**
 * GET 请求装饰器
 */
export const Get = createRouteDecorator(HttpMethod.GET);

/**
 * POST 请求装饰器
 */
export const Post = createRouteDecorator(HttpMethod.POST);

/**
 * PUT 请求装饰器
 */
export const Put = createRouteDecorator(HttpMethod.PUT);

/**
 * DELETE 请求装饰器
 */
export const Delete = createRouteDecorator(HttpMethod.DELETE);

/**
 * PATCH 请求装饰器
 */
export const Patch = createRouteDecorator(HttpMethod.PATCH);

/**
 * 创建参数装饰器
 */
function createParamDecorator(type: ParamType) {
  return (key?: string) => {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      if (!propertyKey) return;
      
      const metadata: ParameterMetadata = {
        index: parameterIndex,
        type,
        key,
      };
      
      const paramKey = `${METADATA_KEYS.PARAM.toString()}_${String(propertyKey)}`;
      const existingParams: ParameterMetadata[] = Reflect.getMetadata(paramKey, target.constructor) || [];
      existingParams.push(metadata);
      
      Reflect.defineMetadata(paramKey, existingParams, target.constructor);
    };
  };
}

/**
 * 请求体参数装饰器
 */
export const Body = createParamDecorator(ParamType.BODY);

/**
 * 路径参数装饰器
 */
export const Param = createParamDecorator(ParamType.PARAM);

/**
 * 查询参数装饰器
 */
export const Query = createParamDecorator(ParamType.QUERY);

/**
 * 请求头参数装饰器
 */
export const Header = createParamDecorator(ParamType.HEADER);

/**
 * 完整请求对象装饰器
 */
export const Req = createParamDecorator(ParamType.REQUEST);

/**
 * 响应对象装饰器
 */
export const Res = createParamDecorator(ParamType.RESPONSE);

/**
 * 上下文装饰器 - 获取完整的 Hono Context
 */
export const Context = createParamDecorator(ParamType.CONTEXT);
