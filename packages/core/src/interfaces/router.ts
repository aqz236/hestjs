import type { HestContext } from './application';
import type { RouteMetadata, ParameterMetadata, ControllerMetadata } from './metadata';

/**
 * 控制器构造器类型
 */
export interface ControllerConstructor {
  new (...args: any[]): any;
  name: string;
}

/**
 * 控制器实例类型
 */
export interface ControllerInstance {
  [methodName: string]: (...args: any[]) => any;
}

/**
 * 路由处理器类型
 */
export type RouteHandler = (c: HestContext) => Promise<any>;

/**
 * HTTP 方法类型
 */
export type HttpMethodLowercase = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

/**
 * 增强的路由元数据，包含控制器信息
 */
export interface EnhancedRouteMetadata extends RouteMetadata {
  controllerPath: string;
  fullPath: string;
  controllerInstance: ControllerInstance;
  parameterMetadata: ParameterMetadata[];
}

/**
 * 参数解析结果
 */
export interface ParameterResolutionResult {
  args: any[];
  errors?: ParameterError[];
}

/**
 * 参数错误
 */
export interface ParameterError {
  parameterIndex: number;
  parameterType: string;
  error: string;
}
