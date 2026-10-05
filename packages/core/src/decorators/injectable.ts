import 'reflect-metadata';
import { injectable } from 'tsyringe';
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
 *
 * 注意：这里必须使用 tsyringe 的 `injectable()`，不能用 `autoInjectable()`。
 *
 * 两者的差别是决定性的：
 * - `injectable()` 把构造参数类型写入 tsyringe 的 typeInfo 注册表，
 *   使 `container.resolve(SomeClass)` 能够构造带依赖的类。
 * - `autoInjectable()` **不写** typeInfo，而是返回一个子类，在其构造函数里
 *   通过 tsyringe 的**全局单例容器** `instance.resolve()` 解析依赖。
 *
 * 使用 autoInjectable() 会导致两个问题：
 * 1. 任何带构造参数的类都无法被 `Container.resolve()` 构造，
 *    直接抛 `TypeInfo not known for "X"`；
 * 2. 依赖解析走全局容器，绕过 HestJS 自己的 Container 子容器，
 *    因此在 Container 上注册的 provider 对外不可见。
 *
 * 没有构造参数的类会「碰巧」可用（tsyringe 直接 `new ctor()`），
 * 这使得该缺陷容易被掩盖。
 */
export function Injectable(options: InjectableMetadata = {}): ClassDecorator {
  return (target: any) => {
    const metadata: InjectableMetadata = {
      scope: options.scope || Scope.SINGLETON,
    };

    Reflect.defineMetadata(METADATA_KEYS.INJECTABLE, metadata, target);

    // 写入 tsyringe 的 typeInfo，使构造函数注入可通过容器解析
    injectable()(target);

    return target;
  };
}
