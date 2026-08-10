import { Injectable } from "@hestjs/core";
import { Type, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  ClassValidationMetadata,
  VALIDATION_METADATA_KEY,
} from "../decorators/validation";

/**
 * 验证错误
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public constraint: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * 验证异常 - 包含多个验证错误
 */
export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super("Validation failed");
    this.name = "ValidationException";
  }

  getMessages(): string[] {
    return this.errors.map((error) => error.message);
  }

  getFormattedMessage(): string {
    return this.errors
      .map((error) => `${error.field}: ${error.message}`)
      .join("; ");
  }
}

/**
 * 验证管道选项
 */
export interface ValidationPipeOptions {
  whitelist?: boolean; // 是否移除未定义的属性
  forbidNonWhitelisted?: boolean; // 是否禁止非白名单属性
  transform?: boolean; // 是否进行类型转换
  disableErrorMessages?: boolean; // 是否禁用错误消息
  validateCustomDecorators?: boolean; // 是否验证自定义装饰器
}

/**
 * 验证管道
 */
@Injectable()
export class ValidationPipe {
  private readonly options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      disableErrorMessages: false,
      validateCustomDecorators: true,
      ...options,
    };
  }

  /**
   * 验证对象
   */
  async validate<T>(target: new () => T, object: any): Promise<T> {
    if (!object || typeof object !== "object") {
      throw new ValidationException([
        new ValidationError("Invalid input", "root", object, "object"),
      ]);
    }

    const metadata: ClassValidationMetadata = Reflect.getMetadata(
      VALIDATION_METADATA_KEY,
      target
    );

    if (!metadata || !metadata.properties.length) {
      // 如果没有验证元数据，直接返回对象
      return object as T;
    }

    const errors: ValidationError[] = [];

    // 创建 TypeBox 对象 schema
    //
    // 注意：Type.Object 会依据属性列表自行推导 required，**显式传入的
    // required 选项会被忽略**。因此可选字段必须用 Type.Optional 包裹，
    // 否则 @IsOptional() 只是标记了元数据，实际仍会被当作必填
    // （该缺陷曾使 @IsOptional 端到端完全失效）。
    const schemaProperties: Record<string, TSchema> = {};

    for (const prop of metadata.properties) {
      const propName = String(prop.propertyKey);
      schemaProperties[propName] = prop.isOptional
        ? Type.Optional(prop.schema)
        : prop.schema;
    }

    // additionalProperties 必须为 true：多余字段的处理交给 filterProperties。
    // 若按 `!whitelist` 设置，extra 字段会在校验阶段直接失败，
    // 使 whitelist 的语义从「移除」变成「禁止」，forbidNonWhitelisted 也就失去意义。
    const objectSchema = Type.Object(schemaProperties, {
      additionalProperties: true,
    });

    // 使用 TypeBox 进行验证
    const isValid = Value.Check(objectSchema, object);

    if (!isValid) {
      // 获取详细错误
      const validationErrors = [...Value.Errors(objectSchema, object)];

      for (const error of validationErrors) {
        const field = error.path.replace(/^\//, "") || "root";
        const customMessage = this.getCustomMessage(metadata, field);

        errors.push(
          new ValidationError(
            customMessage || error.message,
            field,
            error.value,
            String(error.type || "validation")
          )
        );
      }
    }

    // 自定义断言：TypeBox 无法表达的规则在这里兜底
    for (const prop of metadata.properties) {
      if (!prop.validate) {
        continue;
      }

      const field = String(prop.propertyKey);
      const value = (object as Record<string, unknown>)[field];

      // 缺省交给 required 规则处理，断言只管「有值时是否合法」
      if (value === undefined || value === null) {
        continue;
      }

      if (!prop.validate(value)) {
        errors.push(
          new ValidationError(
            prop.message || `${field} 校验失败`,
            field,
            value,
            'custom'
          )
        );
      }
    }

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // 如果启用了转换，使用 TypeBox 进行类型转换
    if (this.options.transform) {
      try {
        const transformed = Value.Convert(objectSchema, object);
        return this.filterProperties(transformed, metadata) as T;
      } catch (error) {
        // 转换失败，使用原始对象
        return this.filterProperties(object, metadata) as T;
      }
    }

    return this.filterProperties(object, metadata) as T;
  }

  /**
   * 过滤属性（白名单模式）
   */
  private filterProperties(
    object: any,
    metadata: ClassValidationMetadata
  ): any {
    if (!this.options.whitelist) {
      return object;
    }

    const result: any = {};
    const allowedProperties = new Set(
      metadata.properties.map((prop) => String(prop.propertyKey))
    );

    for (const [key, value] of Object.entries(object)) {
      if (allowedProperties.has(key)) {
        result[key] = value;
      } else if (this.options.forbidNonWhitelisted) {
        throw new ValidationException([
          new ValidationError(
            `Property ${key} should not exist`,
            key,
            value,
            "whitelistValidation"
          ),
        ]);
      }
    }

    return result;
  }

  /**
   * 获取自定义错误消息
   */
  private getCustomMessage(
    metadata: ClassValidationMetadata,
    field: string
  ): string | undefined {
    const property = metadata.properties.find(
      (prop) => String(prop.propertyKey) === field
    );
    return property?.message;
  }

  /**
   * 验证单个值
   */
  validateValue<T>(
    schema: TSchema,
    value: any,
    fieldName: string = "value"
  ): T {
    const isValid = Value.Check(schema, value);

    if (!isValid) {
      const errors = [...Value.Errors(schema, value)];
      const validationErrors = errors.map(
        (error) =>
          new ValidationError(
            error.message,
            fieldName,
            error.value,
            String(error.type || "validation")
          )
      );
      throw new ValidationException(validationErrors);
    }

    if (this.options.transform) {
      try {
        return Value.Convert(schema, value) as T;
      } catch {
        return value as T;
      }
    }

    return value as T;
  }

  /**
   * 创建 DTO 验证装饰器
   */
  static createDtoValidator<T>(dtoClass: new () => T) {
    return function (
      target: any,
      _propertyKey: string | symbol,
      parameterIndex: number
    ) {
      // 这里可以存储参数验证元数据
      // 实际的验证会在拦截器中进行
      const existingMetadata =
        Reflect.getMetadata("validation:parameters", target) || {};
      existingMetadata[parameterIndex] = dtoClass;
      Reflect.defineMetadata("validation:parameters", existingMetadata, target);
    };
  }
}
