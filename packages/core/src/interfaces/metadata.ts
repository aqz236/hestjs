import { HttpMethod } from "../utils/constants";

/**
 * 控制器元数据
 */
export interface ControllerMetadata {
  path: string;
  version?: string;
}

/**
 * 路由元数据
 */
export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  methodName: string;
  parameterMetadata?: ParameterMetadata[];
}

/**
 * 参数元数据
 */
export interface ParameterMetadata {
  index: number;
  type: string;
  key?: string;
  pipes?: any[];
}

/**
 * 模块元数据
 */
export interface ModuleMetadata {
  controllers?: any[];
  providers?: any[];
  imports?: any[];
  exports?: any[];
}

/**
 * 中间件元数据
 */
export interface MiddlewareMetadata {
  path?: string;
  method?: HttpMethod;
}

/**
 * 可注入元数据
 */
export interface InjectableMetadata {
  scope?: "singleton" | "transient" | "request";
}
