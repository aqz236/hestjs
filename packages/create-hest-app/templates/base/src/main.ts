import { logger } from 'hono/logger';
import { createApp } from '@hestjs/core';
import { AppModule, GreetingController } from './app.module';

const app = createApp(AppModule, {
  // middleware 在路由之前执行 —— Hono 里后注册的中间件包不住先注册的路由
  middleware: [logger()],

  // 路由就是 Hono 的路由。返回的链式 Hono 决定了 app.hono 的类型，
  // 所以 hc<typeof app.hono> 能拿到完整的 RPC 类型。
  routes: (hono, resolve) => {
    const greeting = resolve(GreetingController);

    return hono
      .get('/health', (c) => c.text('ok'))
      .get('/greet/:name', (c) => greeting.say(c));
  },
});

// app.hono 就是 Hono 实例，想加什么加什么
app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

/** 给客户端用：`hc<AppType>` 拿得到完整类型。 */
export type AppType = typeof app.hono;

export { app };
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
