# HestJS

把 Hono 组织起来，而不是替掉它。

HestJS 不提供自己的请求/响应抽象，不接管你的服务器，也不把 Hono 实例藏起来。
它只做一件事：让你用模块和装饰器声明「谁依赖谁、哪个方法响应哪个路径」，
然后把这些声明翻译成普通的 `hono.get()` / `hono.post()`。

## 三条硬规矩

**1. Hono 实例是唯一真相。**
`createApp()` 返回的 `app.hono` 就是 Hono 实例本身——没有包装、没有代理。
`hono.route()`、`hono.use()`、`c.req.raw`、`c.var`、`c.header()` 全部照旧。

**2. 零反射依赖注入。**
不依赖 `reflect-metadata`，不依赖 `emitDecoratorMetadata`。
依赖写在 `static inject` 里，一眼可见；换成任何打包器都不会在编译期静默失效。

**3. 装饰器只写元数据，不接管执行。**
`@Module()` / `@Controller()` / `@Get()` 只往几张表里写字。
真正的组装发生在 `createApp()`，而那几张表你可以直接读出来看。

## 快速开始

```ts
import type { Context } from 'hono';
import { logger } from 'hono/logger';
import { Controller, Get, Injectable, Module, createApp } from '@hestjs/core';

@Injectable()
class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('/greet')
class GreetingController {
  static readonly inject = [GreetingService] as const;

  constructor(private readonly greeting: GreetingService) {}

  @Get('/:name')
  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({ providers: [GreetingService], controllers: [GreetingController] })
class AppModule {}

const app = createApp(AppModule, {
  // configure 在控制器之前执行，中间件才能包住它们
  configure(hono) {
    hono.use(logger());
  },
});

// app.hono 就是 Hono，想加什么加什么
app.hono.get('/health', (c) => c.text('ok'));

export default { port: 3000, fetch: app.hono.fetch };
```

完整可运行版本见 [`apps/example`](./apps/example)：

```bash
bun install
bun run --filter @hestjs/example dev
```

## 仓库结构

```
packages/
├── core/                     # 模块声明、依赖容器、Hono 接线
├── typescript-config/        # 共享 tsconfig
└── eslint-config/            # 共享 ESLint 配置

apps/
├── example/                  # 最小可运行示例
└── docs/                     # Docusaurus 文档站

docs/                         # 框架设计稿
```

所有包都是 `private`，不发布到 npm：`@hestjs/core` 通过 `workspace:*` 直接引用
TypeScript 源码，没有构建步骤，改完即生效。

## 从 NestJS 借的是什么

只有两样：**模块化的心智模型**，和**声明式的开发体验**。

- 模块、provider、controller、生命周期钩子
- 构造函数注入的写法（但依赖是显式的，不是反射推断的）

## 刻意不做的事

| 不做 | 用什么代替 |
| --- | --- |
| 自己的 Request / Response 抽象 | Hono 的 `Context`，控制器方法第一个参数就是它 |
| 自己的路由匹配 | `hono.on()` / `hono.all()`，注册完你就能在 `app.hono.routes` 里看到 |
| 自己的校验 | Hono 的 `validator()`，或任何 Standard Schema 实现 |
| 自己的日志 | 任何中间件；`apps/example` 里用的是 `hono/logger` |
| 模块作用域隔离 | 一个容器，谁依赖谁由你在模块里写清楚 |
| `emitDecoratorMetadata` | `static inject` |
| 发布到 npm | `workspace:*` 直接引源码 |

## 环境要求

- Bun >= 1.2（唯一运行时与包管理器）
- TypeScript >= 5.8
- 每个 tsconfig 必须显式打开 `experimentalDecorators`

> ⚠️ Bun 的转译器**不解析包名形式的 `extends`**（`@hestjs/typescript-config/base.json`）。
> 请用相对路径：`"extends": "../../packages/typescript-config/base.json"`。
> 漏掉 `experimentalDecorators` 时，`@Get()` 会被当成 stage-3 标准装饰器处理，
> 结果是一条路由都注册不上——`createApp()` 会直接抛错告诉你怎么修。

## 许可

[MIT](./LICENSE)
