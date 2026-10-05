# @hestjs/__NAME__

用 `bun run new __NAME__ --with-web` 生成的 HestJS + Vite 全栈应用。

## 开发

```bash
bun install
bun run --filter @hestjs/__NAME__ dev
```

一条命令起两个进程：

| 进程 | 地址 | 干什么 |
| --- | --- | --- |
| API | http://localhost:3000 | HestJS（Bun 直接跑 TS，无构建） |
| 前端 | http://localhost:5173 | Vite dev server，`/api` 代理到 3000 |

## 生产

```bash
bun run --filter @hestjs/__NAME__ build   # vite build → dist/web
bun run --filter @hestjs/__NAME__ start   # Hono 同时服务 API 与静态资源
```

`src/main.ts` 里那段 `serveStatic` 只在 `dist/web/index.html` 存在时生效，
所以开发时它不干扰、生产时自动接管。

## 端到端类型

`src/web/main.ts`：

```ts
import { hc } from 'hono/client';
import type { AppType } from '../main';

const client = hc<AppType>('/');

const response = await client.api.greet[':name'].$get({ param: { name: 'world' } });
const body = await response.json();   // 类型自动推出来
```

**没有代码生成、没有契约文件。** 类型从服务端的链式路由推导，
服务端改路径这里立刻编译不过。

这也是为什么 HestJS 不用装饰器定义路由：装饰器必然是动态注册，
而动态注册不贡献任何类型，`hc` 会拿到 `unknown`。

## 结构

```
src/
├── main.ts             # 服务端入口，导出 AppType
├── app.module.ts       # 模块与控制器
├── app.module.test.ts
└── web/
    ├── index.html
    └── main.ts         # 前端入口，用 hc<AppType>
```

两个 tsconfig：`tsconfig.json` 管服务端，`tsconfig.web.json` 管前端
（带 DOM lib）。`check-types` 两个都跑。

> `tsconfig.web.json` 里带了 `types: ["bun"]`，因为前端要 `import type`
> 服务端的 `AppType`。约定：只有 `src/web/` 之外的文件可以碰 Bun API。

## 换成 React / Vue

模板刻意用原生 TypeScript —— 关键是 `hc<AppType>`，它跟框架无关。

```bash
bun add react react-dom
bun add -d @vitejs/plugin-react
```

然后把 `src/web/main.ts` 改名 `.tsx`、在 `vite.config.ts` 里加上插件即可。
服务端一行都不用动。
