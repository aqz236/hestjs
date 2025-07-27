# @hestjs/eslint-config

<div align="center">

![HestJS Logger](https://img.shields.io/badge/HestJS-Eslint-Config-blue?style=for-the-badge&logo=typescript)

**ESLint 配置包，为 HestJS Framework 项目提供统一的代码风格和质量检查。**

[![npm version](https://img.shields.io/npm/v/@hestjs/eslint-config?style=flat-square)](https://www.npmjs.com/package/@hest/logger)
[![downloads](https://img.shields.io/npm/dm/@hestjs/eslint-config?style=flat-square)](https://www.npmjs.com/package/@hest/logger)
[![license](https://img.shields.io/npm/l/@hestjs/eslint-config?style=flat-square)](https://github.com/aqz236/hestjs-eslint-config/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

</div>

## 特性

- 🎯 现代 ESLint 平坦配置格式
- 🔧 TypeScript 优先
- ⚛️ React 支持
- 💚 Vue 支持
- 📦 零配置，开箱即用
- 🚀 基于最新的 ESLint 和 TypeScript 规则

## 安装

```bash
bun add -D @hestjs/eslint-config
```

## 使用方法

### 基础配置

在项目根目录创建 `eslint.config.ts`:

```typescript
// eslint.config.ts
import eveConfig from '@hestjs/eslint-config';

export default eveConfig;
```

### TypeScript 项目

```typescript
// eslint.config.ts
import baseConfig from '@hestjs/eslint-config/base';

export default baseConfig;
```

### React 项目

```typescript
// eslint.config.ts
import reactConfig from '@hestjs/eslint-config/react';

export default reactConfig;
```

### Vue 项目

```typescript
// eslint.config.ts
import vueConfig from '@hestjs/eslint-config/vue';

export default vueConfig;
```

### 自定义配置

```typescript
// eslint.config.ts
import eveConfig from '@hestjs/eslint-config';

export default [
  ...eveConfig,
  {
    // 你的自定义规则
    rules: {
      'no-console': 'off',
    },
  },
];
```

### 直接使用 TypeScript 源文件（推荐用于开发环境）

如果你想直接使用 TypeScript 源文件获得更好的开发体验：

```typescript
// eslint.config.ts
import eveConfig from '@hestjs/eslint-config/source';

export default eveConfig;
```

或者：

```typescript
// eslint.config.ts
import reactConfig from '@hestjs/eslint-config/react/source';

export default reactConfig;
```

### 如果环境不支持 TypeScript 配置

```javascript
// eslint.config.js (降级方案)
import eveConfig from '@hestjs/eslint-config';

export default eveConfig;
```

## 包含的规则

### 基础规则

- 强制使用单引号
- 要求分号
- 禁止多个空行
- 强制使用 === 而不是 ==
- 更多代码风格规则...

### TypeScript 规则

- 优先使用类型导入
- 禁止使用 any 类型（警告）
- 强制使用可选链操作符
- 强制使用空值合并操作符
- 更多 TypeScript 最佳实践...

### React 规则

- React Hooks 规则
- React Refresh 规则
- JSX 最佳实践

### Vue 规则

- Vue 3 推荐规则
- 组件命名规范
- 模板语法检查

## 脚本配置

在 `package.json` 中添加：

```json
{
  "scripts": {
    "lint": "eslint . --config eslint.config.ts",
    "lint:fix": "eslint . --config eslint.config.ts --fix"
  }
}
```

## VS Code 配置

在 `.vscode/settings.json` 中添加：

```json
{
  "eslint.experimental.useFlatConfig": true,
  "eslint.options": {
    "overrideConfigFile": "eslint.config.ts"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 许可证

MIT
