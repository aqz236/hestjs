# 快速开始

## 环境要求

- [Bun](https://bun.sh/) >= 1.2 —— 唯一运行时与包管理器
- TypeScript >= 5.8
- 每个 `tsconfig.json` 必须显式打开 `experimentalDecorators`

## 一个完整的应用

```ts title="src/app.module.ts"
import type { Context } from 'hono';
import { Inject, Module } from '@hestjs/core';

class Greeting {
  hello(name: string): string {
    return `hello ${name}`;
  }
}

class GreetingController {
  constructor(@Inject(Greeting) private readonly greeting: Greeting) {}

  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.hello(c.req.param('name')) });
  }
}

@Module({ providers: [Greeting, GreetingController] })
export class AppModule {}

export { GreetingController };
```

```ts title="src/main.ts"
import { logger } from 'hono/logger';
import { createApp } from '@hestjs/core';
import { AppModule, GreetingController } from './app.module';

const app = createApp(AppModule, {
  // middleware 在路由之前执行
  middleware: [logger()],

  // 路由就是 Hono 的路由
  routes: (hono, resolve) => {
    const greeting = resolve(GreetingController);
    return hono
      .get('/health', (c) => c.text('ok'))
      .get('/greet/:name', (c) => greeting.say(c));
  },
});

await app.start();

export type AppType = typeof app.hono;
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
```

```bash
bun run src/main.ts
curl http://localhost:3000/greet/ada   # {"message":"hello ada"}
curl http://localhost:3000/health      # ok
```

完整版本见仓库里的 `apps/example`。

## tsconfig 的两条要求

```json title="tsconfig.json"
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

**`extends` 必须用相对路径。** Bun 的转译器不解析包名形式的 `extends`
（`@hestjs/typescript-config/base.json`），读不到 `experimentalDecorators`
就会把装饰器当成 stage-3 标准装饰器处理，元数据写到别处去了。

> 不需要 `emitDecoratorMetadata`。Bun 支持它，但 HestJS 不用它——
> 依赖由 `@Inject()` 显式声明，不靠编译产物里的类型信息。

## 目录建议

```
src/
├── main.ts                 # 组装、注册路由、启动
├── app.module.ts           # 根模块
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts # 普通 provider，方法收 Context
│   ├── users.service.ts
│   └── users.repository.ts
└── shared/
    └── database.module.ts
```

模块跟着业务切，一个目录一个模块。`apps/example` 就是这么放的。
