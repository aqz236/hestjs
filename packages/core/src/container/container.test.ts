import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { Injectable } from '../decorators/injectable';
import { Module } from '../decorators/module';
import { Scope } from '../utils/constants';
import { Container } from './container';

@Injectable()
class SingletonService {}

@Injectable({ scope: Scope.TRANSIENT })
class TransientService {}

@Injectable()
class DependsOnSingleton {
  constructor(public readonly dep: SingletonService) {}
}

@Injectable()
class PlainProvider {}

class PlainController {}

@Module({})
class PlainModule {}

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('singleton：重复解析返回同一实例', () => {
    container.register(SingletonService, SingletonService);

    const a = container.resolve(SingletonService);
    const b = container.resolve(SingletonService);

    expect(a).toBeInstanceOf(SingletonService);
    expect(a).toBe(b);
    expect(container.isRegistered(SingletonService)).toBe(true);
  });

  it('transient：每次解析返回新实例', () => {
    container.register(TransientService, TransientService);

    const a = container.resolve(TransientService);
    const b = container.resolve(TransientService);

    expect(a).toBeInstanceOf(TransientService);
    expect(a).not.toBe(b);
  });

  it('构造函数依赖会被自动注入（依赖 design:paramtypes 元数据）', () => {
    container.register(SingletonService, SingletonService);
    container.register(DependsOnSingleton, DependsOnSingleton);

    const resolved = container.resolve(DependsOnSingleton);

    expect(resolved.dep).toBeInstanceOf(SingletonService);
    expect(resolved.dep).toBe(container.resolve(SingletonService));
  });

  // 注意：这是 tsyringe 的既有行为，不是 HestJS 特意设计的。
  // 未注册的类 token 不会被拒绝，而是被直接构造并注入其可解析的依赖。
  // 也就是说 Container.resolve 不是「只允许已注册项」的白名单。
  // 这一点与 issue #14（模块无作用域隔离）是同一个根因。
  it('未注册的类 token 会被直接构造，而不是抛错', () => {
    class NeverRegistered {}

    expect(() => container.resolve(NeverRegistered)).not.toThrow();
    expect(container.isRegistered(NeverRegistered)).toBe(false);
  });

  it('registerInstance 按值注册', () => {
    const value = { hello: 'world' };
    container.registerInstance('CONFIG_TOKEN', value);

    expect(container.resolve('CONFIG_TOKEN' as never)).toBe(value);
  });

  describe('逻辑容器', () => {
    beforeEach(() => {
      container.register(PlainProvider, PlainProvider, 'provider');
      container.register(PlainController, PlainController, 'controller');
      container.register(PlainModule, PlainModule, 'module');
    });

    it('按类型区分条目', () => {
      expect(container.getItemsByType('provider').map((i) => i.provider)).toEqual([
        PlainProvider,
      ]);
      expect(container.getItemsByType('controller').map((i) => i.provider)).toEqual([
        PlainController,
      ]);
      expect(container.getItemsByType('module').map((i) => i.provider)).toEqual([
        PlainModule,
      ]);
    });

    it('getAllControllers 只返回控制器', () => {
      const controllers = container.getAllControllers();

      expect(controllers).toHaveLength(1);
      expect(controllers[0].provider).toBe(PlainController);
      expect(controllers[0].type).toBe('controller');
    });

    it('注册时可从 provider 上提取元数据', () => {
      const item = container.getLogicalContainer().get(PlainProvider);

      expect(item?.scope).toBe(Scope.SINGLETON);
    });
  });

  it('clear 清空实例但保留注册', () => {
    container.register(SingletonService, SingletonService);
    const before = container.resolve(SingletonService);

    container.clear();
    const after = container.resolve(SingletonService);

    expect(after).not.toBe(before);
    expect(container.isRegistered(SingletonService)).toBe(true);
  });

  it('createChild 返回新的独立容器', () => {
    const child = container.createChild();

    expect(child).toBeInstanceOf(Container);
    expect(child).not.toBe(container);
    expect(child.getContainer()).not.toBe(container.getContainer());
  });
});
