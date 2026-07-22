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

  // tsyringe 的原始行为是直接构造未注册的类，使 Container 失去白名单语义。
  // 现已改为显式拒绝，这与模块可见性控制是配套的（见 #14 / #17）。
  it('未注册的类 token 会抛错，而不是被构造', () => {
    class NeverRegistered {}

    expect(() => container.resolve(NeverRegistered)).toThrow(
      /Cannot resolve unregistered token "NeverRegistered"/,
    );
    expect(container.isRegistered(NeverRegistered)).toBe(false);
  });

  it('未注册的字符串 token 报错时给出可读名称', () => {
    expect(() => container.resolve('MISSING_TOKEN' as never)).toThrow(/MISSING_TOKEN/);
  });

  it('未注册的 symbol token 报错时给出可读名称', () => {
    const token = Symbol('SOME_TOKEN');

    expect(() => container.resolve(token as never)).toThrow(/SOME_TOKEN/);
  });

  it('tryResolve 对未注册 token 返回 undefined 而不抛错', () => {
    class Nope {}

    expect(container.tryResolve(Nope)).toBeUndefined();
  });

  it('tryResolve 对已注册 token 返回实例', () => {
    container.register(SingletonService, SingletonService);

    expect(container.tryResolve(SingletonService)).toBeInstanceOf(SingletonService);
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
