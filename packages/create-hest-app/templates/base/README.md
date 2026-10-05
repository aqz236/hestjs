# @hestjs/__NAME__

用 `bun run new __NAME__` 生成的 HestJS 应用。

```bash
bun install
bun run --filter @hestjs/__NAME__ dev
curl http://localhost:3000/health
curl http://localhost:3000/greet/ada
```

## 结构

```
src/
├── main.ts             # 组装与启动
└── app.module.ts       # 模块与控制器
```

依赖写在 `static inject` 里，路由写在 `@Controller` / `@Get` 上，
`app.hono` 是原样的 Hono 实例——想加中间件、加裸路由，随时可以。

完整示例（多模块、作用域、生命周期、校验、文档）见仓库里的 `apps/example`。
