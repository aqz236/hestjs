import wfConfig from '@hestjs/eslint-config';

export default [
  ...wfConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'error', // Demo 应用允许使用 console 进行调试
    },
  },
  {
    // 忽略构建产物和临时文件
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.d.ts',
      '.bun/**',
      'bun.lockb',
      // shadcn 目录
      'src/components/ui/**',
      // scripts 目录
      'scripts/**',
    ],
  },
];
