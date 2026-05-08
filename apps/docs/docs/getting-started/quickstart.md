# 快速开始

## 系统要求

开始之前，请确保你的系统满足以下要求：

- **Node.js** 18.18 或更高版本
- **Bun** 1.0 或更高版本（推荐）
- macOS、Windows（包括 WSL）或 Linux

## 自动安装

创建新的 HestJS 应用最快的方法是使用 `create-hest-app`，它会自动为你设置所有内容。要创建项目，请运行：

```bash
npx create-hest-app@latest
```

安装时，你会看到以下提示：

```bash
✔ Would you like to use ESLint? › Yes
✔ Which template would you like to use? › Base - A simple HestJS application with basic features
✔ Would you like to include Swagger/Scalar API documentation? (adds ~12MB to build size) › No
✔ Which package manager would you like to use? › bun
✔ Skip installing dependencies? › No
```

在提示完成后，`create-hest-app` 将创建一个以你的项目名称命名的文件夹并安装所需的依赖项。

如果你选择跳过安装依赖项，你需要手动安装：

```bash
cd my-app
bun install
```

## 运行开发服务器

```bash
bun dev
```

你应该会看到类似以下的输出：

```bash
[INFO] 🚀 Starting HestJS application...
[INFO] 🔍 Mapped {/api, GET}
[INFO] ✅ Module UsersModule initialized
[INFO] ✅ Module CustomValidationModule initialized  
[INFO] ✅ Module AppModule initialized
[INFO] 🔍 Mapped {/api/users, GET}
[INFO] 🆔 Mapped {/api/users/:id, GET}
[INFO] 📩 Mapped {/api/users, POST}
```

打开浏览器访问 [http://localhost:3002/api](http://localhost:3002/api) 查看结果。

## 项目结构

成功创建后，你的项目结构应该如下所示：

```
my-app/
├── src/
│   ├── index.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── modules/
│   └── common/
├── package.json
├── tsconfig.json
├── eslint.config.ts
└── README.md
```

## 编辑你的第一个页面

打开 `src/app.controller.ts` 并编辑 `getHello` 方法：

```typescript
import { Controller, Get } from '@hestjs/core';
import { Context } from 'hono';

@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(c: Context) {
    return c.json({ 
      message: 'Hello from HestJS!',
      timestamp: new Date().toISOString()
    });
  }
}
```

保存文件后，开发服务器会自动重新加载更改。

## 下一步

- [创建第一个应用](./first-application) - 构建完整的用户管理 API
- [了解项目结构](./project-structure) - 学习如何组织代码
- [核心概念](../fundamentals/controllers) - 深入了解 HestJS
- [创建完整应用](./first-application.md) - 学习更多概念
- [项目结构](./project-structure.md) - 了解代码组织
- [基础教程](../fundamentals/controllers.md) - 深入学习
