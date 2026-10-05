import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

/**
 * 用 SWC 而不是 esbuild 编译测试代码。
 *
 * 原因：TSyringe 的构造函数注入依赖 `design:paramtypes` 元数据，
 * 而 esbuild 不支持 `emitDecoratorMetadata`。这里显式写出 SWC 配置，
 * 不依赖 unplugin-swc 从 tsconfig 推断（推断在 vitest 下不稳定）。
 *
 * 文件用 .mts 后缀：本包是 CommonJS（tsc 产物为 CJS，scalar 等包用
 * require 加载它），若用 .ts 会被当作 CJS 解析而报警告。
 */
export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        // TSyringe 在某些解析路径上依赖原始类名
        keepClassNames: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/test-setup.ts',
        'src/index.ts',
      ],
    },
  },
});
