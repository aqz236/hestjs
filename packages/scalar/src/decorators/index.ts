/**
 * API 属性装饰器
 * 用于标记 DTO 属性的 OpenAPI 元数据
 */
export function ApiProperty(options: {
  description?: string;
  example?: any;
  type?: any;
  required?: boolean;
  enum?: any[];
}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    
    const existingMetadata = Reflect.getMetadata('api:properties', target.constructor) || {};
    existingMetadata[propertyKey] = options;
    Reflect.defineMetadata('api:properties', existingMetadata, target.constructor);
  };
}

/**
 * API 响应装饰器
 * 用于标记控制器方法的响应信息
 */
export function ApiResponse(options: {
  status: number;
  description: string;
  type?: any;
  schema?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    if (!propertyKey) return;
    
    const existingMetadata = Reflect.getMetadata('api:responses', target.constructor) || {};
    if (!existingMetadata[propertyKey]) {
      existingMetadata[propertyKey] = [];
    }
    existingMetadata[propertyKey].push(options);
    Reflect.defineMetadata('api:responses', existingMetadata, target.constructor);
  };
}

/**
 * API 标签装饰器
 * 用于为控制器添加 OpenAPI 标签
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('api:tags', tags, target);
  };
}

/**
 * API 操作装饰器
 * 用于标记控制器方法的操作信息
 */
export function ApiOperation(options: {
  summary?: string;
  description?: string;
  operationId?: string;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    if (!propertyKey) return;
    
    Reflect.defineMetadata('api:operation', options, target, propertyKey);
  };
}

/**
 * API 参数装饰器
 * 用于标记路径参数、查询参数等
 */
export function ApiParam(options: {
  name: string;
  description?: string;
  type?: any;
  required?: boolean;
  example?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    if (!propertyKey) return;
    
    const existingMetadata = Reflect.getMetadata('api:parameters', target.constructor) || {};
    if (!existingMetadata[propertyKey]) {
      existingMetadata[propertyKey] = [];
    }
    existingMetadata[propertyKey].push({ ...options, in: 'path' });
    Reflect.defineMetadata('api:parameters', existingMetadata, target.constructor);
  };
}

/**
 * API 查询参数装饰器
 */
export function ApiQuery(options: {
  name: string;
  description?: string;
  type?: any;
  required?: boolean;
  example?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    if (!propertyKey) return;
    
    const existingMetadata = Reflect.getMetadata('api:parameters', target.constructor) || {};
    if (!existingMetadata[propertyKey]) {
      existingMetadata[propertyKey] = [];
    }
    existingMetadata[propertyKey].push({ ...options, in: 'query' });
    Reflect.defineMetadata('api:parameters', existingMetadata, target.constructor);
  };
}

/**
 * API 请求体装饰器
 */
export function ApiBody(options: {
  description?: string;
  type?: any;
  required?: boolean;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined, descriptor: PropertyDescriptor) => {
    if (!propertyKey) return;
    
    Reflect.defineMetadata('api:body', options, target, propertyKey);
  };
}
