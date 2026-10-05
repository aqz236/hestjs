import type { Context } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import type { OnStart, OnStop } from '@hestjs/core';
import { Controller, Get, Injectable, Module, Post, createApp } from '@hestjs/core';
import type { RouteContext } from '@hestjs/core';
import { Describe, openApiRoutes } from '@hestjs/openapi';
import { Body, type InferInput, type ValidatedBody } from '@hestjs/validation';

// ─────────────────────────────────────────────────────────────
// 校验用 zod，但框架不认识 zod —— 只认 Standard Schema。
// 换 valibot / arktype 一样跑，改一行 import 就行。
// ─────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(50),
});

type CreateUserInput = InferInput<typeof CreateUserSchema>;

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

@Injectable()
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
// 业务模块：只看得见 DataModule 与 CoreModule export 的东西
// ─────────────────────────────────────────────────────────────

@Injectable()
class UserService {
  static readonly inject = [UserRepository, CLOCK] as const;

  constructor(
    private readonly repository: UserRepository,
    private readonly now: () => string,
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

@Controller('/users')
class UserController {
  static readonly inject = [UserService] as const;

  constructor(private readonly users: UserService) {}

  @Get('/')
  @Describe({
    summary: '列出全部用户',
    tags: ['users'],
    responses: { '200': { description: '用户列表' } },
  })
  list(c: Context): Response {
    return c.json({ data: this.users.list(), at: this.users.timestamp() });
  }

  @Get('/:id')
  @Describe({ summary: '按 id 查用户', tags: ['users'] })
  detail(c: RouteContext<'/users/:id'>): Response {
    const user = this.users.get(c.req.param('id'));
    return user === undefined ? c.json({ message: 'not found' }, 404) : c.json({ data: user });
  }

  @Post('/')
  @Body(CreateUserSchema, { jsonSchema: z.toJSONSchema(CreateUserSchema) })
  @Describe({
    summary: '创建用户',
    tags: ['users'],
    responses: { '201': { description: '创建成功' } },
  })
  create(c: RouteContext<'/users', ValidatedBody<CreateUserInput>>): Response {
    const input = c.req.valid('json');
    return c.json({ data: this.users.create(input.name) }, 201);
  }
}

@Module({
  imports: [DataModule, CoreModule],
  providers: [UserService],
  controllers: [UserController],
})
class UsersFeatureModule {}

@Module({ imports: [UsersFeatureModule] })
class AppModule {}

// ─────────────────────────────────────────────────────────────
// 组装：configure 在控制器之前跑，中间件才能包住它们
// ─────────────────────────────────────────────────────────────

const app = createApp(AppModule, {
  configure(hono) {
    hono.use(logger());
    hono.use('*', async (c, next) => {
      c.header('x-powered-by', 'hestjs');
      await next();
    });

    // 原生 Hono 路由和控制器共存，没有边界
    hono.get('/health', (c) => c.text('ok'));
  },
});

// 文档：显式挂上去，不藏在 createApp 里
app.hono.route(
  '/',
  openApiRoutes({
    graph: app.graph,
    info: { title: 'HestJS Example', version: '0.0.0', description: '最小可运行示例' },
  }),
);

// app.hono 就是 Hono 实例，想干什么都行
app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

export { app };
export default { port: Number(process.env.PORT ?? 3000), fetch: app.hono.fetch };
