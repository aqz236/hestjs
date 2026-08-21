# 测试

HestJS 用 [Vitest](https://vitest.dev/) 做单元测试，配置集中在仓库根目录的
`vitest.shared.mts`，各包通过自己的 `vitest.config.mts` 引用它。

## 为什么用 SWC 而不是 esbuild

TSyringe 的构造函数注入依赖 `design:paramtypes` 元数据，而 esbuild 不支持
`emitDecoratorMetadata`。因此测试代码必须经 SWC 编译，配置里显式打开了：

```ts
jsc: {
  parser: { syntax: 'typescript', decorators: true },
  transform: { legacyDecorator: true, decoratorMetadata: true },
  keepClassNames: true,
}
```

`keepClassNames` 也是必需的：TSyringe 在部分解析路径上依赖原始类名。

## 写一个测试

测试文件放在被测试源码旁边，命名为 `*.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { Container } from '../container/container';

describe('Container', () => {
  it('按 token 解析已注册的实例', () => {
    const container = new Container();
    container.register('answer', { useValue: 42 });
    expect(container.resolve('answer')).toBe(42);
  });
});
```

## 在测试里用装饰器

`src/test-setup.ts` 会在任何测试文件之前 `import 'reflect-metadata'`，
所以测试里可以直接写装饰器，不需要每个文件重复引入。

## 运行

```bash
bun run test              # 全仓
bun run --filter @hestjs/core test
bun run --filter @hestjs/core test:watch
```

## 覆盖率

`bun run --filter @hestjs/core test:coverage` 会输出 v8 覆盖率。
`src/index.ts`、`src/test-setup.ts` 与测试文件本身不计入统计。
