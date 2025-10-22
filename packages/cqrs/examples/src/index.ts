import { HestFactory } from "@hestjs/core";
import { CqrsModule } from "@hestjs/cqrs";
import { CreateUserHandler } from "./handlers/create-user.handler";
import { GetUserHandler } from "./handlers/get-user.handler";
import { UserCreatedHandler } from "./handlers/user-created.handler";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  console.log("Starting CQRS Demo...");

  // 初始化CQRS模块
  CqrsModule.forRoot();

  // 获取CQRS模块实例
  const cqrsModule = CqrsModule.getInstance();

  // 注册所有处理器
  cqrsModule.registerHandler(CreateUserHandler);
  cqrsModule.registerHandler(GetUserHandler);
  cqrsModule.registerHandler(UserCreatedHandler);

  // 启动CQRS模块
  await cqrsModule.onApplicationBootstrap();

  // 创建HestJS应用
  const app = await HestFactory.create(AppModule);

  // 启动应用
  const port = process.env.PORT || 3000;
  console.log(`CQRS Demo running on port ${port}`);

  return app;
}

// 如果是直接运行此文件
if (require.main === module) {
  bootstrap().catch(console.error);
}

export { bootstrap };
