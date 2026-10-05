import 'reflect-metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
    function defineMetadata(key: any, value: any, target: any, propertyKey?: string | symbol): void;
    function hasMetadata(key: any, target: any, propertyKey?: string | symbol): boolean;
    function deleteMetadata(key: any, target: any, propertyKey?: string | symbol): boolean;
    function getOwnMetadata(key: any, target: any, propertyKey?: string | symbol): any;
    function getMetadataKeys(target: any, propertyKey?: string | symbol): any[];
    function getOwnMetadataKeys(target: any, propertyKey?: string | symbol): any[];
  }
}

/**
 * 反射工具类
 */
export class Reflector {
  /**
   * 获取元数据
   */
  static get<T = any>(key: any, target: any, propertyKey?: string | symbol): T | undefined {
    return Reflect.getMetadata(key, target, propertyKey);
  }

  /**
   * 设置元数据
   */
  static set(key: any, value: any, target: any, propertyKey?: string | symbol): void {
    Reflect.defineMetadata(key, value, target, propertyKey);
  }

  /**
   * 检查是否存在元数据
   */
  static has(key: any, target: any, propertyKey?: string | symbol): boolean {
    return Reflect.hasMetadata(key, target, propertyKey);
  }

  /**
   * 删除元数据
   */
  static delete(key: any, target: any, propertyKey?: string | symbol): boolean {
    return Reflect.deleteMetadata(key, target, propertyKey);
  }

  /**
   * 获取自身元数据
   */
  static getOwn<T = any>(key: any, target: any, propertyKey?: string | symbol): T | undefined {
    return Reflect.getOwnMetadata(key, target, propertyKey);
  }

  /**
   * 获取所有元数据键
   */
  static getKeys(target: any, propertyKey?: string | symbol): any[] {
    return Reflect.getMetadataKeys(target, propertyKey);
  }

  /**
   * 获取自身所有元数据键
   */
  static getOwnKeys(target: any, propertyKey?: string | symbol): any[] {
    return Reflect.getOwnMetadataKeys(target, propertyKey);
  }

  /**
   * 合并多个目标的元数据
   */
  static getAllMetadata<T = any>(key: any, targets: any[]): T[] {
    return targets
      .map(target => this.get<T>(key, target))
      .filter((metadata): metadata is T => metadata !== undefined);
  }
}
