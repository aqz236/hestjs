import 'reflect-metadata';
import { METADATA_KEYS } from '../utils/constants';
import type { ModuleMetadata } from '../interfaces/metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(key: any, value: any, target: any, propertyKey?: string | symbol): void;
    function hasMetadata(key: any, target: any, propertyKey?: string | symbol): boolean;
  }
}

/**
 * 模块装饰器
 * @param metadata 模块元数据
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(METADATA_KEYS.MODULE, metadata, target);
    
    // 确保模块可以被注入
    if (!Reflect.hasMetadata(METADATA_KEYS.INJECTABLE, target)) {
      Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, { scope: 'singleton' }, target);
    }
  };
}
