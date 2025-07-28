# 🚀 创建第一个 HestJS 应用

本章节将带你快速创建并运行一个 HestJS 应用，体验高性能 TypeScript 后端开发。

## 步骤一：初始化项目

假设你已完成依赖安装，直接在项目根目录执行：

```bash
bun run dev
```

或使用 Turbo：

```bash
turbo run dev --filter=@hestjs/demo
```

## 步骤二：编写主入口文件

在 `src/index.ts`：

```typescript
import { Application } from '@hestjs/core';
import { AppModule } from './app.module';

const app = new Application(AppModule);
app.listen(3002, () => {
  console.log('HestJS 服务已启动：http://localhost:3002');
});
```

## 步骤三：定义根模块

在 `src/app.module.ts`：

```typescript
import { Module } from '@hestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 步骤四：创建控制器与服务

在 `src/app.controller.ts`：

```typescript
import { Controller, Get } from '@hestjs/core';
import { AppService } from './app.service';

@Controller('/api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo() {
    return this.appService.getInfo();
  }
}
```

在 `src/app.service.ts`：

```typescript
export class AppService {
  getInfo() {
    return {
      name: 'HestJS',
      version: '1.0.0',
      description: '高性能 TypeScript 后端框架',
    };
  }
}
```

## 步骤五：访问 API

启动后，访问 `http://localhost:3002/api`，即可看到应用信息。

> 🎉 恭喜，你已成功创建第一个 HestJS 应用！

---

下一步：了解项目结构与最佳实践。
