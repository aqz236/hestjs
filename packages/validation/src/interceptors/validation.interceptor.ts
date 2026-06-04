import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Interceptor,
} from "@hestjs/core";
import { ValidationException, ValidationPipe } from "../pipes/validation.pipe";

/**
 * 参数验证元数据键
 */
const PARAMETER_VALIDATION_KEY = Symbol("parameter:validation");

/**
 * 参数验证元数据
 */
export interface ParameterValidationMetadata {
  index: number;
  dtoClass: new () => any;
}

/**
 * Body 验证装饰器
 */
export function Body<T>(dtoClass: new () => T) {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const existingMetadata: ParameterValidationMetadata[] =
      Reflect.getMetadata(PARAMETER_VALIDATION_KEY, target, propertyKey!) || [];

    existingMetadata.push({
      index: parameterIndex,
      dtoClass,
    });

    Reflect.defineMetadata(
      PARAMETER_VALIDATION_KEY,
      existingMetadata,
      target,
      propertyKey!
    );

    // console.log('🔍 Body装饰器: 已存储验证元数据', {
    //   target: target.constructor.name,
    //   method: String(propertyKey),
    //   parameterIndex,
    //   dtoClass: dtoClass.name
    // });
  };
}

/**
 * Query 验证装饰器
 */
export function Query<T>(dtoClass: new () => T) {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const existingMetadata: ParameterValidationMetadata[] =
      Reflect.getMetadata(PARAMETER_VALIDATION_KEY, target, propertyKey!) || [];

    existingMetadata.push({
      index: parameterIndex,
      dtoClass,
    });

    Reflect.defineMetadata(
      PARAMETER_VALIDATION_KEY,
      existingMetadata,
      target,
      propertyKey!
    );

    // console.log('🔍 Query装饰器: 已存储验证元数据', {
    //   target: target.constructor.name,
    //   method: String(propertyKey),
    //   parameterIndex,
    //   dtoClass: dtoClass.name
    // });
  };
}

/**
 * 验证拦截器
 */
@Injectable()
export class ValidationInterceptor implements Interceptor {
  private readonly validationPipe: ValidationPipe;

  constructor() {
    this.validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const handler = context.getHandler();
    const target = context.getClass();

    // console.log('🔍 ValidationInterceptor: 开始验证', handler.name);
    // console.log('🔍 ValidationInterceptor: context 类型:', typeof context);
    // console.log('🔍 ValidationInterceptor: context 键:', Object.keys(context));

    // 尝试获取原始的 Hono Context
    const honoContext = (context as any).context || request;
    // console.log('🔍 ValidationInterceptor: honoContext 类型:', typeof honoContext);

    // 获取参数验证元数据
    const paramValidations: ParameterValidationMetadata[] =
      Reflect.getMetadata(
        PARAMETER_VALIDATION_KEY,
        target.prototype,
        handler.name
      ) || [];

    // console.log('🔍 ValidationInterceptor: 找到参数验证数量:', paramValidations.length);
    // console.log('🔍 ValidationInterceptor: 检查目标:', target.name, '方法:', handler.name);
    // console.log('🔍 ValidationInterceptor: 尝试读取元数据键:', PARAMETER_VALIDATION_KEY.toString());

    if (paramValidations.length === 0) {
      // console.log('🔍 ValidationInterceptor: 没有找到验证元数据，跳过验证');
      return next.handle();
    }

    try {
      // 验证请求体和查询参数
      for (const validation of paramValidations) {
        const { dtoClass } = validation;

        // console.log('🔍 ValidationInterceptor: 验证 DTO 类:', dtoClass.name);

        // 获取请求数据 - 优先使用 Hono Context
        const body = await this.getRequestBody(honoContext);

        // console.log('🔍 ValidationInterceptor: 请求体数据:', body);

        if (body && Object.keys(body).length > 0) {
          // 进行验证
          // console.log('🔍 ValidationInterceptor: 开始验证数据');
          const validatedData = await this.validationPipe.validate(
            dtoClass,
            body
          );
          // console.log('🔍 ValidationInterceptor: 验证通过，数据:', validatedData);

          // 将验证后的数据存储到请求中
          (honoContext as any).validatedBody = validatedData;
        } else {
          // console.log('🔍 ValidationInterceptor: 请求体为空，跳过验证');
        }
      }

      return next.handle();
    } catch (error) {
      // console.log("🔍 ValidationInterceptor: 验证失败:", error);
      if (error instanceof ValidationException) {
        // 抛出 HTTP 异常
        const validationError = new Error("Validation failed");
        (validationError as any).status = 400;
        (validationError as any).details = {
          message: "Validation failed",
          errors: error.getMessages(),
          statusCode: 400,
        };
        throw validationError;
      }
      throw error;
    }
  }

  /**
   * 获取请求体数据
   */
  private async getRequestBody(request: any): Promise<any> {
    try {
      // console.log('🔍 getRequestBody: 检查请求对象类型:', typeof request);
      // console.log('🔍 getRequestBody: 请求对象键:', Object.keys(request || {}));

      // 检查是否是 Hono Context
      if (request && request.req) {
        // console.log('🔍 getRequestBody: 检测到 Hono Context，使用 req.json()');
        const body = await request.req.json();
        // console.log('🔍 getRequestBody: 从 Hono Context 获取到的数据:', body);
        return body;
      }

      // 直接尝试调用 json 方法
      if (request && typeof request.json === "function") {
        // console.log('🔍 getRequestBody: 使用 request.json()');
        const body = await request.json();
        // console.log('🔍 getRequestBody: 从 request.json() 获取到的数据:', body);
        return body;
      }

      // 如果已经解析过了，直接返回
      if (request && request.body) {
        // console.log('🔍 getRequestBody: 使用已解析的 body:', request.body);
        return request.body;
      }

      // console.log('🔍 getRequestBody: 无法获取请求体，返回空对象');
      return {};
    } catch (error) {
      // console.log('🔍 getRequestBody: 获取请求体时出错:', error);
      return {};
    }
  }
}
