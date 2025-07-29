# 快速开始

5 分钟内创建并运行你的第一个 HestJS 应用。

## 1. 创建项目

```bash
# 创建项目（会有交互式选择）
npx create-hest-app@latest my-app

# 或者用 bunx
bunx create-hest-app@latest my-app
```

创建过程中的选择：
- ESLint: Yes  
- Template: Base - A simple HestJS application
- Swagger/Scalar: 可选
- Package manager: bun
- Install dependencies: 可选

## 2. 安装依赖并启动

```bash
cd my-app
bun install
bun dev
```

应用启动后会显示：
```
[INFO] 🚀 Starting HestJS application...
[INFO] 🔍 Mapped {/api, GET}
[INFO] ✅ Module AppModule initialized
```

访问 http://localhost:3002/api 查看效果。

## 3. 理解代码

### 应用入口 (src/index.ts)
```typescript
import { HestFactory } from "@hestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  
  // 使用 Bun.serve 启动服务器
  Bun.serve({
    port: 3002,
    fetch: app.hono().fetch,
    reusePort: true,
  });
}

bootstrap();
```

### 控制器 (src/app.controller.ts)
```typescript
@Controller('/api')
export class AppController {
  @Get('/')
  getHello() {
    return { message: 'Hello HestJS!' };
  }
}
```

### 模块 (src/app.module.ts)
```typescript
@Module({
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

## 4. 下一步

- [详细教程](./first-application) - 创建完整的用户管理 API
- [项目结构](./project-structure) - 了解目录组织
- [核心概念](../fundamentals/controllers) - 学习框架基础

- [创建完整应用](./first-application.md) - 学习更多概念
- [项目结构](./project-structure.md) - 了解代码组织
- [基础教程](../fundamentals/controllers.md) - 深入学习
