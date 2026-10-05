import 'reflect-metadata';
import { autoInjectable } from 'tsyringe';
import { METADATA_KEYS, Scope } from '../utils/constants';
import type { InjectableMetadata } from '../interfaces/metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(key: any, value: any, target: any, propertyKey?: string | symbol): void;
  }
}

/**
 * 可注入装饰器
 * @param options 注入选项
 */
export function Injectable(options: InjectableMetadata = {}): ClassDecorator {
  return (target: any) => {
    const metadata: InjectableMetadata = {
      scope: options.scope || Scope.SINGLETON,
    };
    
    Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, metadata, target);

    // 使用 autoInjectable 来自动解析依赖
    // 这样就不需要手动 @Inject 装饰器了
    autoInjectable()(target);
    return target;
  };
}
