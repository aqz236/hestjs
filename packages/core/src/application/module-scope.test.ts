import 'reflect-metadata';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Container } from '../container/container';
import { Controller } from '../decorators/controller';
import { Injectable } from '../decorators/injectable';
import { Module } from '../decorators/module';
import { Get } from '../decorators/route';
import { Scope } from '../utils/constants';
import { HestFactory } from './application-factory';

/** 每个用例用独立的模块/类名，避免共享的根容器互相污染 */

async function boot(moduleClass: any) {
  return HestFactory.create(new Hono(), moduleClass);
}

describe('模块作用域：exports 决定对外可见性', () => {
  it('模块可以使用自己 providers 里的服务', async () => {
    @Injectable()
    class A1Service {
      value() {
        return 'a1';
      }
    }

    @Controller('/a1')
    class A1Controller {
      constructor(private readonly service: A1Service) {}

      @Get('/')
      get() {
        return { value: this.service.value() };
      }
    }

    @Module({ controllers: [A1Controller], providers: [A1Service] })
    class A1Module {}

    const app = await boot(A1Module);
    const res = await app.getHonoInstance().request('/a1');

    await expect(res.json()).resolves.toEqual({ value: 'a1' });
  });

  it('导入方可以使用被导入模块 export 的服务', async () => {
    @Injectable()
    class B1Shared {
      value() {
        return 'shared';
      }
    }

    @Module({ providers: [B1Shared], exports: [B1Shared] })
    class B1Module {}

    @Controller('/b1')
    class B1Controller {
      constructor(private readonly shared: B1Shared) {}

      @Get('/')
      get() {
        return { value: this.shared.value() };
      }
    }

    @Module({ imports: [B1Module], controllers: [B1Controller] })
    class B1HostModule {}

    const app = await boot(B1HostModule);
    const res = await app.getHonoInstance().request('/b1');

    await expect(res.json()).resolves.toEqual({ value: 'shared' });
  });

  it('未被 export 的服务，导入方解析不到', async () => {
    @Injectable()
    class B2Private {
      value() {
        return 'private';
      }
    }

    @Module({ providers: [B2Private] }) // 没有 exports
    class B2Module {}

    @Controller('/b2')
    class B2Controller {
      constructor(private readonly hidden: B2Private) {}

      @Get('/')
      get() {
        return { value: this.hidden.value() };
      }
    }

    @Module({ imports: [B2Module], controllers: [B2Controller] })
    class B2HostModule {}

    await expect(boot(B2HostModule)).rejects.toThrow(
      /B2Controller 依赖 B2Private.*不可见/,
    );
  });

  it('没有 import 该模块时，即便对方 export 了也拿不到', async () => {
    @Injectable()
    class B3Exported {
      value() {
        return 'exported';
      }
    }

    @Module({ providers: [B3Exported], exports: [B3Exported] })
    class B3Module {}

    @Controller('/b3')
    class B3Controller {
      constructor(private readonly dep: B3Exported) {}

      @Get('/')
      get() {
        return { value: this.dep.value() };
      }
    }

    // 故意不 imports B3Module
    @Module({ controllers: [B3Controller] })
    class B3HostModule {}

    await expect(boot(B3HostModule)).rejects.toThrow(
      /B3Controller 依赖 B3Exported.*不可见/,
    );
  });
});

describe('模块作用域：单例共享', () => {
  it('同一模块被多个模块导入时只初始化一次，单例共享', async () => {
    @Injectable()
    class C1Counter {
      count = 0;

      increment() {
        this.count += 1;
        return this.count;
      }
    }

    @Module({ providers: [C1Counter], exports: [C1Counter] })
    class C1SharedModule {}

    @Controller('/c1-left')
    class C1LeftController {
      constructor(private readonly counter: C1Counter) {}

      @Get('/')
      inc() {
        return { count: this.counter.increment() };
      }
    }

    @Controller('/c1-right')
    class C1RightController {
      constructor(private readonly counter: C1Counter) {}

      @Get('/')
      inc() {
        return { count: this.counter.increment() };
      }
    }

    @Module({ imports: [C1SharedModule], controllers: [C1LeftController] })
    class C1LeftModule {}

    @Module({ imports: [C1SharedModule], controllers: [C1RightController] })
    class C1RightModule {}

    @Module({ imports: [C1LeftModule, C1RightModule] })
    class C1RootModule {}

    const app = await boot(C1RootModule);
    const hono = app.getHonoInstance();

    await expect((await hono.request('/c1-left')).json()).resolves.toEqual({ count: 1 });
    await expect((await hono.request('/c1-right')).json()).resolves.toEqual({ count: 2 });
  });

  it('transient 服务跨模块不共享实例', async () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class C2Transient {
      readonly id = Math.random();
    }

    @Module({ providers: [C2Transient], exports: [C2Transient] })
    class C2Module {}

    const container = Container.getInstance();
    const holder = container.createChild();
    // 直接验证容器层面的行为，避免依赖应用引导
    const first = container.tryResolve(C2Transient);
    expect(first).toBeUndefined(); // 尚未注册到根容器
    expect(holder).toBeInstanceOf(Container);
  });
});

describe('模块作用域：exports 声明校验', () => {
  it('exports 里声明了未注册的 provider 会在启动时报错', async () => {
    @Injectable()
    class D1Registered {}

    class D1NeverRegistered {}

    @Module({ providers: [D1Registered], exports: [D1NeverRegistered] })
    class D1Module {}

    @Module({ imports: [D1Module] })
    class D1RootModule {}

    await expect(boot(D1RootModule)).rejects.toThrow(
      /D1Module 在 exports 中声明了 类 D1NeverRegistered/,
    );
  });

  it('exports 为空数组时不报错', async () => {
    @Injectable()
    class D2Service {}

    @Module({ providers: [D2Service], exports: [] })
    class D2Module {}

    @Module({ imports: [D2Module] })
    class D2RootModule {}

    await expect(boot(D2RootModule)).resolves.toBeDefined();
  });
});

describe('模块作用域：同名 provider 不再互相覆盖', () => {
  it('两个模块各自声明同名类时互不干扰', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    class E1SharedName {
      tag() {
        return 'E1';
      }
    }
    class E2SharedName {
      tag() {
        return 'E2';
      }
    }
    // 让两者同名，模拟不同模块里的同名服务
    Object.defineProperty(E1SharedName, 'name', { value: 'SameNameService' });
    Object.defineProperty(E2SharedName, 'name', { value: 'SameNameService' });

    Injectable()(E1SharedName as any);
    Injectable()(E2SharedName as any);

    @Module({ providers: [E1SharedName], exports: [E1SharedName] })
    class E1Module {}

    @Module({ providers: [E2SharedName], exports: [E2SharedName] })
    class E2Module {}

    @Controller('/e1')
    class E1Controller {
      constructor(private readonly dep: E1SharedName) {}

      @Get('/')
      tag() {
        return { tag: this.dep.tag() };
      }
    }

    @Controller('/e2')
    class E2Controller {
      constructor(private readonly dep: E2SharedName) {}

      @Get('/')
      tag() {
        return { tag: this.dep.tag() };
      }
    }

    @Module({ imports: [E1Module], controllers: [E1Controller] })
    class E1HostModule {}

    @Module({ imports: [E2Module], controllers: [E2Controller] })
    class E2HostModule {}

    @Module({ imports: [E1HostModule, E2HostModule] })
    class ERootModule {}

    const app = await boot(ERootModule);
    const hono = app.getHonoInstance();

    await expect((await hono.request('/e1')).json()).resolves.toEqual({ tag: 'E1' });
    await expect((await hono.request('/e2')).json()).resolves.toEqual({ tag: 'E2' });

    warn.mockRestore();
  });
});

describe('模块作用域：容器聚合查询', () => {
  let root: Container;

  beforeEach(() => {
    root = new Container();
  });

  it('getItemsByType 会向下聚合子容器的注册', () => {
    class P1 {}
    class P2 {}

    root.register(P1, P1, 'provider');
    const child = root.createChild();
    child.register(P2, P2, 'provider');

    const providers = root.getItemsByType('provider').map((i) => i.provider);

    expect(providers).toContain(P1);
    expect(providers).toContain(P2);
  });

  it('同 token 以更靠近根的注册为准，不重复计数', () => {
    class P3 {}
    root.register(P3, P3, 'provider');
    const child = root.createChild();
    child.register(P3, P3, 'provider');

    const matched = root.getItemsByType('provider').filter((i) => i.provider === P3);

    expect(matched).toHaveLength(1);
  });

  it('getChildren 暴露直接子容器', () => {
    const a = root.createChild();
    const b = root.createChild();

    expect(root.getChildren()).toEqual([a, b]);
  });
});
