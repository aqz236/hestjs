import { Type, type TSchema, type Static } from '@sinclair/typebox';
import 'reflect-metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(key: any, value: any, target: any, propertyKey?: string | symbol): void;
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
  }
}

/**
 * 验证元数据键
 */
export const VALIDATION_METADATA_KEY = Symbol('validation');

/**
 * 属性验证元数据
 */
export interface PropertyValidationMetadata {
  propertyKey: string | symbol;
  schema: TSchema;
  isOptional?: boolean;
  message?: string;
}

/**
 * 类验证元数据
 */
export interface ClassValidationMetadata {
  properties: PropertyValidationMetadata[];
}

/**
 * 创建属性验证装饰器
 */
function createPropertyValidator(schema: TSchema, options: { message?: string; optional?: boolean } = {}) {
  return function (target: any, propertyKey: string | symbol) {
    const existingMetadata: ClassValidationMetadata = Reflect.getMetadata(VALIDATION_METADATA_KEY, target.constructor) || { properties: [] };
    
    const propertyMetadata: PropertyValidationMetadata = {
      propertyKey,
      schema,
      isOptional: options.optional,
      message: options.message,
    };
    
    existingMetadata.properties.push(propertyMetadata);
    Reflect.defineMetadata(VALIDATION_METADATA_KEY, existingMetadata, target.constructor);
  };
}

/**
 * 字符串验证装饰器
 */
export function IsString(options: { message?: string; minLength?: number; maxLength?: number; pattern?: string } = {}) {
  let schema = Type.String();
  
  if (options.minLength !== undefined) {
    schema = Type.String({ minLength: options.minLength });
  }
  if (options.maxLength !== undefined) {
    schema = Type.String({ maxLength: options.maxLength });
  }
  if (options.pattern) {
    schema = Type.String({ pattern: options.pattern });
  }
  if (options.minLength !== undefined && options.maxLength !== undefined) {
    schema = Type.String({ minLength: options.minLength, maxLength: options.maxLength });
  }
  
  return createPropertyValidator(schema, { message: options.message });
}

/**
 * 数字验证装饰器
 */
export function IsNumber(options: { message?: string; minimum?: number; maximum?: number; multipleOf?: number } = {}) {
  let schema = Type.Number();
  
  if (options.minimum !== undefined) {
    schema = Type.Number({ minimum: options.minimum });
  }
  if (options.maximum !== undefined) {
    schema = Type.Number({ maximum: options.maximum });
  }
  if (options.multipleOf !== undefined) {
    schema = Type.Number({ multipleOf: options.multipleOf });
  }
  if (options.minimum !== undefined && options.maximum !== undefined) {
    schema = Type.Number({ minimum: options.minimum, maximum: options.maximum });
  }
  
  return createPropertyValidator(schema, { message: options.message });
}

/**
 * 整数验证装饰器
 */
export function IsInteger(options: { message?: string; minimum?: number; maximum?: number } = {}) {
  let schema = Type.Integer();
  
  if (options.minimum !== undefined && options.maximum !== undefined) {
    schema = Type.Integer({ minimum: options.minimum, maximum: options.maximum });
  } else if (options.minimum !== undefined) {
    schema = Type.Integer({ minimum: options.minimum });
  } else if (options.maximum !== undefined) {
    schema = Type.Integer({ maximum: options.maximum });
  }
  
  return createPropertyValidator(schema, { message: options.message });
}

/**
 * 布尔值验证装饰器
 */
export function IsBoolean(options: { message?: string } = {}) {
  const schema = Type.Boolean();
  return createPropertyValidator(schema, { message: options.message });
}

/**
 * 邮箱验证装饰器
 */
export function IsEmail(options: { message?: string } = {}) {
  const schema = Type.String({ 
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  });
  return createPropertyValidator(schema, { message: options.message || 'Must be a valid email address' });
}

/**
 * URL 验证装饰器
 */
export function IsUrl(options: { message?: string } = {}) {
  const schema = Type.String({ 
    pattern: '^https?:\\/\\/.+'
  });
  return createPropertyValidator(schema, { message: options.message || 'Must be a valid URL' });
}

/**
 * 数组验证装饰器
 */
export function IsArray(itemSchema?: TSchema, options: { message?: string; minItems?: number; maxItems?: number } = {}) {
  let schema = itemSchema ? Type.Array(itemSchema) : Type.Array(Type.Any());
  
  if (options.minItems !== undefined || options.maxItems !== undefined) {
    const arrayOptions: any = {};
    if (options.minItems !== undefined) arrayOptions.minItems = options.minItems;
    if (options.maxItems !== undefined) arrayOptions.maxItems = options.maxItems;
    schema = itemSchema ? Type.Array(itemSchema, arrayOptions) : Type.Array(Type.Any(), arrayOptions);
  }
  
  return createPropertyValidator(schema, { message: options.message });
}

/**
 * 枚举验证装饰器
 */
export function IsEnum(enumValues: any[], options: { message?: string } = {}) {
  const schema = Type.Union(enumValues.map(value => Type.Literal(value)));
  return createPropertyValidator(schema, { message: options.message || `Must be one of: ${enumValues.join(', ')}` });
}

/**
 * 日期验证装饰器
 */
export function IsDate(options: { message?: string } = {}) {
  const schema = Type.String({ format: 'date-time' });
  return createPropertyValidator(schema, { message: options.message || 'Must be a valid date' });
}

/**
 * 可选字段装饰器
 */
export function IsOptional() {
  return function (target: any, propertyKey: string | symbol) {
    const existingMetadata: ClassValidationMetadata = Reflect.getMetadata(VALIDATION_METADATA_KEY, target.constructor) || { properties: [] };
    
    // 查找对应的属性元数据并标记为可选
    const propertyMetadata = existingMetadata.properties.find(p => p.propertyKey === propertyKey);
    if (propertyMetadata) {
      propertyMetadata.isOptional = true;
    }
    
    Reflect.defineMetadata(VALIDATION_METADATA_KEY, existingMetadata, target.constructor);
  };
}

/**
 * 长度验证装饰器
 */
export function Length(min: number, max?: number, options: { message?: string } = {}) {
  const schema = max !== undefined 
    ? Type.String({ minLength: min, maxLength: max })
    : Type.String({ minLength: min });
  
  const message = options.message || (
    max !== undefined 
      ? `Length must be between ${min} and ${max} characters`
      : `Length must be at least ${min} characters`
  );
  
  return createPropertyValidator(schema, { message });
}

/**
 * 最小值验证装饰器
 */
export function Min(value: number, options: { message?: string } = {}) {
  const schema = Type.Number({ minimum: value });
  return createPropertyValidator(schema, { message: options.message || `Must be at least ${value}` });
}

/**
 * 最大值验证装饰器
 */
export function Max(value: number, options: { message?: string } = {}) {
  const schema = Type.Number({ maximum: value });
  return createPropertyValidator(schema, { message: options.message || `Must be at most ${value}` });
}

/**
 * 模式匹配验证装饰器
 */
export function Matches(pattern: string | RegExp, options: { message?: string } = {}) {
  const patternString = pattern instanceof RegExp ? pattern.source : pattern;
  const schema = Type.String({ pattern: patternString });
  return createPropertyValidator(schema, { message: options.message || `Must match pattern: ${patternString}` });
}
