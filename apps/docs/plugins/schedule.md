# 定时任务

```ts
import { Cron, Interval, Timeout, schedule } from '@hestjs/schedule';

class HousekeepingTask {
  constructor(@Inject(UserRepository) private readonly users: UserRepository) {}

  @Cron('0 3 * * *', { timezone: 'Asia/Shanghai', name: 'housekeeping.nightly' })
  nightly(): Promise<void> {
    return this.users.purgeInactive();
  }

  @Interval(60_000, { name: 'housekeeping.sweep' })
  sweep(): void {
    console.log(`当前 ${this.users.count()} 个用户`);
  }

  @Timeout(5_000, { name: 'housekeeping.warmup' })
  warmup(): void {
    // 启动 5 秒后跑一次，用来预热缓存
  }
}

@Module({
  providers: [HousekeepingTask, ...schedule([HousekeepingTask])],
})
class AppModule {}
```

任务类必须显式列出来：不扫目录、不建全局注册表。

## 三个装饰器

| 装饰器 | 语义 |
| --- | --- |
| `@Cron(expression, options?)` | 标准 cron 表达式，5 / 6 / 7 段（含秒） |
| `@Interval(ms, options?)` | 每 N 毫秒跑一次 |
| `@Timeout(ms, options?)` | 延迟 N 毫秒后跑一次 |

`@Interval` / `@Timeout` 用原生定时器而不是 cron：毫秒精度是它们存在的意义，
cron 的最小粒度是秒。

cron 解析交给 [`croner`](https://croner.56k.guru/)（零依赖）。

## 选项

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `name` | `类名.方法名` | 唯一名字，用于手动触发与错误定位 |
| `timezone` | 系统时区 | IANA 时区，只对 `@Cron` 有意义 |
| `maxRuns` | 不限 | 跑多少次后自动停 |
| `overlap` | `false` | 上一次没跑完时，本次是否照常开始 |

`overlap: false` 是默认值：慢任务不会自己叠起来。

## 生命周期

`Scheduler` 实现 `OnStart` / `OnStop`：

- **`onStart`** 建好所有定时器。cron 表达式不合法、方法不存在、名字重复，
  全部在这一步报错。
- **`onStop`** 停掉所有定时器，然后**等在跑的任务结束**。
  默认一直等；想设上限就传 `shutdownTimeout`。

```ts
schedule([HousekeepingTask], {
  shutdownTimeout: 5_000,
  onError: (error, context) => logger.error({ ...context, error }),
})
```

## 错误处理

任务抛错不会让调度器停摆，也不会被静默吞掉。默认打到 `console.error`，
想接管就传 `onError`：

```ts
schedule([HousekeepingTask], {
  onError: (error, { name, task, method }) => {
    console.error(`${name}（${task}.${method}）失败：`, error);
  },
})
```

## 手动触发

`Scheduler` 是普通 provider，可以注入进来：

```ts
class AdminController {
  constructor(@Inject(Scheduler) private readonly scheduler: Scheduler) {}

  async runNow(c: Context): Promise<Response> {
    await this.scheduler.run('housekeeping.sweep');
    return c.json({ ok: true });
  }
}
```

`scheduler.names` 列出全部任务名——管理端点可以直接暴露它。

## 装配校验

| 情况 | 错误 |
| --- | --- |
| 列进来的类没有任何定时装饰器 | `NoScheduledMethodsError` |
| 两个任务用了同一个 `name` | `DuplicateScheduleNameError` |
| 被标记的方法不存在 | `UnknownScheduledMethodError` |
| cron 表达式不合法 | `InvalidScheduleSpecError` |
| `scheduler.run()` 用了不存在的名字 | `UnknownScheduleNameError` |

全部发生在 `onStart`，不会留到运行期。

## 一个实现细节

croner 的命名任务是**全局**注册表——同进程两个应用会撞名。
所以 HestJS 不把 `name` 传给 croner，而是自己用 Map 管名字。
多实例、测试并行都不会互相干扰。
