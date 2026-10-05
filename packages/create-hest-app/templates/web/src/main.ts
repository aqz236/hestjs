import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { createApp } from '@hestjs/core';
import { AppModule, GreetingController } from './app.module';

const app = createApp(AppModule, {
  middleware: [logger()],

  routes: (hono, resolve) => {
    const greeting = resolve(GreetingController);

    // API 挂在 /api 下，和前端静态资源分开，不会互相遮住。
    //
    // 路径必须写成字面量：Hono 从字面量推路由类型，写成变量或拼接
    // 会让 hc<AppType> 的路径类型退化成 string。
    return hono
      .get('/api/health', (c) => c.text('ok'))
      .get('/api/greet/:name', (c) => greeting.say(c));
  },
});

// 生产环境：把 Vite 的构建产物挂上去。开发时没有 dist/web，这一段不生效，
// 前端由 Vite dev server 提供。
const WEB_DIST = new URL('../dist/web', import.meta.url).pathname;

if (await Bun.file(`${WEB_DIST}/index.html`).exists()) {
  app.hono.use('/*', serveStatic({ root: WEB_DIST }));

  const spaFallback = serveStatic({ root: WEB_DIST, path: '/index.html' });

  // SPA 回退：没命中文件的路径交给 index.html，让前端路由接管。
  // 但 /api/* 要排除掉 —— 未知的 API 路径应该 404，不该返回一张 HTML。
  //
  // 注意 serveStatic 要 root + **相对 root** 的 path，绝对 path 不生效。
  app.hono.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api/')) {
      await next();
      return;
    }
    return spaFallback(c, next);
  });
}

app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

/**
 * 前端用它拿到端到端类型：`hc<AppType>('/')`。
 *
 * 没有代码生成、没有契约文件 —— 类型直接从服务端的链式路由推导出来。
 */
export type AppType = typeof app.hono;

export { app };
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
