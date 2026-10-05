---
sidebar_position: 3
---

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
| `src/app.module.ts` | 一个 provider + 一个 controller |
| `src/app.module.test.ts` | 三条断言，保证 `bun test` 不会空跑 |

需要更多东西的时候，看 `apps/example`——那是完整示例，
它跟框架一起演进，不会腐坏。

## 选项

```bash
bun run new api --dir apps/nested    # 指定位置
bun run new api --force              # 目标已存在时先删掉
```

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

## 不用生成器也行

就三个文件。直接复制 `apps/example`，改掉 `package.json` 里的 `name`，
把用不上的模块删掉就好。生成器只是省你一次复制粘贴。
