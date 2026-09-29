# 常见问题

## 为什么构造函数注入拿不到依赖？

先确认三件事：

1. 类上标了 `@Injectable()`
2. 该类的 `tsconfig.json` 打开了 `experimentalDecorators` 与 `emitDecoratorMetadata`
3. 依赖的 token 已经注册到当前模块的容器里

第 2 条最常被漏掉。打包器方面，esbuild 不支持 `emitDecoratorMetadata`，
请用 SWC 或 `tsc`。

## 为什么测试跑不起来，报 Reflect.getMetadata 不是函数？

测试文件在求值装饰器之前必须加载 `reflect-metadata`。各包的
`src/test-setup.ts` 已经做了这件事，如果你新建了包，记得给它加一份，
并在 `vitest.config.mts` 里通过共享配置引用。

## 模块之间可以互相注入吗？

默认不行。`exports` 是真实边界：只有被模块导出的 provider 才能被其他模块
解析到。需要跨模块共享时，把 provider 放进被导入模块的 `exports`。

## 改动 `packages/*` 之后 CI 报缺 changeset 怎么办？

在仓库根目录跑：

```bash
bun run changeset
```

选择受影响的包与版本级别，生成的文件需要一并提交。详见
[贡献指南](https://github.com/aqz236/hestjs/blob/main/CONTRIBUTING.md)。

## 支持 Deno / Node 吗？

核心包只依赖 Honojs 与 TSyringe，理论上能跑在任何支持
`reflect-metadata` 的运行时上，但仓库只在 Bun 上做过验证。
