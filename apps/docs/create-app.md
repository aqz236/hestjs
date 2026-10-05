# 生成一个应用

HestJS 不发布到 npm，所以脚手架也不是一个独立的 npm 包。
生成器活在仓库里，生成的也是仓库里的 workspace 成员：

```bash
bun run new my-app
```

```
已生成 apps/my-app：
  README.md
  package.json
  src/app.module.test.ts
  src/app.module.ts
  src/main.ts
  tsconfig.json

下一步：
  bun install
  bun run --filter @hestjs/my-app dev
```

## 为什么这么小

旧版的脚手架会问你选哪个模板、要不要装依赖、用不用 CQRS，
然后吐出一整棵包含示例代码的目录树。

**那些模板会腐坏。** 框架一改 API，模板就全是错的，而且没人会发现。
所以这里只生成三个源文件：

| 文件 | 内容 |
| --- | --- |
| `src/main.ts` | 组装与启动，20 行 |
| `src/app.module.ts` | 一个 service + 一个 controller |
| `src/app.module.test.ts` | 三条断言，保证 `bun test` 不会空跑 |

需要更多东西的时候，看 `apps/example`——那是完整示例，
它跟框架一起演进，不会腐坏。

## 选项

```bash
bun run new api --dir apps/nested    # 指定位置
bun run new api --force              # 目标已存在时先删掉
bun run new api --with-web           # 同时生成 Vite 前端
```

## 全栈：`--with-web`

```bash
bun run new my-app --with-web
```

在基础模板之上叠一层 Vite 前端：

```
vite.config.ts          前端构建与 /api 代理
tsconfig.web.json       前端单独一份 tsconfig（带 DOM lib）
src/main.ts             服务端入口，多一段静态资源服务
src/web/index.html
src/web/main.ts         前端入口，用 hc<AppType>
scripts/dev.ts          一条命令同时起 API 与前端
```

```bash
bun run --filter @hestjs/my-app dev
```

| 进程 | 地址 | 干什么 |
| --- | --- | --- |
| API | http://localhost:3000 | HestJS（Bun 直接跑 TS，无构建） |
| 前端 | http://localhost:5173 | Vite dev server，`/api` 代理到 3000 |

生产：

```bash
bun run --filter @hestjs/my-app build   # vite build → dist/web
bun run --filter @hestjs/my-app start   # Hono 同时服务 API 与静态资源
```

`src/main.ts` 里那段 `serveStatic` 只在 `dist/web/index.html` 存在时生效，
所以开发时它不干扰、生产时自动接管。

### 端到端类型

```ts title="src/web/main.ts"
import { hc } from 'hono/client';
import type { AppType } from '../main';

const client = hc<AppType>('/');

const response = await client.api.greet[':name'].$get({ param: { name: 'world' } });
const body = await response.json();   // 类型自动推出来
```

**没有代码生成、没有契约文件。** 类型从服务端的链式路由推导，
服务端改路径这里立刻编译不过。

> ⚠️ 控制器方法**不要**标注返回类型（`: Response`），否则 `hc` 会拿到 `unknown`。
> 见[路由](./core/routing.md#️-不要给控制器方法标注返回类型)。

### 换成 React / Vue

模板刻意用原生 TypeScript —— 关键是 `hc<AppType>`，它跟框架无关：

```bash
bun add react react-dom && bun add -d @vitejs/plugin-react
```

然后 `src/web/main.ts` 改名 `.tsx`、`vite.config.ts` 加插件。服务端一行都不用动。

目录名必须匹配 `^[a-z0-9][a-z0-9._-]*$`（和仓库治理规则一致）。
名字非法或者目录已存在都会直接拒绝，不会悄悄覆盖。

## 生成之后

```bash
bun install                                   # 让 workspace 认识它
bun run --filter @hestjs/my-app dev
curl http://localhost:3000/health             # ok
curl http://localhost:3000/greet/ada          # {"message":"hello ada"}
```

`package.json` 里用的是 `workspace:*`，`tsconfig.json` 用的是**相对路径**
`extends`——Bun 的转译器不解析包名形式的 extends，这一点在
[排障](./troubleshooting.md) 里有详细说明。

生成的应用已经带好 `export type AppType = typeof app.hono`，
客户端直接 `hc<AppType>` 就能拿到完整 RPC 类型。

## 不用生成器也行

就三个文件。直接复制 `apps/example`，改掉 `package.json` 里的 `name`，
把用不上的模块删掉就好。生成器只是省你一次复制粘贴。
