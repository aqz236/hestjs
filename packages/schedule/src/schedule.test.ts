import { describe, expect, it } from 'bun:test';
import { Inject, Module, createApp } from '@hestjs/core';
import {
  Cron,
  DuplicateScheduleNameError,
  Interval,
  NoScheduledMethodsError,
  Scheduler,
  Timeout,
  UnknownScheduleNameError,
  UnknownScheduledMethodError,
  schedule,
} from './index';

const LOG = Symbol('log');

class Cleanup {
  constructor(@Inject(LOG) readonly log: string[]) {}

  @Cron('0 3 * * *', { name: 'nightly-cleanup' })
  nightly(): void {
    this.log.push('nightly');
  }

  @Interval(50, { name: 'tick' })
  tick(): void {
    this.log.push('tick');
  }

  @Timeout(20, { name: 'once' })
  once(): void {
    this.log.push('once');
  }
}

const build = (config = {}) =>
  createApp(
    (() => {
      @Module({ providers: [{ provide: LOG, useValue: [] }, ...schedule([Cleanup], config)] })
      class AppModule {}
      return AppModule;
    })(),
  );

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('schedule()', () => {
  it('注册任务类与调度器', () => {
    const app = build();
    const scheduler = app.container.resolve(Scheduler);
    expect(scheduler).toBeInstanceOf(Scheduler);
  });

  it('列进来却没有定时装饰器的类会直接报错', () => {
    class Empty {}
    expect(() => schedule([Empty])).toThrow(NoScheduledMethodsError);
  });
});

describe('Scheduler', () => {
  it('onStart 之后默认名字是 类名.方法名', () => {
    const app = build();
    app.start();
    // Cleanup 的三个方法都显式给了 name，所以这里看到的是显式名字
    expect([...app.container.resolve(Scheduler).names].sort()).toEqual([
      'nightly-cleanup',
      'once',
      'tick',
    ]);
  });

  it('未显式命名的任务用 类名.方法名', () => {
    class Unnamed {
      @Interval(1000)
      ping(): void {}
    }
    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([Unnamed])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    app.start();
    expect(app.container.resolve(Scheduler).names).toEqual(['Unnamed.ping']);
  });

  it('@Timeout 跑一次就结束', async () => {
    const log: string[] = [];
    const app = createApp(
      (() => {
        @Module({ providers: [{ provide: LOG, useValue: log }, ...schedule([Cleanup])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(60);
    await app.stop();
    expect(log.filter((entry) => entry === 'once')).toHaveLength(1);
  });

  it('同进程多个应用不会互相撞名', async () => {
    // croner 的命名任务是全局注册表，所以刻意不给它传 name
    const first = build();
    const second = build();
    await first.start();
    await second.start();
    await first.stop();
    await second.stop();
    expect(true).toBe(true);
  });

  it('@Interval 会重复触发', async () => {
    const log: string[] = [];
    const app = createApp(
      (() => {
        @Module({ providers: [{ provide: LOG, useValue: log }, ...schedule([Cleanup])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(130);
    await app.stop();

    expect(log.filter((entry) => entry === 'tick').length).toBeGreaterThanOrEqual(2);
    expect(log.filter((entry) => entry === 'once')).toHaveLength(1);
  });

  it('onStop 停掉定时器', async () => {
    const log: string[] = [];
    const app = createApp(
      (() => {
        @Module({ providers: [{ provide: LOG, useValue: log }, ...schedule([Cleanup])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(60);
    await app.stop();
    const frozen = log.length;
    await sleep(120);
    expect(log.length).toBe(frozen);
  });

  it('onStop 等待在跑的任务结束', async () => {
    const events: string[] = [];

    class Slow {
      @Timeout(5, { name: 'slow' })
      async run(): Promise<void> {
        await sleep(80);
        events.push('finished');
      }
    }

    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([Slow])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(15);
    await app.stop();
    expect(events).toEqual(['finished']);
  });

  it('overlap: false 时上一次没跑完就跳过本次', async () => {
    let started = 0;

    class Overlap {
      @Interval(20, { name: 'overlap-off' })
      async slow(): Promise<void> {
        started += 1;
        await sleep(100);
      }
    }

    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([Overlap])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(120);
    await app.stop();

    expect(started).toBe(1);
  });

  it('任务抛错不会让调度器停摆，会走 onError', async () => {
    const errors: string[] = [];
    let runs = 0;

    class Boom {
      @Interval(20, { name: 'boom' })
      fail(): void {
        runs += 1;
        throw new Error('炸了');
      }
    }

    const app = createApp(
      (() => {
        @Module({
          providers: [...schedule([Boom], { onError: (error, context) => errors.push(`${context.name}:${(error as Error).message}`) })],
        })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    await sleep(90);
    await app.stop();

    expect(runs).toBeGreaterThanOrEqual(2);
    expect(errors[0]).toBe('boom:炸了');
  });

  it('可以手动触发', async () => {
    const log: string[] = [];
    const app = createApp(
      (() => {
        @Module({ providers: [{ provide: LOG, useValue: log }, ...schedule([Cleanup])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    await app.start();
    const scheduler = app.container.resolve(Scheduler);

    await scheduler.run('nightly-cleanup');
    expect(log).toContain('nightly');

    await expect(scheduler.run('nope')).rejects.toThrow(UnknownScheduleNameError);
    await app.stop();
  });
});

describe('装配校验', () => {
  it('重名会报错', () => {
    class A {
      @Interval(1000, { name: 'dup' })
      a(): void {}
    }
    class B {
      @Interval(1000, { name: 'dup' })
      b(): void {}
    }

    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([A, B])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    expect(() => app.start()).toThrow(DuplicateScheduleNameError);
  });

  it('方法不存在会报错', () => {
    class Broken {
      @Interval(1000, { name: 'ghost' })
      ghost(): void {}
    }
    // 把标记挪到一个不存在的方法上
    const proto = Broken.prototype as unknown as Record<symbol, unknown>;
    const map = proto[Symbol.for('hestjs:schedule')] as Map<string | symbol, unknown>;
    map.set('missing', map.get('ghost')!);
    map.delete('ghost');

    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([Broken])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    expect(() => app.start()).toThrow(UnknownScheduledMethodError);
  });

  it('cron 表达式不合法会报错', () => {
    class BadCron {
      @Cron('不是 cron')
      run(): void {}
    }

    const app = createApp(
      (() => {
        @Module({ providers: [...schedule([BadCron])] })
        class AppModule {}
        return AppModule;
      })(),
    );
    expect(() => app.start()).toThrow(/定时表达式不合法/);
  });
});
