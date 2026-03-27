import { HestFactory } from "@hestjs/core";
import { logger } from "@hestjs/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppModule } from "./app.module";
import { exceptionMiddleware, responseMiddleware } from "./common/middleware";

async function bootstrap() {
  try {
    logger.info("🚀 Starting HestJS application...");

    // 创建 Hono 实例
    const hono = new Hono();
    hono.use(cors()); // 使用 Hono 的 CORS 中间件
    hono.use('*', exceptionMiddleware); // 异常处理中间件
    hono.use('*', responseMiddleware); // 响应包装中间件
    // hono.use('*', log()); // 使用 Hono 的日志中间件

    await HestFactory.create(hono, AppModule);

    Bun.serve({
      port: 3002,
      fetch: hono.fetch,
      reusePort: true, // 启用端口复用
    });

    logger.info(`🎉 Server is running on http://localhost:3002`);
  } catch (error) {
    logger.error("❌ Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
