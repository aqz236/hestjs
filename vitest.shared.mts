import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

/**
 * 各包共享的 vitest 配置。
 *
 * 用 SWC 而不是 esbuild 编译测试代码：TSyringe 的构造函数注入依赖
 * `design:paramtypes` 元数据，而 esbuild 不支持 `emitDecoratorMetadata`。
 *
 * 各包在自己的 vitest.config.mts 中引用：
 *
 *   import { createVitestConfig } from '../../vitest.shared.mts';
 *   export default createVitestConfig();
 */
export function createVitestConfig() {
  return defineConfig({
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
}
