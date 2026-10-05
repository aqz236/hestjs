import { describe, expect, it } from 'bun:test';
import { Inject, Module, createApp } from '@hestjs/core';
import {
  DuplicateJobHandlerError,
  DuplicateProcessorError,
  MemoryQueueDriver,
  MissingProcessorDecoratorError,
  NoProcessorJobsError,
  Process,
  Processor,
  Queue,
  QueueRunner,
  UnknownQueueError,
  queue,
  type QueuedJob,
} from './index';

const SINK = Symbol('sink');

interface Sink {
  readonly received: QueuedJob[];
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Processor('mail')
class MailProcessor {
  constructor(@Inject(SINK) private readonly sink: Sink) {}

  @Process('welcome')
  welcome(job: QueuedJob): void {
    this.sink.received.push(job);
  }

  @Process('reset')
  reset(job: QueuedJob): void {
    this.sink.received.push(job);
  }
}

function build(config = {}): ReturnType<typeof createApp> {
  const sink: Sink = { received: [] };
  @Module({
    providers: [{ provide: SINK, useValue: sink }, ...queue([MailProcessor], config)],
  })
  class AppModule {}
  return createApp(AppModule);
}

describe('queue()', () => {
  it('注册 processor 与 Queue / QueueRunner', () => {
    const app = build();
    expect(app.container.resolve(Queue)).toBeInstanceOf(Queue);
    expect(app.container.resolve(QueueRunner).queues).toEqual(['mail']);
  });

  it('列进来却没有 @Process 的类会报错', () => {
    @Processor('empty')
    class Empty {}
    expect(() => queue([Empty])).toThrow(NoProcessorJobsError);
  });

  it('没有 @Processor 的类会报错', () => {
    class Bare {
      @Process('x')
      run(): void {}
    }
    expect(() => queue([Bare])).toThrow(MissingProcessorDecoratorError);
  });

  it('两个 processor 抢同一个队列会报错', () => {
    @Processor('dup')
    class A {
      @Process('a')
      run(): void {}
    }
    @Processor('dup')
    class B {
      @Process('b')
      run(): void {}
    }
    expect(() => queue([A, B])).toThrow(DuplicateProcessorError);
  });

  it('同一个队列里的同名任务会报错', () => {
    @Processor('x')
    class A {
      @Process('same')
      a(): void {}
      @Process('same')
      b(): void {}
    }
    expect(() => queue([A])).toThrow(DuplicateJobHandlerError);
  });
});

describe('投递与消费', () => {
  it('任务被送到对应的方法', async () => {
    const app = build();
    await app.start();

    const sink = app.container.resolve<Sink>(SINK);
    await app.container.resolve(Queue).enqueue('mail', 'welcome', { name: 'Ada' });
    await sleep(30);

    expect(sink.received).toHaveLength(1);
    expect(sink.received[0]!.name).toBe('welcome');
    expect(sink.received[0]!.payload).toEqual({ name: 'Ada' });
    expect(sink.received[0]!.attempt).toBe(1);

    await app.stop();
  });

  it('未声明的任务名被静默忽略，不报错', async () => {
    const app = build();
    await app.start();
    const sink = app.container.resolve<Sink>(SINK);

    await app.container.resolve(Queue).enqueue('mail', 'nope', {});
    await sleep(30);

    expect(sink.received).toHaveLength(0);
    await app.stop();
  });

  it('enqueue 早于 onStart 时不会丢任务', async () => {
    const app = build();
    const sink = app.container.resolve<Sink>(SINK);

    await app.container.resolve(Queue).enqueue('mail', 'welcome', { early: true });
    await app.start();
    await sleep(30);

    expect(sink.received).toHaveLength(1);
    expect(sink.received[0]!.payload).toEqual({ early: true });
    await app.stop();
  });

  it('未知队列直接报错', async () => {
    const app = build();
    await app.start();
    await expect(app.container.resolve(Queue).enqueue('nope', 'x', {})).rejects.toThrow(
      UnknownQueueError,
    );
    await app.stop();
  });

  it('delay 生效', async () => {
    const app = build();
    await app.start();
    const sink = app.container.resolve<Sink>(SINK);

    await app.container.resolve(Queue).enqueue('mail', 'welcome', {}, { delay: 60 });
    await sleep(25);
    expect(sink.received).toHaveLength(0);
    await sleep(70);
    expect(sink.received).toHaveLength(1);
    await app.stop();
  });
});

describe('重试', () => {
  it('按 attempts 重试，策略跟着任务走', async () => {
    const attempts: number[] = [];

    @Processor('flaky')
    class Flaky {
      @Process('boom')
      run(job: QueuedJob): void {
        attempts.push(job.attempt);
        if (job.attempt < 3) {
          throw new Error('还不行');
        }
      }
    }

    @Module({ providers: [...queue([Flaky])] })
    class AppModule {}

    const app = createApp(AppModule);
    await app.start();
    await app.container
      .resolve(Queue)
      .enqueue('flaky', 'boom', {}, { attempts: 3, backoffDelay: 10 });
    await sleep(120);

    expect(attempts).toEqual([1, 2, 3]);
    await app.stop();
  });

  it('重试用尽时走 onError', async () => {
    const errors: string[] = [];

    @Processor('always-fails')
    class AlwaysFails {
      @Process('boom')
      run(): void {
        throw new Error('永远失败');
      }
    }

    @Module({
      providers: [
        ...queue([AlwaysFails], {
          onError: (error, job) => errors.push(`${job.name}:${(error as Error).message}`),
        }),
      ],
    })
    class AppModule {}

    const app = createApp(AppModule);
    await app.start();
    await app.container
      .resolve(Queue)
      .enqueue('always-fails', 'boom', {}, { attempts: 2, backoffDelay: 10 });
    await sleep(100);

    expect(errors).toEqual(['boom:永远失败']);
    await app.stop();
  });
});

describe('生命周期', () => {
  it('onStop 等在跑的任务结束', async () => {
    const events: string[] = [];

    @Processor('slow')
    class Slow {
      @Process('run')
      async run(): Promise<void> {
        await sleep(70);
        events.push('done');
      }
    }

    @Module({ providers: [...queue([Slow])] })
    class AppModule {}

    const app = createApp(AppModule);
    await app.start();
    await app.container.resolve(Queue).enqueue('slow', 'run', {});
    await sleep(15);
    await app.stop();

    expect(events).toEqual(['done']);
  });

  it('onStop 之后不再取新任务', async () => {
    const app = build();
    await app.start();
    await app.stop();

    const sink = app.container.resolve<Sink>(SINK);
    await app.container.resolve(Queue).enqueue('mail', 'welcome', {});
    await sleep(30);
    expect(sink.received).toHaveLength(0);
  });

  it('方法不存在时在启动期就报错', async () => {
    @Processor('broken')
    class Broken {
      @Process('ghost')
      ghost(): void {}
    }
    const proto = Broken.prototype as unknown as Record<symbol, unknown>;
    const map = proto[Symbol.for('hestjs:queue:process')] as Map<string, Array<string | symbol>>;
    map.set('missing', ['nope']);
    map.delete('ghost');

    @Module({ providers: [...queue([Broken])] })
    class AppModule {}

    const app = createApp(AppModule);
    await expect(app.start()).rejects.toThrow(/实例上没有这个方法/);
  });
});

describe('driver 可替换', () => {
  it('可以传入自己的 driver', async () => {
    const enqueued: string[] = [];
    const driver = new MemoryQueueDriver();
    const wrapped = {
      enqueue: async (job: Parameters<typeof driver.enqueue>[0]) => {
        enqueued.push(job.name);
        await driver.enqueue(job);
      },
      consume: driver.consume.bind(driver),
    };

    const sink: Sink = { received: [] };
    @Module({
      providers: [
        { provide: SINK, useValue: sink },
        ...queue([MailProcessor], { driver: wrapped }),
      ],
    })
    class AppModule {}

    const app = createApp(AppModule);
    await app.start();
    await app.container.resolve(Queue).enqueue('mail', 'welcome', {});
    await sleep(30);

    expect(enqueued).toEqual(['welcome']);
    await app.stop();
  });
});
