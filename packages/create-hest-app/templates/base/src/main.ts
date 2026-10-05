import { logger } from 'hono/logger';
import { createApp } from '@hestjs/core';
import { AppModule } from './app.module';

const app = createApp(AppModule, {
  // configure 在控制器挂载之前执行，中间件才能包住它们
  configure(hono) {
    hono.use(logger());

    // 裸 Hono 路由和控制器共存，没有边界
    hono.get('/health', (c) => c.text('ok'));
  },
});

// app.hono 就是 Hono 实例，想加什么加什么
app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

export { app };
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
