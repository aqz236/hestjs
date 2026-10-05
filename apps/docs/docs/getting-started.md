---
sidebar_position: 2
---

# 快速开始

## 环境要求

- [Bun](https://bun.sh/) >= 1.2 —— 唯一运行时与包管理器
- TypeScript >= 5.8
- 每个 `tsconfig.json` 必须显式打开 `experimentalDecorators`

## 一个完整的应用

```ts title="src/main.ts"
import type { Context } from 'hono';
import { logger } from 'hono/logger';
import { Controller, Get, Injectable, Module, createApp } from '@hestjs/core';

@Injectable()
class Greeting {
  hello(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('/greet')
class GreetingController {
  static readonly inject = [Greeting] as const;

  constructor(private readonly greeting: Greeting) {}

  @Get('/:name')
  say(c: Context): Response {
    return c.json({ message: this.greeting.hello(c.req.param('name')!) });
  }
}

@Module({ providers: [Greeting], controllers: [GreetingController] })
class AppModule {}

const app = createApp(AppModule, {
  // configure 在控制器之前执行，中间件才能包住它们
  configure(hono) {
    hono.use(logger());
  },
});

// app.hono 就是 Hono，想加什么加什么
app.hono.get('/health', (c) => c.text('ok'));

await app.start();

export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
```

```bash
bun run src/main.ts
curl http://localhost:3000/greet/ada   # {"message":"hello ada"}
curl http://localhost:3000/health      # ok
```

完整版本见仓库里的 `apps/example`。

## tsconfig 的两条硬要求

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
就会把 `@Get()` 当成 stage-3 标准装饰器，结果一条路由都注册不上。

漏了的话 `createApp()` 会直接抛错告诉你怎么修，不会静默失败。

## 目录建议

```
src/
├── main.ts                 # 组装 + 启动
├── app.module.ts           # 根模块
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.repository.ts
└── shared/
    └── database.module.ts
```

模块跟着业务切，一个目录一个模块。仓库里 `apps/example` 就是这么放的。
