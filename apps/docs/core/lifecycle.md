# 生命周期

模块是纯声明，钩子挂在**有资源的东西**上：

```ts
import type { OnStart, OnStop } from '@hestjs/core';

@Injectable()
class Postgres implements OnStart, OnStop {
  #pool?: Pool;

  async onStart(): Promise<void> {
    this.#pool = await createPool();
  }

  async onStop(): Promise<void> {
    await this.#pool?.end();
  }
}
```

## 执行顺序

`app.start()` 做两件事：

1. 构造**全部**单例（按模块依赖顺序、模块内按声明顺序）
2. 按同样的顺序执行 `onStart()`

构造错误会在第 1 步集中暴露——拼错的 token、缺失的 provider，
启动时就炸，而不是等某个请求打进来。

`app.stop()` 逆序执行 `onStop()`。

```ts
const app = createApp(AppModule);
await app.start();

process.on('SIGTERM', async () => {
  await app.stop();
  process.exit(0);
});
```

## 幂等

`start()` / `stop()` 重复调用是安全的：`start()` 第二次直接返回，
`stop()` 在没启动过时什么都不做。

## 为什么模块没有钩子

NestJS 的模块有 `onModuleInit` 之类的钩子。这里刻意没有：

**模块负责结构，provider 负责资源。** 把「谁依赖谁」和「谁该连接数据库」
分开写，两者就不会互相污染。一个模块里通常只有一个东西真的需要
连接外部资源，钩子长在它自己身上最清楚。
