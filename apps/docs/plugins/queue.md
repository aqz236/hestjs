# 后台任务

```ts
import { Process, Processor, Queue, queue, type QueuedJob } from '@hestjs/queue';

@Processor('mail')
class MailProcessor {
  constructor(@Inject(Transport) private readonly transport: Transport) {}

  @Process('welcome')
  async welcome(job: QueuedJob): Promise<void> {
    const { to } = job.payload as { to: string };
    await this.transport.send(to, '欢迎');
  }
}

@Module({
  providers: [MailProcessor, ...queue([MailProcessor])],
})
class AppModule {}
```

投递：

```ts
class Users {
  constructor(@Inject(Queue) private readonly queue: Queue) {}

  async create(name: string): Promise<void> {
    const user = await this.repo.insert(name);
    await this.queue.enqueue('mail', 'welcome', { to: user.email });
  }
}
```

## 三个概念

| 概念 | 是什么 |
| --- | --- |
| **队列** | 一个字符串名字，例如 `'mail'` |
| **任务** | 队列里的一条消息，有名字和 payload，例如 `'welcome'` |
| **processor** | 消费某个队列的类，用 `@Process('任务名')` 声明每条任务由哪个方法处理 |

一个队列只能有一个 processor。要横向扩容就多开几个进程——
那是部署问题，不是代码问题。

## ⚠️ 内置驱动是内存的

`MemoryQueueDriver` 只在**单进程内存**里排队：

- ✅ 单实例部署的后台任务、开发与测试
- ❌ 进程重启后未处理的任务会丢，也没有跨进程协调

生产环境请实现 `QueueDriver` 换上去：

```ts
export interface QueueDriver {
  enqueue(job: EnqueuedJob): Promise<void>;
  consume(
    queue: string,
    handler: (job: QueuedJob) => Promise<void>,
    options: { concurrency: number },
  ): Promise<() => Promise<void>>;
}
```

**重试策略、生命周期、错误处理都在框架这侧**，驱动只负责「排队」与「取任务」。
所以换驱动不会改变你写 processor 的方式。

```ts
queue([MailProcessor], { driver: new RedisQueueDriver({ url: 'redis://...' }) })
```

## 投递选项

```ts
await queue.enqueue('mail', 'welcome', { to }, {
  delay: 5_000,              // 5 秒后才可被消费
  attempts: 3,               // 最多试 3 次
  backoff: 'exponential',    // 10s / 20s / ...
  backoffDelay: 1_000,
})
```

重试策略**跟着任务走**，所以重试时不依赖调用方再传一次。

## 并发

```ts
queue([MailProcessor], { concurrency: 4 })
```

一个队列同时处理几条。默认 1。

## 生命周期

`QueueRunner` 实现 `OnStart` / `OnStop`：

- **`onStart`** 开始消费。方法不存在、队列重复声明、任务名重复，
  全部在这一步报错。
- **`onStop`** 停止取新任务，然后**等在跑的任务结束**。

`onStop` 之后再投递的任务不会被处理——关闭是有序的。

## 错误处理

重试用尽（或 `attempts: 1`）后走 `onError`，默认打到 `console.error`：

```ts
queue([MailProcessor], {
  onError: (error, job) => logger.error({ job: job.id, queue: job.queue, error }),
})
```

## 装配校验

| 情况 | 错误 |
| --- | --- |
| 列进来的类没有 `@Processor()` | `MissingProcessorDecoratorError` |
| 列进来的类没有任何 `@Process` | `NoProcessorJobsError` |
| 两个 processor 抢同一个队列 | `DuplicateProcessorError` |
| 同一个类里两条 `@Process` 重名 | `DuplicateJobHandlerError` |
| 被标记的方法不存在 | `UnknownJobHandlerError`（`onStart`） |
| 投递到未注册的队列 | `UnknownQueueError` |

## 可以自己查

```ts
app.container.resolve(QueueRunner).queues   // 已注册的队列
app.container.resolve(Queue).queues         // 同上，从生产者视角
```
