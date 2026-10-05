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

依赖用 `@Inject` 明写，路由用 Hono 自己的 API 注册。
`app.hono` 是原样的 Hono 实例——想加中间件、加裸路由，随时可以。
`export type AppType` 让客户端能用 `hc<AppType>` 拿到完整 RPC 类型。

完整示例（多模块、作用域、生命周期、校验、文档）见仓库里的 `apps/example`。
