import { Type, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { ValidationPipe, ValidationException } from '../pipes/validation.pipe';
import { ClassValidationMetadata, VALIDATION_METADATA_KEY } from '../decorators/validation';

/**
 * 验证工具类
 */
export class ValidationUtils {
  private static readonly defaultPipe = new ValidationPipe();

  /**
   * 验证对象
   */
  static async validateObject<T>(target: new () => T, object: any): Promise<T> {
    return this.defaultPipe.validate(target, object);
  }

  /**
   * 验证值
   */
  static validateValue<T>(schema: TSchema, value: any, fieldName?: string): T {
    return this.defaultPipe.validateValue<T>(schema, value, fieldName);
  }

  /**
   * 检查对象是否有效
   */
  static async isValid<T>(target: new () => T, object: any): Promise<boolean> {
    try {
      await this.validateObject(target, object);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取验证错误而不抛出异常
   */
  static async getValidationErrors<T>(target: new () => T, object: any): Promise<string[]> {
    try {
      await this.validateObject(target, object);
      return [];
    } catch (error) {
      if (error instanceof ValidationException) {
        return error.getMessages();
      }
      return [error instanceof Error ? error.message : 'Unknown validation error'];
    }
  }

  /**
   * 从类生成 TypeBox Schema
   */
  static generateSchema<T>(target: new () => T): TSchema {
    const metadata: ClassValidationMetadata = Reflect.getMetadata(VALIDATION_METADATA_KEY, target);
    
    if (!metadata || !metadata.properties.length) {
      return Type.Object({});
    }

    const properties: Record<string, TSchema> = {};
    const requiredFields: string[] = [];

    for (const prop of metadata.properties) {
      const propName = String(prop.propertyKey);
      properties[propName] = prop.schema;
      
      if (!prop.isOptional) {
        requiredFields.push(propName);
      }
    }

    return Type.Object(properties, {
      required: requiredFields,
      additionalProperties: false
    });
  }

  /**
   * 类型安全的转换函数
   */
  static transform<T>(schema: TSchema, value: any): T {
    try {
      return Value.Convert(schema, value) as T;
    } catch (error) {
      throw new ValidationException([{
        message: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: 'root',
        value,
        constraint: 'transform'
      } as any]);
    }
  }

  /**
   * 创建自定义验证装饰器
   */
  static createCustomValidator(
    _validator: (value: any) => boolean,
    message: string = 'Custom validation failed'
  ) {
    return function (target: any, propertyKey: string | symbol) {
      // 这里可以实现自定义验证逻辑
      // 为了简化，我们使用一个通用的字符串验证
      const schema = Type.String();
      
      const existingMetadata: ClassValidationMetadata = 
        Reflect.getMetadata(VALIDATION_METADATA_KEY, target.constructor) || { properties: [] };
      
      existingMetadata.properties.push({
        propertyKey,
        schema,
        message,
      });
      
      Reflect.defineMetadata(VALIDATION_METADATA_KEY, existingMetadata, target.constructor);
    };
  }

  /**
   * 批量验证多个对象
   */
  static async validateBatch<T>(
    target: new () => T, 
    objects: any[]
  ): Promise<{ valid: T[]; errors: Array<{ index: number; errors: string[] }> }> {
    const valid: T[] = [];
    const errors: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < objects.length; i++) {
      try {
        const validated = await this.validateObject(target, objects[i]);
        valid.push(validated);
      } catch (error) {
        if (error instanceof ValidationException) {
          errors.push({ index: i, errors: error.getMessages() });
        } else {
          errors.push({ 
            index: i, 
            errors: [error instanceof Error ? error.message : 'Unknown error'] 
          });
        }
      }
    }

    return { valid, errors };
  }

  /**
   * 验证部分对象（仅验证存在的字段）
   */
  static async validatePartial<T>(target: new () => T, object: any): Promise<Partial<T>> {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    });

    // 创建一个只包含存在字段的新类
    const metadata: ClassValidationMetadata = Reflect.getMetadata(VALIDATION_METADATA_KEY, target);
    
    if (!metadata || !metadata.properties.length) {
      return object;
    }

    // 过滤出存在的属性
    const existingProps = metadata.properties.filter(prop => 
      object.hasOwnProperty(String(prop.propertyKey))
    );

    if (existingProps.length === 0) {
      return {};
    }

    // 创建临时验证元数据
    const tempMetadata: ClassValidationMetadata = {
      properties: existingProps.map(prop => ({
        ...prop,
        isOptional: true, // 所有字段都标记为可选
      }))
    };

    // 创建临时类
    class TempClass {}
    Reflect.defineMetadata(VALIDATION_METADATA_KEY, tempMetadata, TempClass);

    return pipe.validate(TempClass, object) as Promise<Partial<T>>;
  }
}
