import type { Context, Env } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { Inject, Module, createApp } from '@hestjs/core';
import type { OnStart, OnStop } from '@hestjs/core';
import { documented, openApiRoutes } from '@hestjs/openapi';
import { validate } from '@hestjs/validation';

// ─────────────────────────────────────────────────────────────
// 校验用 zod，但框架不认识 zod —— 只认 Standard Schema。
// 换 valibot / arktype 一样跑，改一行 import 就行。
// ─────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(50),
});

// ─────────────────────────────────────────────────────────────
// 基础设施模块：只把 token 借出去，不导出实现
// ─────────────────────────────────────────────────────────────

export const CLOCK = Symbol('clock');

@Module({
  providers: [{ provide: CLOCK, useFactory: () => () => new Date().toISOString() }],
  exports: [CLOCK],
})
class CoreModule {}

// ─────────────────────────────────────────────────────────────
// 数据模块：自己有资源，所以实现 OnStart / OnStop
// ─────────────────────────────────────────────────────────────

export interface User {
  readonly id: string;
  readonly name: string;
}

class UserRepository implements OnStart, OnStop {
  readonly #users = new Map<string, User>();

  onStart(): void {
    this.#users.set('1', { id: '1', name: 'Ada' });
    console.log('[repo] 已就绪');
  }

  onStop(): void {
    this.#users.clear();
    console.log('[repo] 已释放');
  }

  list(): User[] {
    return [...this.#users.values()];
  }

  find(id: string): User | undefined {
    return this.#users.get(id);
  }

  add(name: string): User {
    const id = String(this.#users.size + 1);
    const user: User = { id, name };
    this.#users.set(id, user);
    return user;
  }
}

@Module({ providers: [UserRepository], exports: [UserRepository] })
class DataModule {}

// ─────────────────────────────────────────────────────────────
// 业务层：只看得见 DataModule 与 CoreModule export 的东西
// ─────────────────────────────────────────────────────────────

class UserService {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(CLOCK) private readonly now: () => string,
  ) {}

  list(): User[] {
    return this.repository.list();
  }

  get(id: string): User | undefined {
    return this.repository.find(id);
  }

  create(name: string): User {
    return this.repository.add(name);
  }

  timestamp(): string {
    return this.now();
  }
}

/**
 * 控制器就是普通 provider。
 *
 * 它不声明路径 —— 路径属于路由，路由是 Hono 的事。
 * 方法第一个参数永远是 Hono 的 Context。
 */
class UserController {
  constructor(@Inject(UserService) private readonly users: UserService) {}

  list(c: Context): Response {
    return c.json({ data: this.users.list(), at: this.users.timestamp() });
  }

  detail(c: Context<Env, '/users/:id'>): Response {
    const user = this.users.get(c.req.param('id'));
    return user === undefined ? c.json({ message: 'not found' }, 404) : c.json({ data: user });
  }

  create(c: Context): Response {
    const input = c.req.valid('json' as never) as { name: string };
    return c.json({ data: this.users.create(input.name) }, 201);
  }
}

@Module({
  imports: [DataModule, CoreModule],
  providers: [UserService, UserController],
})
class AppModule {}

// ─────────────────────────────────────────────────────────────
// 组装：middleware 在路由之前，routes 用 Hono 自己的 API
// ─────────────────────────────────────────────────────────────

const app = createApp(AppModule, {
  middleware: [
    logger(),
    async (c, next) => {
      c.header('x-powered-by', 'hestjs');
      await next();
    },
  ],

  routes: (hono, resolve) => {
    const users = resolve(UserController);

    return hono
      .get('/health', (c) => c.text('ok'))
      .get(
        '/users',
        documented({
          summary: '列出全部用户',
          tags: ['users'],
          responses: { '200': { description: '用户列表' } },
        }),
        (c) => users.list(c),
      )
      .get(
        '/users/:id',
        documented({ summary: '按 id 查用户', tags: ['users'] }),
        (c) => users.detail(c),
      )
      .post(
        '/users',
        validate({
          body: CreateUserSchema,
          jsonSchema: { body: z.toJSONSchema(CreateUserSchema) },
        }),
        documented({
          summary: '创建用户',
          tags: ['users'],
          responses: { '201': { description: '创建成功' } },
        }),
        (c) => users.create(c),
      );
  },
});

// 文档：显式挂上去，不藏在 createApp 里
app.hono.route(
  '/',
  openApiRoutes({
    hono: app.hono,
    info: { title: 'HestJS Example', version: '0.0.0', description: '最小可运行示例' },
  }),
);

// app.hono 就是 Hono 实例，想干什么都行
app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

/** 给客户端用：`hc<AppType>` 能拿到完整的 RPC 类型。 */
export type AppType = typeof app.hono;

export { app };
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
