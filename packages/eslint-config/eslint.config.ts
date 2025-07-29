import * as js from '@eslint/js';
import tseslint from 'typescript-eslint';

export function createConfig(options: { tsconfigRootDir?: string } = {}) {
  return tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.strict,
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parserOptions: {
          // 如果提供了 tsconfigRootDir，则使用它
          ...(options.tsconfigRootDir && {
            tsconfigRootDir: options.tsconfigRootDir,
          }),
        },
      },
      rules: {
        // 基础规则
        'no-console': 'warn',
        'no-unused-vars': 'off', // 关闭基础规则，使用 TypeScript 版本
        'prefer-const': 'error',
        'no-var': 'error',
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],
        'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
        'no-trailing-spaces': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        quotes: ['error', 'single', { avoidEscape: true }],
        semi: ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-before-blocks': 'error',
        'keyword-spacing': 'error',

        // TypeScript 特定规则
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-extraneous-class': 'off', // 允许类中有非方法成员

        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'array' }],
        '@typescript-eslint/consistent-type-definitions': [
          'error',
          'interface',
        ],
        '@typescript-eslint/method-signature-style': ['error', 'property'],
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': 'allow-with-description',
            'ts-nocheck': 'allow-with-description',
            'ts-check': false,
          },
        ],
      },
    },
    {
      files: ['**/*.js', '**/*.mjs'],
      ...tseslint.configs.disableTypeChecked,
    },
    {
      // Logger 和演示文件的特殊配置 - 允许使用 console
      files: ['**/logger.ts', '**/logger-demo.ts', '**/node-types-demo.ts'],
      rules: {
        'no-console': 'off', // 演示文件中允许使用 console
      },
    },
    {
      ignores: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '*.d.ts',
        '.bun/**',
        'bun.lockb',
      ],
    },
  );
}

// 默认导出，向后兼容，并为本包设置 tsconfigRootDir
export default createConfig({ tsconfigRootDir: __dirname });
