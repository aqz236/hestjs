import 'reflect-metadata';

// 声明 Reflect.getMetadata 方法
declare global {
  namespace Reflect {
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
  }
}

/**
 * 检查是否为类构造函数
 */
export function isConstructor(target: any): target is new (...args: any[]) => any {
  return typeof target === 'function' && target.prototype && target.prototype.constructor === target;
}

/**
 * 获取函数参数类型
 */
export function getParamTypes(target: any, propertyKey?: string | symbol): any[] {
  if (propertyKey) {
    return Reflect.getMetadata('design:paramtypes', target.prototype, propertyKey) || [];
  }
  return Reflect.getMetadata('design:paramtypes', target) || [];
}

/**
 * 获取函数返回类型
 */
export function getReturnType(target: any, propertyKey: string | symbol): any {
  return Reflect.getMetadata('design:returntype', target.prototype, propertyKey);
}

/**
 * 生成唯一标识符
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 深度合并对象
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * 检查是否为对象
 */
function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}
