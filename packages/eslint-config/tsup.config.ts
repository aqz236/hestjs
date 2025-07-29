import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'eslint.config.ts',
    'react.config.ts',
    'vue.config.ts',
    'base.config.ts',
  ],
  format: ['esm'],
  dts: true, // 启用类型声明文件生成
  clean: true,
  minify: false,
  target: 'es2022', // 使用更现代的目标
  platform: 'node',
  outDir: 'dist',
  splitting: false, // ESLint 配置不需要代码分割
  sourcemap: false, // 配置文件不需要 sourcemap
  treeshake: true, // 启用 tree shaking
  external: [
    // ESLint 相关依赖标记为外部依赖，避免打包
    '@eslint/js',
    'typescript-eslint',
    'eslint-plugin-import',
    'eslint-plugin-promise',
    'eslint-plugin-unicorn',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'eslint-plugin-vue',
  ],
});
