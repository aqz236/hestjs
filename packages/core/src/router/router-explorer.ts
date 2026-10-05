import { createLogger } from "@hestjs/logger";
import { Hono } from "hono";
import { Container } from "../container/container";
import {
  DefaultArgumentsHost,
  DefaultExceptionFilter,
  type ExceptionFilter,
} from "../exceptions/exception-filter";
import {
  DefaultCallHandler,
  DefaultExecutionContext,
  type Interceptor,
} from "../interceptors/interceptor";
import type { HestContext } from "../interfaces/application";
import type {
  ControllerMetadata,
  ParameterMetadata,
  RouteMetadata,
} from "../interfaces/metadata";
import type {
  ControllerConstructor,
  ControllerInstance,
  HttpMethodLowercase,
  ParameterResolutionResult,
  RouteHandler,
} from "../interfaces/router";
import { MetadataScanner } from "../metadata/metadata-scanner";
import { ParamType } from "../utils/constants";

const logger = createLogger("Router");

/**
 * 路由资源管理器
 */
export class RouterExplorer {
  private readonly app: Hono;
  private readonly container: Container;
  private globalFilters: ExceptionFilter[] = [];
  private globalInterceptors: Interceptor[] = [];

  constructor(app: Hono, container: Container) {
    this.app = app;
    this.container = container;
  }

  /**
   * 设置全局异常过滤器
   */
  setGlobalFilters(filters: ExceptionFilter[]): void {
    this.globalFilters = filters;
  }

  /**
   * 设置全局拦截器
   */
  setGlobalInterceptors(interceptors: Interceptor[]): void {
    this.globalInterceptors = interceptors;
  }

  /**
   * 探索并注册控制器路由
   */
  explore(controllers: ControllerConstructor[]): void {
    controllers.forEach((controller) => {
      this.exploreController(controller);
    });
  }

  /**
   * 探索单个控制器
   */
  private exploreController(controllerClass: ControllerConstructor): void {
    const controllerMetadata: ControllerMetadata | undefined =
      MetadataScanner.scanController(controllerClass);
    if (!controllerMetadata) {
      throw new Error(
        `Controller metadata not found for ${controllerClass.name}`
      );
    }

    const routes: RouteMetadata[] = MetadataScanner.scanRoutes(controllerClass);
    const controllerInstance: ControllerInstance =
      this.container.resolve(controllerClass);

    routes.forEach((route) => {
      this.registerRoute(controllerInstance, controllerMetadata.path, route);
    });
  }

  /**
   * 注册单个路由
   */
  private registerRoute(
    controllerInstance: ControllerInstance,
    controllerPath: string,
    route: RouteMetadata
  ): void {
    const fullPath = this.combinePaths(controllerPath, route.path);
    const method: HttpMethodLowercase =
      route.method.toLowerCase() as HttpMethodLowercase;

    // 获取参数元数据
    const paramMetadata: ParameterMetadata[] = MetadataScanner.scanParameters(
      controllerInstance.constructor as ControllerConstructor,
      route.methodName
    );

    // 创建增强的路由处理器（支持拦截器和异常处理）
    const handler: RouteHandler = async (c: HestContext) => {
      try {
        // 创建执行上下文
        const executionContext = new DefaultExecutionContext(
          controllerInstance.constructor,
          { name: route.methodName },
          [],
          c
        );

        // 原始方法执行逻辑
        const executeMethod = async () => {
          const resolutionResult = await this.resolveParameters(
            c,
            paramMetadata
          );
          if (resolutionResult.errors && resolutionResult.errors.length > 0) {
            // 处理参数解析错误
            throw new Error(
              `Parameter resolution failed: ${resolutionResult.errors.map((e) => e.error).join(", ")}`
            );
          }
          return await controllerInstance[route.methodName](
            ...resolutionResult.args
          );
        };

        // 应用拦截器
        let result = await this.applyInterceptors(
          executionContext,
          executeMethod
        );

        // 返回结果
        if (typeof result === "object" && result !== null) {
          return c.json(result);
        } else if (typeof result === "string") {
          return c.text(result);
        } else {
          return c.json({ data: result });
        }
      } catch (error) {
        // 应用异常过滤器
        return this.handleException(error, c);
      }
    };

    // 注册到 Hono
    switch (method) {
      case "get":
        this.app.get(fullPath, handler);
        break;
      case "post":
        this.app.post(fullPath, handler);
        break;
      case "put":
        this.app.put(fullPath, handler);
        break;
      case "delete":
        this.app.delete(fullPath, handler);
        break;
      case "patch":
        this.app.patch(fullPath, handler);
        break;
      case "options":
        this.app.options(fullPath, handler);
        break;
      case "head":
        this.app.on(method.toUpperCase(), fullPath, handler);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    logger.info(
      `${getRouteEmoji(route.method, fullPath)} Mapped {${fullPath}, ${route.method}}`
    );
  }

  /**
   * 解析方法参数
   */
  private async resolveParameters(
    c: HestContext,
    paramMetadata: ParameterMetadata[]
  ): Promise<ParameterResolutionResult> {
    const args: any[] = [];
    const errors: Array<{
      parameterIndex: number;
      parameterType: string;
      error: string;
    }> = [];

    // 按参数索引排序
    const sortedParams = paramMetadata.sort((a, b) => a.index - b.index);

    for (const param of sortedParams) {
      let value: any;

      try {
        switch (param.type) {
          case ParamType.BODY:
            try {
              value = await c.req.json();
            } catch {
              value = await c.req.text();
            }
            break;
          case ParamType.PARAM:
            value = param.key ? c.req.param(param.key) : c.req.param();
            break;
          case ParamType.QUERY:
            value = param.key ? c.req.query(param.key) : c.req.query();
            break;
          case ParamType.HEADER:
            value = param.key ? c.req.header(param.key) : c.req.header();
            break;
          case ParamType.REQUEST:
            value = c.req;
            break;
          case ParamType.RESPONSE:
            value = c;
            break;
          case ParamType.CONTEXT:
            value = c;
            break;
          default:
            value = undefined;
        }
      } catch (error) {
        errors.push({
          parameterIndex: param.index,
          parameterType: param.type,
          error:
            error instanceof Error
              ? error.message
              : "Unknown parameter resolution error",
        });
        value = undefined;
      }

      args[param.index] = value;
    }

    return { args, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * 应用拦截器
   */
  private async applyInterceptors(
    context: DefaultExecutionContext,
    handler: () => Promise<any>
  ): Promise<any> {
    if (this.globalInterceptors.length === 0) {
      return await handler();
    }

    // 构建拦截器链
    let index = 0;
    const callNext = async (): Promise<any> => {
      if (index >= this.globalInterceptors.length) {
        return await handler();
      }

      const interceptor = this.globalInterceptors[index++];
      const callHandler = new DefaultCallHandler(callNext);
      return await interceptor.intercept(context, callHandler);
    };

    return await callNext();
  }

  /**
   * 处理异常
   */
  private handleException(error: Error | unknown, context: HestContext): any {
    const argumentsHost = new DefaultArgumentsHost(context);

    // 优先使用全局异常过滤器
    for (const filter of this.globalFilters) {
      try {
        return filter.catch(error, argumentsHost);
      } catch (filterError) {
        console.error("Exception filter error:", filterError);
      }
    }

    // 默认异常处理
    const defaultFilter = new DefaultExceptionFilter();
    return defaultFilter.catch(error, argumentsHost);
  }

  /**
   * 合并路径
   */
  private combinePaths(basePath: string, routePath: string): string {
    const base = basePath.replace(/\/$/, "");
    const route = routePath.replace(/^\//, "");

    if (!route) {
      return base || "/";
    }

    return `${base}/${route}`;
  }
}

// 辅助函数：根据 HTTP 方法和路径返回对应的 Emoji
function getRouteEmoji(method: string, path: string): string {
  // 1. 根据 HTTP 方法选择基础 Emoji
  let emoji: string;
  switch (method.toUpperCase()) {
    case "GET":
      emoji = "🔍"; // 查询
      break;
    case "POST":
      emoji = "📩"; // 创建
      break;
    case "PUT":
    case "PATCH":
      emoji = "✏️"; // 更新
      break;
    case "DELETE":
      emoji = "🗑️"; // 删除
      break;
    default:
      emoji = "🚄"; // 默认（其他方法）
  }

  // 2. 根据路径特征调整 Emoji
  if (path.includes("/auth") || path.includes("/login")) {
    emoji = "🔐"; // 认证相关
  } else if (path.includes("/error")) {
    emoji = "⚠️ "; // 错误路由
  } else if (path.includes(":id")) {
    emoji = "🆔"; // 动态 ID 路由
  }

  return emoji;
}
